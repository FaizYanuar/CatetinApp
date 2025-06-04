// File: app/api/pemasukan/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Pastikan path ini benar
import {
  transactions,
  // transaction_items, // Tidak digunakan di GET ini, bisa dihapus jika hanya untuk GET
  // stock_movements    // Tidak digunakan di GET ini, bisa dihapus jika hanya untuk GET
} from '@/utils/schema'; // Pastikan path ini benar
import { and, eq, desc } from 'drizzle-orm'; // Import desc untuk pengurutan

// Handler untuk POST tetap sama, tidak perlu diubah jika sudah berfungsi
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, // Ini akan menjadi nama pembeli atau deskripsi penjualan
    date,
    // type: 'income', // Seharusnya sudah diatur di frontend atau default di sini
    total_amount,
    payment_method,
    notes,
    items // [{ item_id, quantity, unit_price }, …]
  } = body;

  // Validasi dasar
  if (!name || !date || !total_amount || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Missing required fields for pemasukan' }, { status: 400 });
  }
  for (const item of items) {
      if (item.item_id == null || item.quantity == null || item.unit_price == null || item.quantity <= 0) {
          return NextResponse.json({ error: 'Invalid item data: item_id, quantity, and unit_price are required, quantity > 0' }, { status: 400 });
      }
  }

  // Drizzle tidak mendukung transaksi database kompleks secara langsung dengan Neon HTTP driver.
  // Operasi akan dilakukan secara berurutan.

  try {
    // 1) Insert the transaction
    const [tx] = await db.insert(transactions)
      .values({
        user_id: userId,
        name: name, // Nama pembeli atau deskripsi penjualan
        date: date,
        type: 'income', // Pastikan tipe adalah 'income' untuk pemasukan/penjualan
        total_amount: total_amount,
        payment_method: payment_method,
        notes: notes,
        is_stock_related: true // Penjualan selalu terkait stok
      })
      .returning({ id: transactions.id });

    if (!tx || !tx.id) {
        throw new Error("Failed to create transaction header.");
    }
    const newTransactionId = tx.id;

    // 2) Insert each transaction_items row
    // Pastikan import transaction_items ada jika belum
    const { transaction_items } = await import('@/utils/schema');
    await Promise.all(items.map(line =>
      db.insert(transaction_items).values({
        transaction_id: newTransactionId,
        item_id: line.item_id,
        quantity: line.quantity,
        unit_price: line.unit_price
      })
    ));

    // 3) Record stock movements
    // Pastikan import stock_movements ada jika belum
    const { stock_movements } = await import('@/utils/schema');
    await Promise.all(items.map(line => {
      return db.insert(stock_movements).values({
        user_id: userId,
        item_id: line.item_id,
        change_qty: -line.quantity, // Penjualan mengurangi stok
        reason: 'sale',
        transaction_item_id: null // Anda mungkin perlu menghubungkan ini jika skema mendukungnya dan Anda mengambil ID item transaksi
      });
    }));

    return NextResponse.json({ message: 'Transaksi pemasukan berhasil disimpan', transactionId: newTransactionId }, { status: 201 });

  } catch (error) {
    console.error("API POST Pemasukan Error:", error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi pemasukan.', details: error.message }, { status: 500 });
  }
}


export async function GET(req) { // Tambahkan 'req' sebagai parameter
  try {
    const { userId } = getAuth(req); // Dapatkan userId dari sesi Clerk
    if (!userId) {
      // Jika tidak ada userId (pengguna tidak login), kembalikan array kosong atau error unauthorized
      // Untuk konsistensi, lebih baik kembalikan array kosong jika komponen mengharapkan array
      console.log("API GET Pemasukan: Unauthorized access attempt.");
      return NextResponse.json([], { status: 200 }); // Atau 401 jika Anda ingin frontend menangani error ini secara spesifik
    }

    console.log(`API GET Pemasukan: Mengambil data untuk userId: ${userId}`);

    // Ambil semua field yang dibutuhkan oleh frontend
    // atau gunakan .select() untuk semua field dari tabel utama
    const results = await db
      .select({
          id: transactions.id,
          name: transactions.name, // Ini akan menjadi nama pembeli di frontend
          customer_name: transactions.name, // Alias jika frontend menggunakan customer_name
          date: transactions.date,
          type: transactions.type,
          total_amount: transactions.total_amount,
          payment_method: transactions.payment_method,
          notes: transactions.notes,
          is_stock_related: transactions.is_stock_related,
          created_at: transactions.created_at
      })
      .from(transactions)
      .where(and(
        eq(transactions.user_id, userId), // Filter berdasarkan userId yang sedang login
        eq(transactions.type, "sale")   // Filter hanya transaksi 'income' (pemasukan/penjualan)
        // eq(transactions.is_stock_related, true) // Ini mungkin tidak perlu jika semua 'income' adalah penjualan terkait stok
      ))
      .orderBy(desc(transactions.date), desc(transactions.created_at)); // Urutkan terbaru dulu

    console.log(`API GET Pemasukan: ${results.length} transaksi ditemukan untuk userId: ${userId}`);
    return NextResponse.json(results, { status: 200 });

  } catch (err) {
    console.error("API GET Pemasukan Error:", err);
    return NextResponse.json({ error: "Internal Server Error fetching pemasukan", details: err.message }, { status: 500 });
  }
}
