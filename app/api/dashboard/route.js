// File: app/api/dashboard/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig';
import { transactions } from '@/utils/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      // Mengembalikan nilai nol jika tidak ada pengguna yang login
      return NextResponse.json({ totalIncome: 0, totalExpenses: 0, netIncome: 0 }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'all';
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    console.log(`API GET /dashboard-stats for userId: ${userId} with filterType: ${filterType}`);

    // Kondisi dasar untuk query, selalu filter berdasarkan userId
    const conditions = [eq(transactions.user_id, userId)];

    // Menambahkan kondisi filter tanggal secara dinamis
    if (filterType === 'year' && year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
    } else if (filterType === 'month' && year && month) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.date}) = ${parseInt(month, 10)}`);
    }
    // Jika 'all', tidak ada filter tanggal tambahan

    // Menggunakan satu query efisien dengan agregasi kondisional
    const [stats] = await db
      .select({
        totalIncome: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sale' THEN ${transactions.total_amount} ELSE 0 END), 0)`.mapWith(Number),
        totalExpenses: sql`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.total_amount} ELSE 0 END), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(and(...conditions));

    // Pastikan stats tidak null sebelum diakses
    const totalIncome = stats?.totalIncome || 0;
    const totalExpenses = stats?.totalExpenses || 0;
    const netIncome = totalIncome - totalExpenses;

    const finalStats = {
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        netIncome: netIncome
    };

    return NextResponse.json(finalStats, { status: 200 });

  } catch (err) {
    console.error("API GET Dashboard Stats Error:", err);
    return NextResponse.json({ error: "Internal Server Error fetching dashboard stats", details: err.message }, { status: 500 });
  }
}
