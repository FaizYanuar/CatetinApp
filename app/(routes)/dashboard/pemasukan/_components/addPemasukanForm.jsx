"use client";

import React, { useState, useEffect } from 'react';

export default function PemasukanForm({ onClose }) {
  const [items, setItems] = useState([]);
  // Changed initial itemId to empty string for placeholder, consistent with AddPengeluaranForm
  const [lines, setLines] = useState([{ itemId: '', qty: 1, unitPrice: 0 }]);
  const [name, setName] = useState(''); // Renamed from transactionName, but effectively a name for the sale
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // Added for error messages

  // Fetch items on mount
  useEffect(() => {
    fetch('/api/stock')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stock items');
        return res.json();
      })
      .then(data => {
        const availableItems = data.filter(item => item.current_stock > 0);
        setItems(availableItems);
        if (availableItems.length > 0) {
          // Set initial line if items are available, using sale_price and checking current_stock
          setLines([{
            itemId: availableItems[0].id,
            qty: 1,
            unitPrice: Number(availableItems[0].sale_price)
          }]);
        } else {
          // If no available items, ensure a placeholder line exists
          setLines([{ itemId: '', qty: 1, unitPrice: 0 }]);
        }
      })
      .catch(err => {
        console.error("Error fetching stock:", err);
        setSubmitError("Gagal memuat item stok. " + err.message);
      });
  }, []);

  function addLine() {
    setSubmitError(null); // Clear previous errors
    // Filter items to find those with stock AND not already selected in current lines
    const currentlySelectedIds = lines.map(line => line.itemId);
    const uniqueAvailableItems = items.filter(item => item.current_stock > 0 && !currentlySelectedIds.includes(item.id));

    if (uniqueAvailableItems.length > 0) {
      // Add the first available unique item
      setLines([...lines, {
        itemId: uniqueAvailableItems[0].id,
        qty: 1,
        unitPrice: Number(uniqueAvailableItems[0].sale_price)
      }]);
    } else if (items.filter(item => item.current_stock > 0).length > 0) {
      // If there are items with stock, but all are already selected uniquely, add an empty line for user to pick
      setLines([...lines, { itemId: '', qty: 1, unitPrice: 0 }]);
    } else {
      setSubmitError("Tidak ada barang baru yang tersedia untuk ditambahkan, atau semua barang yang tersedia sudah ditambahkan.");
    }
  }


  function removeLine(idx) {
    if (lines.length <= 1) return; // Prevent removing the last line
    setLines(lines.filter((_, i) => i !== idx));
  }

  function onItemChange(idx, newItemId) {
    setSubmitError(null); // Clear previous errors
    const item = items.find(i => i.id === Number(newItemId));
    if (!item) {
      // If item not found (e.g., placeholder selected), reset unit price
      setLines(lines.map((ln, i) =>
        i === idx
          ? { itemId: Number(newItemId), qty: ln.qty, unitPrice: 0 }
          : ln
      ));
      return;
    }
    setLines(lines.map((ln, i) =>
      i === idx
        ? { itemId: Number(newItemId), qty: ln.qty, unitPrice: Number(item.sale_price) } // Use sale_price
        : ln
    ));
  }

  function onQtyChange(idx, newQty) {
    setSubmitError(null); // Clear previous errors
    const item = items.find(i => i.id === lines[idx].itemId);
    const maxQty = item ? item.current_stock : 0; // Ensure qty doesn't exceed stock, if no item selected, max is 0
    const validatedQty = Math.max(1, Math.min(Number(newQty) || 1, maxQty)); // Ensure qty is at least 1 and not more than maxStock

    setLines(lines.map((ln, i) =>
      i === idx ? { ...ln, qty: validatedQty } : ln
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null); // Clear previous errors

    if (!name.trim()) {
      setSubmitError("Silakan isi nama pembeli.");
      return;
    }
    if (lines.length === 0 || lines.some(line => !line.itemId || line.qty <= 0)) {
      setSubmitError("Silakan pilih barang dan tentukan jumlah yang valid untuk semua baris.");
      return;
    }
    // Ensure all lines have a valid item and quantity
    for (const line of lines) {
      const itemDetails = items.find(i => i.id === line.itemId);
      if (!itemDetails) {
        setSubmitError("Salah satu atau lebih barang yang dipilih tidak valid.");
        return;
      }
      if (line.qty > itemDetails.current_stock) {
        setSubmitError(`Jumlah untuk barang "${itemDetails.name}" melebihi stok yang tersedia (${itemDetails.current_stock}).`);
        return;
      }
    }

    setSubmitting(true);
    const total = lines.reduce((sum, ln) => sum + ln.unitPrice * ln.qty, 0);
    const payload = {
      name, // from name state
      date, // from date state
      type: 'sale', // Specific to pemasukan
      total_amount: total,
      payment_method: paymentMethod,
      notes,
      is_stock_related: true,
      items: lines.map(ln => ({
        item_id: ln.itemId,
        quantity: ln.qty,
        unit_price: ln.unitPrice
      }))
    };

    console.log('Submitting Pemasukan', payload);

    try {
      const response = await fetch("/api/transactions", { // Endpoint for transactions, not /api/pemasukan
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Transaksi penjualan berhasil ditambahkan!");
        if (onClose) onClose(true); // Call onClose to close the modal/form, pass true for success
      } else {
        const errorData = await response.json();
        setSubmitError(`Gagal menambahkan transaksi: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError("Terjadi kesalahan saat mengirimkan formulir.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrencyDisplay = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const currentTotal = lines.reduce((sum, ln) => sum + (ln.unitPrice || 0) * (ln.qty || 0), 0);

  return (
    <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-3 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Tambah Transaksi Penjualan</h2>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="transactionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Pembeli <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="transactionName"
                required
                placeholder="Cth: Agus Tusan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:cursor-pointer"
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="qris">QRIS</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
            <div className="md:col-span-2"> {/* Made notes span 2 columns for better layout */}
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Catatan Transaksi</label>
              <textarea
                id="notes"
                rows="2"
                placeholder="Catatan tambahan untuk transaksi ini"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Line Items */}
          <h3 className="text-md font-semibold mt-6 mb-2 pt-4 border-t">Detail Barang</h3>
          <div className="space-y-3">
            {lines.map((ln, i) => {
              const currentItem = items.find(item => item.id === ln.itemId);
              const maxStock = currentItem ? currentItem.current_stock : 0; // If no item selected, max stock is 0
              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-md bg-gray-50">
                  <div className="md:col-span-5">
                    <label htmlFor={`item-${i}`} className="block text-xs font-medium text-gray-600 mb-1">Barang <span className="text-red-500">*</span></label>
                    <select
                      id={`item-${i}`}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:cursor-pointer"
                      value={ln.itemId}
                      onChange={e => onItemChange(i, e.target.value)}
                      disabled={items.length === 0}
                    >
                      <option value="">-- Pilih Barang --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stok: {item.current_stock} pcs)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`qty-${i}`} className="block text-xs font-medium text-gray-600 mb-1">Jumlah <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      id={`qty-${i}`}
                      min={1}
                      max={maxStock} // Set max based on current_stock
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                      value={ln.qty}
                      onChange={e => onQtyChange(i, e.target.value)}
                      required
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label htmlFor={`price-${i}`} className="block text-xs font-medium text-gray-600 mb-1">Harga Satuan (Jual)</label>
                    <input
                      type="text"
                      id={`price-${i}`}
                      readOnly
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right bg-gray-100"
                      value={formatCurrencyDisplay(ln.unitPrice)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end justify-end">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(i)}
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        title="Hapus Baris"
                      >🗑️</button>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium hover:cursor-pointer"
              disabled={submitting || items.length === 0 || lines.filter(l => l.itemId !== '').length >= items.filter(it => it.current_stock > 0).length}
              // Improved disabled logic: disable if all unique items with stock are already selected
            >
              + Tambah Barang
            </button>
          </div>

          {submitError && (
            <p className="text-red-600 text-sm bg-red-100 p-3 rounded-md mt-4">{submitError}</p>
          )}

          {/* Total Display */}
          <div className="text-xl font-semibold text-right text-gray-800 pt-4 border-t">
            Total: {formatCurrencyDisplay(currentTotal)}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 hover:cursor-pointer"
              disabled={submitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:opacity-70 hover:cursor-pointer"
              disabled={submitting || lines.some(ln => !ln.itemId || ln.qty <= 0) || !name.trim() || lines.length === 0}
            >
              {submitting ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}