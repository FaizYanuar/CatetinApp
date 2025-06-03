// app/api/pemasukan/route.js
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig';
import {
  transactions,
  transaction_items,
  stock_movements
} from '@/utils/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    date,
    type,           // Expecting 'income' for sales
    total_amount,
    payment_method,
    notes,
    items           // [{ item_id, quantity, unit_price }, …]
  } = body;

  // 1) Insert the transaction
  const [tx] = await db.insert(transactions)
    .values({
      user_id:         userId,
      name,
      date,
      type,
      total_amount,
      payment_method,
      notes,
      is_stock_related: true
    })
    .returning({ id: transactions.id });

  // 2) Insert each transaction_items row
  await Promise.all(items.map(line =>
    db.insert(transaction_items).values({
      transaction_id: tx.id,
      item_id:        line.item_id,
      quantity:       line.quantity,
      unit_price:     line.unit_price
    })
  ));

  // 3) Record stock movements
  await Promise.all(items.map(line => {
    const isPurchase = type === 'expense';  // sales = !expense
    return db.insert(stock_movements).values({
      user_id:    userId,
      item_id:    line.item_id,
      change_qty: isPurchase ? line.quantity : -line.quantity,
      reason:     isPurchase ? 'purchase' : 'sale'
    });
  }));

  return NextResponse.json({ message: 'Transaction saved' }, { status: 201 });
}

export async function GET() {
  try {
    const results = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.type, "sale"),               
        eq(transactions.is_stock_related, true)
      ))
      .orderBy(transactions.created_at);

    return NextResponse.json(results, { status: 200 }); // ✅ unified with POST
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
