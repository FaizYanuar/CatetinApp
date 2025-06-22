// File: app/api/recent-transactions/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Pastikan path ini benar
import { transactions } from '@/utils/schema'; // Pastikan path ini benar
import { and, eq, desc, or } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil parameter kueri untuk jumlah item (opsional, default 10)
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = parseInt(limitParam, 10) || 10; // Default 10 transaksi

    console.log(`API recent-transactions: Mengambil ${limit} transaksi terakhir untuk userId: ${userId}`);

    const recentTransactionsData = await db
      .select({
        id: transactions.id,
        name: transactions.name,
        type: transactions.type,
        date: transactions.date,
        paymentMethod: transactions.payment_method,
        totalAmount: transactions.total_amount,
        notes: transactions.notes,
        createdAt: transactions.created_at, // Untuk pengurutan sekunder jika tanggal sama
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.user_id, userId),
          // Ambil kedua tipe transaksi: 'income' dan 'expense'
          or(
            eq(transactions.type, 'sale'),
            eq(transactions.type, 'expense')
          )
        )
      )
      // Urutkan berdasarkan tanggal (terbaru dulu), lalu berdasarkan waktu pembuatan
      .orderBy(desc(transactions.date), desc(transactions.created_at))
      .limit(limit); // Batasi jumlah hasil

    // Format data jika diperlukan, misalnya memastikan amount adalah angka
    const formattedData = recentTransactionsData.map(tx => ({
      ...tx,
      totalAmount: Number(tx.totalAmount),
      // Terjemahkan tipe transaksi untuk tampilan yang lebih ramah pengguna
      displayType: tx.type === 'sale' ? 'Pemasukan' : (tx.type === 'expense' ? 'Pengeluaran' : tx.type),
    }));

    console.log(`API recent-transactions: ${formattedData.length} transaksi ditemukan dan dikirim.`);

    return NextResponse.json(formattedData, { status: 200 });

  } catch (error) {
    console.error("API GET Recent Transactions Error:", error);
    return NextResponse.json({ error: "Internal Server Error fetching recent transactions.", details: error.message }, { status: 500 });
  }
}
