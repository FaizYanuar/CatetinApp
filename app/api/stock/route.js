import { db } from '@/utils/dbConfig';
import { items } from '@/utils/schema';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allItems = await db.select().from(items);
    return NextResponse.json(allItems);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
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
