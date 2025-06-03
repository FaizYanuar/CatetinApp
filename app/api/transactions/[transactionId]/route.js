// app/api/transactions/[transactionId]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/dbConfig';
import {
  transactions,
  transaction_items,
  items as itemsSchema,
  suppliers // Pastikan suppliers diimpor
} from '@/utils/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req, { params }) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
    }

    const { transactionId } = params;
    const id = parseInt(transactionId);

    if (!transactionId || isNaN(id)) {
      return NextResponse.json({ error: 'Invalid transaction ID provided' }, { status: 400 });
    }

    // Ambil detail transaksi utama dan gabungkan dengan supplier
    const transactionData = await db
      .select({
        // Pilih semua field dari tabel transactions
        id: transactions.id,
        user_id: transactions.user_id,
        name: transactions.name,
        supplier_id: transactions.supplier_id,
        date: transactions.date,
        type: transactions.type,
        total_amount: transactions.total_amount,
        payment_method: transactions.payment_method,
        notes: transactions.notes, // Catatan spesifik transaksi
        created_at: transactions.created_at,
        is_stock_related: transactions.is_stock_related,
        // Pilih field supplier yang dibutuhkan
        supplier_name: suppliers.name,
        supplier_city: suppliers.city,
        supplier_email: suppliers.email,
        supplier_phone: suppliers.phone,
        supplier_address: suppliers.address,
        supplier_notes: suppliers.notes, // Catatan spesifik supplier
      })
      .from(transactions)
      .leftJoin(suppliers, eq(transactions.supplier_id, suppliers.id)) // LEFT JOIN untuk menyertakan transaksi tanpa supplier
      .where(and(eq(transactions.id, id), eq(transactions.user_id, userId)))
      .limit(1);

    if (transactionData.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const mainTransaction = transactionData[0];

    // Ambil item transaksi terkait
    const itemsData = await db
      .select({
        itemId: transaction_items.item_id,
        itemName: itemsSchema.name,
        sku: itemsSchema.sku,
        quantity: transaction_items.quantity,
        unit_price: transaction_items.unit_price,
      })
      .from(transaction_items)
      .leftJoin(itemsSchema, eq(transaction_items.item_id, itemsSchema.id))
      .where(eq(transaction_items.transaction_id, mainTransaction.id));

    // Gabungkan data transaksi utama dengan item-itemnya
    const result = {
      ...mainTransaction,
      items: itemsData,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API GET Transaction Detail Error:", error);
    // Hindari mengirim pesan error detail seperti error.message ke klien di production
    return NextResponse.json({ error: 'Failed to fetch transaction details due to an internal server error.' }, { status: 500 });
  }
}
