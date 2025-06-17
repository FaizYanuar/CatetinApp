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

// Handler POST tidak perlu diubah, tetap sama
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name, supplier_id, date, type, total_amount,
      payment_method, notes, is_stock_related, items
    } = body;

    // ... (Validasi dan logika insert Anda yang sudah ada)
    if (!name || !date || !type || total_amount === undefined || total_amount === null) {
      return NextResponse.json({ error: 'Missing required transaction fields: name, date, type, total_amount' }, { status: 400 });
    }
    if (type !== 'expense' && type !== 'sale') { // Diubah untuk menerima 'income' juga
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }
    // ...

    const calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * parseInt(item.quantity, 10)), 0);

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
      throw new Error("Failed to retrieve new transaction ID after insert.");
    }

    const transactionItemsData = items.map(line => ({
      transaction_id: newTransactionId,
      item_id: parseInt(line.item_id, 10),
      quantity: parseInt(line.quantity, 10),
      unit_price: parseFloat(line.unit_price)
    }));
    await db.insert(transaction_items).values(transactionItemsData);

    if (is_stock_related) {
      const stockMovementsData = items.map(line => ({
        user_id: userId,
        item_id: parseInt(line.item_id, 10),
        change_qty: type === 'expense' ? parseInt(line.quantity, 10) : -parseInt(line.quantity, 10),
        reason: type === 'expense' ? 'purchase' : 'sale',
      }));
      await db.insert(stock_movements).values(stockMovementsData);
    }

    return NextResponse.json({ message: 'Transaction saved successfully', transactionId: newTransactionId }, { status: 201 });

  } catch (error) {
    console.error("API POST Transaction Error:", error);
    return NextResponse.json({ error: 'Failed to save transaction.', details: error.message }, { status: 500 });
  }
}

// Handler GET yang dimodifikasi dengan fungsionalitas filter
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'all';
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const date = searchParams.get('date');

    console.log(`API GET Pengeluaran for userId: ${userId} with filterType: ${filterType}`);
    
    // Kondisi dasar untuk query
    const conditions = [
      eq(transactions.user_id, userId),
      eq(transactions.type, "expense"), // Filter hanya untuk 'expense'
      // eq(transactions.is_stock_related, true) // Hapus jika ingin menampilkan semua expense
    ];

    // Menambahkan kondisi filter secara dinamis
    if (filterType === 'year' && year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
    } else if (filterType === 'month' && year && month) {
      conditions.push(sql`EXTRACT(YEAR FROM ${transactions.date}) = ${parseInt(year, 10)}`);
      conditions.push(sql`EXTRACT(MONTH FROM ${transactions.date}) = ${parseInt(month, 10)}`);
    } else if (filterType === 'date' && date) {
      conditions.push(eq(transactions.date, date));
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
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.created_at));

    console.log(`API GET Pengeluaran: ${results.length} transaksi ditemukan.`);
    return NextResponse.json(results, { status: 200 });

  } catch (err) {
    console.error("API GET Transactions Error:", err);
    return NextResponse.json({ error: "Internal Server Error fetching transactions", details: err.message }, { status: 500 });
  }
}
