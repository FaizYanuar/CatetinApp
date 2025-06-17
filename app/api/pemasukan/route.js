// File: app/api/pemasukan/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Pastikan path ini benar
import {
  transactions,
  transaction_items,
  stock_movements
} from '@/utils/schema'; // Pastikan path ini benar
import { and, eq, desc, sql } from 'drizzle-orm'; // Pastikan sql diimpor

// Handler untuk POST
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, // Ini akan menjadi nama pembeli atau deskripsi penjualan
    date,
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

  try {
    // 1) Masukkan transaksi
    const [tx] = await db.insert(transactions)
      .values({
        user_id: userId,
        name: name,
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

    // 2) Masukkan setiap baris transaction_items
    await Promise.all(items.map(line =>
      db.insert(transaction_items).values({
        transaction_id: newTransactionId,
        item_id: line.item_id,
        quantity: line.quantity,
        unit_price: line.unit_price
      })
    ));

    // 3) Catat pergerakan stok
    await Promise.all(items.map(line => {
      return db.insert(stock_movements).values({
        user_id: userId,
        item_id: line.item_id,
        change_qty: -line.quantity, // Penjualan mengurangi stok
        reason: 'sale',
        transaction_item_id: null // Anda mungkin perlu menghubungkan ini jika skema mendukungnya
      });
    }));

    return NextResponse.json({ message: 'Transaksi pemasukan berhasil disimpan', transactionId: newTransactionId }, { status: 201 });

  } catch (error) {
    console.error("API POST Pemasukan Error:", error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi pemasukan.', details: error.message }, { status: 500 });
  }
}

// Handler untuk GET dengan fungsionalitas filter
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      // Mengembalikan array kosong jika tidak ada pengguna yang login
      return NextResponse.json([], { status: 200 });
    }

    // Mengambil parameter filter dari URL
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'all';
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    console.log(`API GET Pemasukan for userId: ${userId} with filterType: ${filterType}, year: ${year}, month: ${month}, date: ${date}`);

    // Kondisi dasar untuk query
    const conditions = [
      eq(transactions.user_id, userId),
      eq(transactions.type, "sale")
    ];

    // Menambahkan kondisi filter secara dinamis berdasarkan input
    if (filterType === 'year' && year) {
      // Filter hanya berdasarkan tahun
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
    } else if (filterType === 'month' && year && month) {
      // Filter berdasarkan tahun DAN bulan
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.date}) = ${parseInt(month, 10)}`);
    } else if (filterType === 'date' && date) {
      // Filter berdasarkan tanggal spesifik
      conditions.push(eq(transactions.date, date));
    }
    // Jika filterType adalah 'all', tidak ada kondisi tambahan yang diterapkan

    const results = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.created_at));

    console.log(`API GET Pemasukan: ${results.length} transaksi ditemukan.`);
    return NextResponse.json(results, { status: 200 });

  } catch (err) {
    console.error("API GET Pemasukan Error:", err);
    return NextResponse.json({ error: "Internal Server Error fetching pemasukan", details: err.message }, { status: 500 });
  }
}
