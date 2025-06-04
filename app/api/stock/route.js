import { db } from '@/utils/dbConfig';
import { items, stock_movements } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { eq, isNull, or, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const results = await db
      .select({
        id: items.id,
        name: items.name,
        sku: items.sku,
        cost_price: items.cost_price,
        sale_price: items.sale_price,
        current_stock: sql`COALESCE(SUM(${stock_movements.change_qty}), 0)`
      })
      .from(items)
      .leftJoin(stock_movements, eq(items.id, stock_movements.item_id))
      .groupBy(items.id);

    const parsed = results.map(item => ({
      ...item,
      cost_price: parseFloat(item.cost_price),
      sale_price: parseFloat(item.sale_price),
      current_stock: Number(item.current_stock),
    }));

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    console.error("🔥 Error fetching stock data:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}



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

  const { name, sku, cost_price, sale_price } = body;

  if (!name || !sku || cost_price == null || sale_price == null) {
    console.log('⚠️ POST /api/stock → MISSING FIELDS', { name, sku, cost_price, sale_price });
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    await db.insert(items).values({
      name,
      sku,
      cost_price,
      sale_price,
      user_id: userId,
    });
    console.log('✅ POST /api/stock → INSERT SUCCESS');
    return NextResponse.json({ message: 'Item added successfully' }, { status: 201 });
  } catch (err) {
    console.error('❌ POST /api/stock → DB ERROR:', err);
    return NextResponse.json({ error: 'Database error', details: err.message }, { status: 500 });
  }

}
