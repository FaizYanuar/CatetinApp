import { NextResponse } from 'next/server';
import { db } from '@/utils/dbConfig'; // Ensure this path is correct
import { transactions, transaction_items, items as itemsSchema } from '@/utils/schema'; // Renamed items to itemsSchema to avoid conflict
import { eq, and } from 'drizzle-orm';
import { getAuth } from '@clerk/nextjs/server'; // Assuming you use Clerk for auth

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

    // Fetch the main transaction details
    // Ensure you are filtering by user_id as well for security
    const transactionData = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.user_id, userId)))
      .limit(1);

    if (transactionData.length === 0) {
      return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
    }

    const mainTransaction = transactionData[0];

    // Fetch related transaction items and join with items table to get item names and SKUs
    const itemsData = await db
      .select({
        itemId: transaction_items.item_id,
        itemName: itemsSchema.name, // Use the aliased itemsSchema
        sku: itemsSchema.sku,       // Use the aliased itemsSchema
        quantity: transaction_items.quantity,
        unit_price: transaction_items.unit_price,
      })
      .from(transaction_items)
      .leftJoin(itemsSchema, eq(transaction_items.item_id, itemsSchema.id)) // Join with itemsSchema
      .where(eq(transaction_items.transaction_id, mainTransaction.id));
      // No user_id check needed here directly if transaction_id is already user-scoped,
      // but ensure itemsSchema.user_id matches if items are also user-specific and you need that check.

    // Combine the main transaction data with its items
    const result = {
      ...mainTransaction,
      items: itemsData, // This will be an array of item objects
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API GET Transaction Detail Error:", error);
    // Avoid sending detailed error messages like error.message to the client in production
    return NextResponse.json({ error: 'Failed to fetch transaction details due to an internal server error.' }, { status: 500 });
  }
}
