// File: app/api/stock/route.js
import { db } from '@/utils/dbConfig';
import { items, stock_movements } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { eq, sql, and, desc, or, isNull } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    console.log("API /api/stock - Current Logged-in userId:", userId);

    if (!userId) {
      console.log("API GET /api/stock: No user logged in. Fetching global items, stock will be 0.");
    }

    console.log(`API GET /api/stock: Mengambil data stok untuk userId: ${userId || 'Guest (global items only, stock will be 0)'}`);

    let query;

    if (userId) {
      // Define a Common Table Expression (CTE) to calculate user-specific stock per item
      const userItemStockCte = db
        .$with('user_item_stock')
        .as(
          db.select({
            itemId: stock_movements.item_id,
            user_stock_value: sql`COALESCE(SUM(${stock_movements.change_qty}), 0)`.mapWith(Number).as('user_stock_value'),
          })
          .from(stock_movements)
          .where(eq(stock_movements.user_id, userId)) // Stock movements for the current logged-in user
          .groupBy(stock_movements.item_id)
        );

      query = db
        .with(userItemStockCte) // Use the CTE
        .select({
          id: items.id,
          name: items.name,
          sku: items.sku,
          cost_price: items.cost_price,
          sale_price: items.sale_price,
          created_at: items.created_at,
          item_owner_id: items.user_id,
          current_stock: sql`COALESCE(${userItemStockCte.user_stock_value}, 0)`.mapWith(Number),
        })
        .from(items)
        .leftJoin(userItemStockCte, eq(items.id, userItemStockCte.itemId)) // Join items with their user-specific stock
        .where(
          or(
            eq(items.user_id, userId), // Items owned by the user
            isNull(items.user_id)      // Or global items
          )
        )
        .orderBy(desc(items.created_at));

    } else { // No user logged in, only fetch global items with 0 stock
      query = db
        .select({
          id: items.id,
          name: items.name,
          sku: items.sku,
          cost_price: items.cost_price,
          sale_price: items.sale_price,
          created_at: items.created_at,
          item_owner_id: items.user_id,
          current_stock: sql`0`.mapWith(Number), // Stock is 0 for guests
        })
        .from(items)
        .where(isNull(items.user_id)) // Guests only see global items
        .orderBy(desc(items.created_at));
    }

    const results = await query;

    const parsed = results.map(item => ({
      ...item,
      cost_price: parseFloat(item.cost_price),
      sale_price: parseFloat(item.sale_price),
    }));

    console.log(`API GET /api/stock: ${parsed.length} item ditemukan untuk userId: ${userId || 'Guest'}`);
    
    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    console.error("🔥 Error fetching stock data in /api/stock:", err);
    const errorDetails = {
        message: err.message || "An unknown error occurred.",
        name: err.name,
        cause: err.cause
    };
    return NextResponse.json({ error: "Internal Server Error", details: errorDetails }, { status: 500 });
  }
}

// POST handler remains the same
export async function POST(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    console.log('⛔ POST /api/stock → UNAUTHORIZED');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
    console.log('📥 POST /api/stock body:', body);
  } catch (e) {
    console.log('⚠️ Could not parse JSON body:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, sku, cost_price, sale_price, initial_stock, is_global_item } = body;

  if (!name || !sku || cost_price == null || sale_price == null) {
    console.log('⚠️ POST /api/stock → MISSING FIELDS', { name, sku, cost_price, sale_price });
    return NextResponse.json({ error: 'Missing required fields: name, sku, cost_price, sale_price are required.' }, { status: 400 });
  }
  
  const initialStockNumber = Number(initial_stock);
  if (initial_stock != null && (isNaN(initialStockNumber) || initialStockNumber < 0)) {
    return NextResponse.json({ error: 'Initial stock must be a non-negative number.' }, { status: 400 });
  }

  try {
    const newItemUserId = is_global_item ? null : userId;

    const [newItem] = await db.insert(items).values({
      name,
      sku,
      cost_price,
      sale_price,
      user_id: newItemUserId,
    }).returning({ id: items.id });

    if (!newItem || !newItem.id) {
        throw new Error("Failed to create item.");
    }

    if (initial_stock != null && initialStockNumber > 0) {
        await db.insert(stock_movements).values({
            item_id: newItem.id,
            change_qty: initialStockNumber,
            reason: 'initial stock', 
            user_id: userId, 
        });
    }

    console.log('✅ POST /api/stock → INSERT SUCCESS');
    return NextResponse.json({ message: 'Item added successfully', itemId: newItem.id }, { status: 201 });
  } catch (err) {
    console.error('❌ POST /api/stock → DB ERROR:', err); 
    if (err.message && err.message.includes('duplicate key value violates unique constraint "items_sku_unique"')) {
        return NextResponse.json({ error: 'SKU already exists. Please use a unique SKU.' }, { status: 409 });
    }
    const errorDetails = {
        message: err.message || "An unknown database error occurred.",
        name: err.name,
        cause: err.cause
    };
    return NextResponse.json({ error: 'Database error', details: errorDetails }, { status: 500 });
  }
}
