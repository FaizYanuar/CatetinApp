// File: app/api/daily-sales-summary/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Pastikan path ini benar
import { transactions } from '@/utils/schema'; // Pastikan path ini benar
import { and, eq, desc, sql } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil parameter kueri untuk jumlah hari (opsional, default 30 hari terakhir)
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    const numberOfDays = parseInt(daysParam, 10) || 30; // Default 30 hari

    // Hitung tanggal mulai
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (numberOfDays -1)); // -1 karena kita mau inklusif numberOfDays

    // Format tanggal ke YYYY-MM-DD untuk kueri SQL
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    console.log(`API daily-sales-summary: Mengambil data untuk userId: ${userId} dari ${startDateString} hingga ${endDateString}`);

    // Mengambil transaksi 'income' dalam rentang tanggal yang ditentukan
    const salesTransactions = await db
      .select({
        date: transactions.date, // Kolom tanggal
        amount: transactions.total_amount, // Kolom jumlah
      })
      .from(transactions)
      .where(and(
        eq(transactions.user_id, userId),
        eq(transactions.type, 'sale'), // Hanya transaksi pemasukan/penjualan
        sql`${transactions.date} >= ${startDateString}`, // Kondisi rentang tanggal awal
        sql`${transactions.date} <= ${endDateString}`  // Kondisi rentang tanggal akhir
      ))
      .orderBy(desc(transactions.date)); // Urutkan berdasarkan tanggal

    console.log(`API daily-sales-summary: ${salesTransactions.length} transaksi ditemukan sebelum agregasi.`);

    // Agregasi data penjualan per hari di sisi server (JavaScript)
    const dailySummary = salesTransactions.reduce((acc, transaction) => {
      // Tanggal dari DB sudah dalam format YYYY-MM-DD string atau Date object yang bisa di-string-kan
      const dateKey = typeof transaction.date === 'string' ? transaction.date : transaction.date.toISOString().split('T')[0];
      
      // Inisialisasi jika tanggal belum ada di accumulator
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey, // Simpan tanggal sebagai string YYYY-MM-DD
          totalSales: 0,
        };
      }
      // Tambahkan jumlah transaksi ke total penjualan hari itu
      acc[dateKey].totalSales += Number(transaction.amount);
      return acc;
    }, {});

    // Ubah objek hasil agregasi menjadi array dan urutkan berdasarkan tanggal (terbaru dulu)
    const chartData = Object.values(dailySummary).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Ambil 7 hari terakhir dengan penjualan (atau kurang jika tidak ada cukup data)
    const finalChartData = chartData.slice(0, 10).reverse(); // Ambil 10 data terbaru, lalu reverse agar tanggal terlama di kiri

    console.log("API daily-sales-summary: Data yang dikirim ke chart:", finalChartData);

    return NextResponse.json(finalChartData, { status: 200 });

  } catch (error) {
    console.error("API GET Daily Sales Summary Error:", error);
    return NextResponse.json({ error: "Internal Server Error fetching daily sales summary.", details: error.message }, { status: 500 });
  }
}
