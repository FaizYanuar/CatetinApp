  // app/api/transactions/route.js
  import { NextResponse } from 'next/server';
  import { getAuth } from '@clerk/nextjs/server';
  import { db } from '@/utils/dbConfig';
  import {
    transactions,
    transaction_items,
    stock_movements,
    items as itemsSchema,
    suppliers
  } from '@/utils/schema';
  import { and, eq, sql, desc } from 'drizzle-orm';

  // POST a new transaction
  export async function POST(req) {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await req.json();
      const {
        name,
        supplier_id,
        date,
        type,
        total_amount,
        payment_method,
        notes,
        is_stock_related,
        items
      } = body;

      if (!name || !date || !type || total_amount === undefined || total_amount === null) {
          return NextResponse.json({ error: 'Missing required transaction fields: name, date, type, total_amount' }, { status: 400 });
      }
      if (type !== 'expense' && type !== 'sale') {
          return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
      }
      if (!Array.isArray(items) || items.length === 0) {
          return NextResponse.json({ error: 'Transaction must include at least one item' }, { status: 400 });
      }
      for (const item of items) {
          if (item.item_id == null || item.quantity == null || item.unit_price == null || item.quantity <= 0) {
              return NextResponse.json({ error: 'Invalid item data: item_id, quantity, and unit_price are required, quantity > 0' }, { status: 400 });
          }
      }
      const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity, 10)), 0);
      if (Math.abs(parseFloat(total_amount) - calculatedTotal) > 0.01) {
          console.warn(`Total amount mismatch. Client: ${total_amount}, Server Calculated: ${calculatedTotal}. Using server calculated.`);
      }

      // --- Operations will NOT be atomic due to neon-http driver limitations ---

      // 1. Insert into transactions table
      const [tx] = await db.insert(transactions)
        .values({
          user_id: userId,
          name,
          supplier_id: supplier_id ? parseInt(supplier_id, 10) : null,
          date,
          type,
          total_amount: calculatedTotal,
          payment_method,
          notes,
          is_stock_related: !!is_stock_related,
        })
        .returning({ id: transactions.id });

      const newTransactionId = tx.id;

      if (!newTransactionId) {
          // This case should ideally not happen if the insert was successful and 'id' is a returning field.
          throw new Error("Failed to retrieve new transaction ID after insert.");
      }

      // 2. Insert into transaction_items table
      const transactionItemsData = items.map(line => ({
        transaction_id: newTransactionId,
        item_id: parseInt(line.item_id, 10),
        quantity: parseInt(line.quantity, 10),
        unit_price: parseFloat(line.unit_price)
      }));
      await db.insert(transaction_items).values(transactionItemsData);

      // 3. Insert into stock_movements table (if applicable)
      if (is_stock_related) {
        const stockMovementsData = items.map(line => {
          const changeQty = type === 'expense' ? parseInt(line.quantity, 10) : -parseInt(line.quantity, 10);
          const reason = type === 'expense' ? 'purchase' : 'sale';
          return {
            user_id: userId,
            item_id: parseInt(line.item_id, 10),
            change_qty: changeQty,
            reason: reason,
          };
        });
        await db.insert(stock_movements).values(stockMovementsData);
      }

      return NextResponse.json({ message: 'Transaction saved successfully', transactionId: newTransactionId }, { status: 201 });

    } catch (error) {
      console.error("API POST Transaction Error:", error); // This will now log the specific error if any of the db operations fail
      return NextResponse.json({ error: 'Failed to save transaction.', details: error.message }, { status: 500 });
    }
  }

  // GET all transactions (modified to include more supplier details)
  export async function GET(req) {
    try {
      const { userId } = getAuth(req);
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const results = await db
        .select({
          id: transactions.id,
          name: transactions.name,
          date: transactions.date,
          type: transactions.type,
          total_amount: transactions.total_amount,
          payment_method: transactions.payment_method,
          notes: transactions.notes,
          created_at: transactions.created_at,
          is_stock_related: transactions.is_stock_related,
          supplier_id: transactions.supplier_id,
          supplier_name: suppliers.name,
          supplier_city: suppliers.city,
          supplier_email: suppliers.email,
          supplier_phone: suppliers.phone, 
          supplier_address: suppliers.address,
        })
        .from(transactions)
        .leftJoin(suppliers, eq(transactions.supplier_id, suppliers.id))
        .where(and(
          eq(transactions.user_id, userId),
          eq(transactions.type, "expense"),
          eq(transactions.is_stock_related, true)
        ))
        .orderBy(desc(transactions.date), desc(transactions.created_at));

      return NextResponse.json(results, { status: 200 });

    } catch (err) {
      console.error("API GET Transactions Error:", err);
      return NextResponse.json({ error: "Internal Server Error fetching transactions", details: err.message }, { status: 500 });
    }
  }
