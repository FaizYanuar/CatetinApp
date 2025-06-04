// File: app/api/stock/route.js
import { db } from '@/utils/dbConfig';
import { items, stock_movements } from '@/utils/schema'; // Pastikan path ini benar
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { eq, sql, and, desc, or, isNull } from 'drizzle-orm'; // Tambahkan 'or' dan 'isNull'

export async function GET(req) { // Tambahkan 'req' sebagai parameter
  try {
    const { userId } = getAuth(req); // Dapatkan userId dari sesi Clerk

    if (!userId) {
      // Jika tidak ada userId (pengguna tidak login), kembalikan array kosong
      console.log("API GET /api/stock: Unauthorized access attempt or no user logged in.");
      // Pertimbangkan untuk tetap mengambil item global jika diinginkan, atau kembalikan error/kosong
      // Untuk saat ini, kita akan mengambil item global bahkan jika tidak ada user login,
      // namun stoknya akan 0 karena tidak ada userId untuk subquery stok.
      // Atau, jika item global hanya boleh dilihat user yang login:
      // return NextResponse.json([], { status: 200 });
    }

    console.log(`API GET /api/stock: Mengambil data stok untuk userId: ${userId || 'Guest (global items only)'}`);

    // Query untuk mengambil item yang relevan (milik pengguna atau global)
    // dan menghitung stok spesifik pengguna untuk item tersebut.
    const results = await db
      .select({
        id: items.id,
        name: items.name,
        sku: items.sku,
        cost_price: items.cost_price,
        sale_price: items.sale_price,
        created_at: items.created_at,
        item_owner_id: items.user_id, // Untuk membedakan item global vs item pengguna jika perlu di frontend
        // Hitung stok spesifik pengguna menggunakan subquery yang dikorelasikan
        // Jika userId null (pengguna tidak login), stok akan selalu 0
        current_stock: userId ? 
                        sql`(SELECT COALESCE(SUM(sm.change_qty), 0) FROM ${stock_movements} sm WHERE sm.item_id = ${items.id} AND sm.user_id = ${userId})`.mapWith(Number) :
                        sql`0`.mapWith(Number) 
      })
      .from(items)
      // Filter item: tampilkan item milik pengguna ATAU item global (user_id IS NULL)
      .where(
        userId ? 
        or(
          eq(items.user_id, userId),
          isNull(items.user_id)
        ) : 
        isNull(items.user_id) // Jika tidak ada user login, hanya tampilkan item global
      )
      // .groupBy(items.id, items.name, items.sku, items.cost_price, items.sale_price, items.created_at, items.user_id) // items.user_id juga perlu di group by
      // Dengan subquery yang dikorelasikan untuk SUM, groupBy utama hanya perlu kolom dari tabel 'items'
      .groupBy(items.id) // Jika DB Anda (misal PostgreSQL) mengizinkan groupBy PK saja jika semua kolom lain dari tabel PK itu di-select
      // Untuk portabilitas/kejelasan lebih, bisa group by semua kolom non-agregat dari 'items'
      // .groupBy(items.id, items.name, items.sku, items.cost_price, items.sale_price, items.created_at, items.user_id)
      .orderBy(desc(items.created_at));


    // Parsing harga ke tipe data yang sesuai (angka)
    // current_stock sudah number karena mapWith(Number)
    const parsed = results.map(item => ({
      ...item,
      cost_price: parseFloat(item.cost_price),
      sale_price: parseFloat(item.sale_price),
    }));

    console.log(`API GET /api/stock: ${parsed.length} item ditemukan untuk userId: ${userId || 'Guest'}`);
    return NextResponse.json(parsed, { status: 200 });

  } catch (err) {
    console.error("🔥 Error fetching stock data in /api/stock:", err); // Check server logs for this!
    const errorDetails = {
        message: err.message || "An unknown error occurred.",
        name: err.name,
        cause: err.cause
    };
    return NextResponse.json({ error: "Internal Server Error", details: errorDetails }, { status: 500 });
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

  const { name, sku, cost_price, sale_price, initial_stock, is_global_item } = body; // Tambahkan is_global_item

  if (!name || !sku || cost_price == null || sale_price == null) {
    console.log('⚠️ POST /api/stock → MISSING FIELDS', { name, sku, cost_price, sale_price });
    return NextResponse.json({ error: 'Missing required fields: name, sku, cost_price, sale_price are required.' }, { status: 400 });
  }
  
  const initialStockNumber = Number(initial_stock);
  if (initial_stock != null && (isNaN(initialStockNumber) || initialStockNumber < 0)) {
    return NextResponse.json({ error: 'Initial stock must be a non-negative number.' }, { status: 400 });
  }

  try {
    // Masukkan item baru. Jika is_global_item true, user_id akan NULL.
    const newItemUserId = is_global_item ? null : userId;

    const [newItem] = await db.insert(items).values({
      name,
      sku,
      cost_price,
      sale_price,
      user_id: newItemUserId, // Set user_id ke null jika item global
    }).returning({ id: items.id });

    if (!newItem || !newItem.id) {
        throw new Error("Failed to create item.");
    }

    // Jika ada initial_stock, buat entri di stock_movements
    // Stok awal selalu terkait dengan pengguna yang melakukan input, bahkan untuk item global.
    if (initial_stock != null && initialStockNumber > 0) {
        await db.insert(stock_movements).values({
            item_id: newItem.id,
            change_qty: initialStockNumber,
            reason: 'initial stock', 
            user_id: userId, // Pergerakan stok (termasuk stok awal) dicatat atas nama pengguna yang login
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
