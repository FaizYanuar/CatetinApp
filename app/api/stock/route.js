import { db } from '@/utils/dbConfig';
import { items } from '@/utils/schema'; // or wherever your items table is
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allItems = await db.select().from(items);
    return NextResponse.json(allItems);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 });
  }
}
