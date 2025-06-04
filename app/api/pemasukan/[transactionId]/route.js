// app/api/pemasukan/[transactionId]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/dbConfig'; // Sesuaikan path jika perlu
import {
  transactions,       // Asumsi tabel transaksi utama Anda
  transaction_items,  // Asumsi tabel untuk item dalam transaksi
  items as itemsSchema, // Asumsi tabel master item
  // customers,       // Jika Anda memiliki tabel 'customers' terpisah dan sudah diimpor
} from '@/utils/schema';    // Sesuaikan path jika perlu
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req, { params }) { // Tetap menggunakan destructuring { params } untuk konsistensi
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User not authenticated' }, { status: 401 });
    }

    // Mengikuti pesan error "params should be awaited before using its properties".
    // Jika 'params' bukan Promise, 'await' tidak akan berpengaruh buruk.
    // Jika 'params' memang memerlukan await, ini akan menanganinya.
    const resolvedParams = await params;
    const { transactionId } = resolvedParams;

    if (!transactionId) { // Periksa transactionId setelah potensial await
        return NextResponse.json({ error: 'Transaction ID not found in params' }, { status: 400 });
    }
    
    const id = parseInt(transactionId);

    if (isNaN(id)) { // Periksa hasil parseInt
      return NextResponse.json({ error: 'Invalid transaction ID format' }, { status: 400 });
    }

    // Ambil detail transaksi utama
    const transactionData = await db
      .select({
        id: transactions.id,
        user_id: transactions.user_id,
        name: transactions.name, 
        date: transactions.date,
        type: transactions.type,
        total_amount: transactions.total_amount,
        payment_method: transactions.payment_method,
        notes: transactions.notes, 
        created_at: transactions.created_at,
        is_stock_related: transactions.is_stock_related,
        supplier_id: transactions.supplier_id,
      })
      .from(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.user_id, userId),
        eq(transactions.type, 'sale') 
      ))
      .limit(1);

    if (transactionData.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const mainTransaction = transactionData[0];

    let itemsData = [];
    if (mainTransaction.is_stock_related) { 
        itemsData = await db
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
    }

    const result = {
      ...mainTransaction,
      items: itemsData,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API GET Pemasukan Detail Error:", error);
    return NextResponse.json({ error: 'Failed to fetch transaction details due to an internal server error.', details: error.message }, { status: 500 });
  }
}
