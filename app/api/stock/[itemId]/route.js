// File: app/api/stock/[itemId]/route.js

import { db } from '@/utils/dbConfig';
import { items, stock_movements, transaction_items } from '@/utils/schema'; // Pastikan path ini benar
import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';

export async function DELETE(request, { params }) {
  const { userId } = getAuth(request);
  const itemId = parseInt(params.itemId, 10);

  if (!userId) {
    console.log(`DELETE /api/stock/${itemId} → UNAUTHORIZED: No user ID`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isNaN(itemId)) {
    console.log(`DELETE /api/stock/${params.itemId} → INVALID ITEM ID`);
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
  }

  console.log(`DELETE /api/stock/${itemId} → Attempt by userId: ${userId}`);

  try {
    // 1. Verifikasi bahwa item tersebut milik pengguna yang sedang login
    // Pengguna tidak boleh menghapus item global atau item milik pengguna lain.
    const itemToDelete = await db
      .select({ id: items.id, ownerId: items.user_id })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (itemToDelete.length === 0) {
      console.log(`DELETE /api/stock/${itemId} → Item not found`);
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (itemToDelete[0].ownerId !== userId) {
      console.log(`DELETE /api/stock/${itemId} → FORBIDDEN: User ${userId} does not own item ${itemId} (owner: ${itemToDelete[0].ownerId})`);
      return NextResponse.json({ error: 'Forbidden: You do not own this item.' }, { status: 403 });
    }
    
    // PENTING: Penanganan Data Terkait
    // Idealnya, database Anda harus memiliki ON DELETE CASCADE pada foreign key
    // dari 'stock_movements' dan 'transaction_items' yang merujuk ke 'items.id'.
    // Jika tidak, Anda perlu menghapus record terkait secara manual di sini sebelum menghapus item.
    // Contoh (jika tidak ada cascade):
    // await db.delete(stock_movements).where(eq(stock_movements.item_id, itemId));
    // await db.delete(transaction_items).where(eq(transaction_items.item_id, itemId));
    //
    // Mengasumsikan ON DELETE CASCADE sudah diatur di level database untuk stock_movements dan transaction_items
    // yang berelasi dengan items.id. Jika belum, implementasikan penghapusan manual di atas.

    // 2. Hapus item dari tabel 'items'
    const deleteResult = await db.delete(items).where(
      and(
        eq(items.id, itemId),
        eq(items.user_id, userId) // Kondisi tambahan untuk keamanan
      )
    ).returning({ id: items.id });

    if (deleteResult.length === 0) {
      // Ini seharusnya tidak terjadi jika pengecekan kepemilikan di atas berhasil,
      // tapi sebagai lapisan keamanan tambahan.
      console.log(`DELETE /api/stock/${itemId} → Item not found or not owned by user during delete operation.`);
      return NextResponse.json({ error: 'Item not found or not owned by user' }, { status: 404 });
    }

    console.log(`DELETE /api/stock/${itemId} → Item successfully deleted by userId: ${userId}`);
    return NextResponse.json({ message: 'Item deleted successfully', deletedItemId: deleteResult[0].id }, { status: 200 });

  } catch (err) {
    console.error(`❌ DELETE /api/stock/${itemId} → DB ERROR:`, err);
    return NextResponse.json({ error: 'Database error while deleting item', details: err.message }, { status: 500 });
  }
}
