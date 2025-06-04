// File: app/api/latest-sales/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig'; // Ensure this path is correct for your db configuration
import { transactions } from '@/utils/schema'; // Ensure this path is correct for your schema
import { and, eq, desc } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the 7 most recent 'income' transactions for the user
    // 'name' field from transactions is used as the label for the chart.
    // 'total_amount' is the value for the bar.
    // 'date' is included for potential display in tooltips or for more detailed labeling.
    const latestSalesData = await db
      .select({
        id: transactions.id,
        name: transactions.name, // Or a more descriptive field if available
        amount: transactions.total_amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(and(
        eq(transactions.user_id, userId),
        eq(transactions.type, 'sale') // Assuming 'income' type represents sales
      ))
      .orderBy(desc(transactions.date), desc(transactions.created_at)) // Order by date, then by creation time for tie-breaking
      .limit(7); // Get the latest 7 transactions

    // Format data for the chart if needed, e.g., ensuring 'amount' is a number
    const chartData = latestSalesData.map(sale => ({
      ...sale,
      amount: Number(sale.amount), // Ensure amount is a number
      // You might want to format the name or date here for better display on the X-axis
      // For example: name: `${sale.name.substring(0, 15)}${sale.name.length > 15 ? '...' : ''} (${new Date(sale.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short'})})`
      // For simplicity, we'll use the transaction name directly or a truncated version.
      label: sale.name ? sale.name.substring(0, 20) + (sale.name.length > 20 ? "..." : "") : `Sale #${sale.id}`
    }));

    return NextResponse.json(chartData, { status: 200 });

  } catch (error) {
    console.error("API GET Latest Sales Error:", error);
    return NextResponse.json({ error: "Internal Server Error fetching latest sales.", details: error.message }, { status: 500 });
  }
}
