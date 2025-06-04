// File: app/api/dashboards/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Ensure this path is correct
import { transactions } from '@/utils/schema'; // Ensure this path is correct
import { and, eq, sum } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate Total Income (Pemasukan)
    // Fetches all transactions of type 'income' for the user and sums their total_amount.
    const incomeResult = await db
      .select({
        total: sum(transactions.total_amount).mapWith(Number) // .mapWith(Number) ensures the sum is treated as a number
      })
      .from(transactions)
      .where(and(
        eq(transactions.user_id, userId),
        eq(transactions.type, 'sale') // Assumes 'income' is the type for Pemasukan
      ));

    const totalIncome = incomeResult[0]?.total || 0; // Default to 0 if no income transactions

    // Calculate Total Expenses (Pengeluaran)
    // Fetches all transactions of type 'expense' for the user and sums their total_amount.
    const expenseResult = await db
      .select({
        total: sum(transactions.total_amount).mapWith(Number)
      })
      .from(transactions)
      .where(and(
        eq(transactions.user_id, userId),
        eq(transactions.type, 'expense') // Assumes 'expense' is the type for Pengeluaran
      ));

    const totalExpenses = expenseResult[0]?.total || 0; // Default to 0 if no expense transactions

    // Calculate Net Income (Total Pendapatan)
    const netIncome = totalIncome - totalExpenses;

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netIncome
    }, { status: 200 });

  } catch (error) {
    console.error("API GET Dashboard Stats Error:", error);
    // Provides a generic error message to the client and logs detailed error on the server.
    return NextResponse.json({ error: "Internal Server Error fetching dashboard stats.", details: error.message }, { status: 500 });
  }
}
