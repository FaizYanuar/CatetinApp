// File: app/api/generate-dummy-data/route.js

import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/utils/dbConfig';
import {
  transactions,
  transaction_items,
  stock_movements,
  items,
  suppliers
} from '@/utils/schema';
import { and, eq, sql, or, isNull, inArray } from 'drizzle-orm';

// --- Helper Functions ---
function getRandomDate() {
  const startDate = new Date('2025-05-01T00:00:00Z');
  const endDate = new Date('2025-07-31T23:59:59Z');
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomDate = new Date(start + Math.random() * (end - start));
  return randomDate.toISOString().split('T')[0];
}

function getRandomAmount(min, max) {
    if (min > max) return max > 0 ? max : 1; // Pastikan tidak mengembalikan 0 atau negatif
    if (min <= 0 && max <= 0) return 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`GENERATE DUMMY DATA: Proses dimulai untuk userId: ${userId}`);

    // --- Langkah 1: Ambil data awal yang diperlukan (Supplier & Item) ---
    const defaultSupplierNames = ["Supplier Sony", "Supplier Razer", "Supplier Logitech", "Supplier Keychron", "Supplier Corsair", "Supplier ASUS", "Supplier Dell"];
    const existingSuppliers = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers).where(and(isNull(suppliers.user_id), inArray(suppliers.name, defaultSupplierNames)));
    if (existingSuppliers.length === 0) {
        return NextResponse.json({ error: `Tidak ditemukan supplier default global.` }, { status: 400 });
    }

    const availableItems = await db.select({ id: items.id, sale_price: items.sale_price, cost_price: items.cost_price, name: items.name }).from(items).where(or(eq(items.user_id, userId), isNull(items.user_id)));
    if (availableItems.length === 0) {
      return NextResponse.json({ error: 'Tidak ada item yang tersedia untuk membuat transaksi dummy.' }, { status: 400 });
    }

    // --- Langkah 2: Dapatkan dan lacak stok awal & pendapatan ---
    const initialStockQuery = await db.select({ itemId: stock_movements.item_id, currentStock: sql`COALESCE(SUM(${stock_movements.change_qty}), 0)`.mapWith(Number) }).from(stock_movements).where(eq(stock_movements.user_id, userId)).groupBy(stock_movements.item_id);
    
    const localStockLevels = {};
    availableItems.forEach(item => { localStockLevels[item.id] = 0; });
    initialStockQuery.forEach(stock => { localStockLevels[stock.itemId] = stock.currentStock; });
    
    let totalDummyIncome = 0;
    let totalDummyExpense = 0;
    const MAX_STOCK_PER_ITEM = 80; // Batas maksimum stok per barang

    // --- Langkah 3: Siapkan 90 data transaksi dummy dengan logika yang disempurnakan ---
    const dummyTransactionsData = [];
    const transactionCount = 90;
    const customerNames = ["Andi Budianto", "CV. Cipta Karya", "Toko Komputer Cepat", "Siti Aminah", "Proyek Kantor ABC", "Budi", "Joko Noviary", "Faiz Yanuar", "Nabil Aryo", "Rania Mahira"];
    const paymentMethods = ['cash', 'qris', 'bank_transfer', 'other'];

    for (let i = 0; i < transactionCount; i++) {
      // Prioritaskan pembelian jika total pendapatan sudah jauh melebihi pengeluaran
      const shouldPrioritizePurchase = totalDummyIncome > (totalDummyExpense + 50000000); // Selisih 50 juta
      let type = shouldPrioritizePurchase ? 'expense' : (Math.random() > 0.4 ? 'sale' : 'expense');
      
      const sellableItems = availableItems.filter(item => localStockLevels[item.id] > 0);
      
      if (type === 'sale' && sellableItems.length === 0) {
          type = 'expense'; // Jika ingin menjual tapi tidak ada stok, paksa jadi pembelian
      }

      const selectedItemsForTx = [];
      let totalAmount = 0;
      let transactionName;
      let assignedSupplierId = null;

      if (type === 'sale') {
          transactionName = pickRandom(customerNames);
          const itemCountForTx = getRandomAmount(1, Math.min(sellableItems.length, 2));
          for (let j = 0; j < itemCountForTx; j++) {
            const randomItem = pickRandom(sellableItems);
            if (!randomItem) continue;
            const maxSellableQty = localStockLevels[randomItem.id];
            const quantity = getRandomAmount(1, Math.max(1, Math.floor(maxSellableQty * 0.75))); // Jual maks 75% dari stok
            
            if (quantity > 0) {
                const unitPrice = parseFloat(randomItem.sale_price);
                totalAmount += quantity * unitPrice;
                selectedItemsForTx.push({ item_id: randomItem.id, quantity, unit_price: unitPrice });
                localStockLevels[randomItem.id] -= quantity;
            }
          }
          totalDummyIncome += totalAmount;

      } else { // type === 'expense'
          const randomSupplier = pickRandom(existingSuppliers);
          assignedSupplierId = randomSupplier.id;
          transactionName = `Pembelian dari ${randomSupplier.name}`;
          const itemCountForTx = getRandomAmount(1, 3);
          for (let j = 0; j < itemCountForTx; j++) {
            const randomItem = pickRandom(availableItems);
            if (!randomItem) continue;
            const currentStock = localStockLevels[randomItem.id];
            const maxPurchaseQty = MAX_STOCK_PER_ITEM - currentStock;

            if (maxPurchaseQty > 0) {
                const quantity = getRandomAmount(5, Math.min(25, maxPurchaseQty)); // Beli 5-25, tapi tidak melebihi batas
                const unitPrice = parseFloat(randomItem.cost_price);
                totalAmount += quantity * unitPrice;
                selectedItemsForTx.push({ item_id: randomItem.id, quantity, unit_price: unitPrice });
                localStockLevels[randomItem.id] += quantity;
            }
          }
          totalDummyExpense += totalAmount;
      }
      
      if(totalAmount === 0 || selectedItemsForTx.length === 0) continue;

      dummyTransactionsData.push({
        user_id: userId, name: transactionName, supplier_id: assignedSupplierId,
        date: getRandomDate(), type: type, total_amount: totalAmount, payment_method: pickRandom(paymentMethods),
        notes: "Transaksi dummy dibuat secara otomatis.", is_stock_related: true, items: selectedItemsForTx
      });
    }

    // --- Langkah 4: Masukkan semua transaksi dummy ke database ---
    for (const txData of dummyTransactionsData) {
      // (Logika penyimpanan ke DB tetap sama)
      const [tx] = await db.insert(transactions).values({ user_id: txData.user_id, name: txData.name, supplier_id: txData.supplier_id, date: txData.date, type: txData.type, total_amount: txData.total_amount, payment_method: txData.payment_method, notes: txData.notes, is_stock_related: true, }).returning({ id: transactions.id });
      const newTransactionId = tx.id;
      if (txData.items.length > 0) {
        const transactionItemsData = txData.items.map(line => ({ transaction_id: newTransactionId, item_id: line.item_id, quantity: line.quantity, unit_price: line.unit_price }));
        await db.insert(transaction_items).values(transactionItemsData);
        const stockMovementsData = txData.items.map(line => ({ user_id: userId, item_id: line.item_id, change_qty: txData.type === 'expense' ? line.quantity : -line.quantity, reason: txData.type === 'expense' ? 'purchase' : 'sale', }));
        await db.insert(stock_movements).values(stockMovementsData);
      }
    }
    
    console.log(`GENERATE DUMMY DATA: Sukses membuat ${dummyTransactionsData.length} transaksi. Total Pemasukan: ${totalDummyIncome}, Total Pengeluaran: ${totalDummyExpense}`);
    return NextResponse.json({ message: `${dummyTransactionsData.length} transaksi dummy berhasil dibuat.` }, { status: 201 });

  } catch (error) {
    console.error("API Generate Dummy Data Error:", error);
    return NextResponse.json({ error: "Gagal membuat data dummy.", details: error.message }, { status: 500 });
  }
}
