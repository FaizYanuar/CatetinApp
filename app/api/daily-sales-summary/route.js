// File: app/api/daily-sales-summary/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig';
import { transactions } from '@/utils/schema';
import { and, eq, desc, sql, or } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("filterType") || 'last10days';
    
    // Kondisi dasar untuk query: milik user ini DAN tipenya 'sale' ATAU 'expense'
    const conditions = [
      eq(transactions.user_id, userId),
      or(
        eq(transactions.type, 'sale'), // DIUBAH: dari 'income' menjadi 'sale'
        eq(transactions.type, 'expense')
      )
    ];

    if (filterType === 'monthYear') {
      const month = searchParams.get("month");
      const year = searchParams.get("year");

      if (!month || !year) {
        return NextResponse.json({ error: 'Month and year are required for this filter type' }, { status: 400 });
      }

      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.date}) = ${parseInt(month, 10)}`);
    
    } else { // Default ke 'last10days'
      const today = new Date();
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(today.getDate() - 9);

      const startDateString = tenDaysAgo.toISOString().split('T')[0];
      const endDateString = today.toISOString().split('T')[0];

      conditions.push(sql`${transactions.date} >= ${startDateString}`);
      conditions.push(sql`${transactions.date} <= ${endDateString}`);
    }

    const allTransactions = await db
      .select({
        date: transactions.date,
        type: transactions.type,
        amount: transactions.total_amount,
      })
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date));

    // Agregasi data pemasukan dan pengeluaran per hari
    const dailySummary = allTransactions.reduce((acc, transaction) => {
      const dateKey = typeof transaction.date === 'string' ? transaction.date : transaction.date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalIncome: 0, totalExpenses: 0 };
      }
      
      // DIUBAH: dari 'income' menjadi 'sale'
      if (transaction.type === 'sale') {
        acc[dateKey].totalIncome += Number(transaction.amount);
      } else if (transaction.type === 'expense') {
        acc[dateKey].totalExpenses += Number(transaction.amount);
      }

      return acc;
    }, {});

    // Ubah objek hasil agregasi menjadi array dan urutkan berdasarkan tanggal
    const chartData = Object.values(dailySummary).sort((a, b) => new Date(a.date) - new Date(b.date));

    return NextResponse.json(chartData, { status: 200 });

  } catch (error) {
    console.error("API GET Daily Sales Summary Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
