// app/(routes)/dashboard/pengeluaran/_components/addPengeluaranForm.jsx
import React, { useState, useEffect } from 'react';
import AddSupplierModal from './addSupplierModal'; // Import the new modal

export default function AddPengeluaranForm({ onClose }) {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([{ itemId: '', qty: 1, unitPrice: 0 }]); // itemId to empty string for placeholder
  const [transactionName, setTransactionName] = useState(''); // Renamed from 'name' to avoid confusion
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Fetch items and suppliers on mount
  useEffect(() => {
    // Fetch items
    fetch('/api/stock')
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat item stok');
        return res.json();
      })
      .then(data => {
        setItems(data);
        // Initialize first line if items are available and no itemId is set
        // Use cost_price for purchases
        if (data.length > 0 && lines.length === 1 && !lines[0].itemId) {
          setLines([{
            itemId: data[0].id,
            qty: 1,
            unitPrice: Number(data[0].cost_price) // Use cost_price for purchases
          }]);
        } else if (data.length === 0) {
          // If no items, ensure the line item is reset or handled
           setLines([{ itemId: '', qty: 1, unitPrice: 0 }]);
        }
      })
      .catch(err => {
        console.error(err);
        setSubmitError("Gagal memuat item stok. " + err.message);
      });

    // Fetch suppliers
    fetch('/api/suppliers')
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat supplier');
        return res.json();
      })
      .then(data => {
        setSuppliers(data);
      })
      .catch(err => {
        console.error(err);
        setSubmitError("Gagal memuat supplier. " + err.message);
      });
  }, []); // Empty dependency array: fetch only on mount

  const handleSupplierAdded = (newSupplier) => {
    setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedSupplierId(newSupplier.id.toString()); // Auto-select the newly added supplier
    setShowAddSupplierModal(false);
  };

  function addLine() {
    const firstItem = items[0] || {};
    setLines([...lines, {
      itemId: firstItem.id || '',
      qty: 1,
      unitPrice: Number(firstItem.cost_price) || 0 // Use cost_price for purchases
    }]);
  }

  function removeLine(idx) {
    if (lines.length <= 1) return; // Prevent removing the last line
    setLines(lines.filter((_, i) => i !== idx));
  }

  function onItemChange(idx, newItemId) {
    const item = items.find(i => i.id.toString() === newItemId.toString());
    if (!item) {
        // If item not found (e.g., placeholder selected), reset unit price
         setLines(lines.map((ln, i) =>
            i === idx
            ? { itemId: newItemId, qty: ln.qty, unitPrice: 0 }
            : ln
        ));
        return;
    }
    setLines(lines.map((ln, i) =>
      i === idx
        ? { itemId: newItemId, qty: ln.qty, unitPrice: Number(item.cost_price) } // Use cost_price for purchases
        : ln
    ));
  }

  function onQtyChange(idx, newQty) {
    const qty = Number(newQty);
    setLines(lines.map((ln, i) =>
      i === idx ? { ...ln, qty: qty >= 1 ? qty : 1 } : ln
    ));
  }
  
  // onPriceChange is removed as price is no longer editable


  async function handleSubmit(e) {
    e.preventDefault();
    if (lines.some(ln => !ln.itemId || ln.itemId === '')) {
        setSubmitError("Silakan pilih barang untuk semua baris.");
        return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    const total = lines.reduce((sum, ln) => sum + (parseFloat(ln.unitPrice) * parseInt(ln.qty, 10)), 0);
    const payload = {
      name: transactionName, // Use the dedicated state for transaction name
      supplier_id: selectedSupplierId ? parseInt(selectedSupplierId, 10) : null, // Add supplier_id
      date,
      type: 'expense',
      total_amount: total,
      payment_method: paymentMethod,
      notes,
      is_stock_related: true, // Assuming this form is always for stock-related expenses
      items: lines.map(ln => ({
        item_id: parseInt(ln.itemId, 10),
        quantity: parseInt(ln.qty, 10),
        unit_price: parseFloat(ln.unitPrice)
      }))
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Terjadi kesalahan saat menyimpan.' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      onClose(true); // Pass true to indicate successful save and refresh list

    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Gagal menyimpan transaksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatCurrencyDisplay = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Rp 0,00'; // Default to 0 with decimals for consistency
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // Or 2 if you want to always show cents
    }).format(num);
  };


  return (
    <>
      <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 pb-3 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Tambah Transaksi Pembelian</h2>
            <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label htmlFor="transactionName" className="block text-sm font-medium text-gray-700 mb-1">Nama Transaksi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="transactionName"
                  required
                  placeholder="Cth: Pembelian Stok X"
                  value={transactionName}
                  onChange={e => setTransactionName(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <div className="flex items-center space-x-2">
                  <select
                    id="supplier"
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:cursor-pointer"
                  >
                    <option value="">-- Pilih Supplier (Opsional) --</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(true)}
                    className="py-2 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm hover:cursor-pointer"
                    title="Tambah Supplier Baru"
                  >
                    +
                  </button>
                </div>
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
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1 ">Metode Pembayaran</label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm hover:cursor-pointer"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Kartu Kredit</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="qris">QRIS</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
              <div className="md:col-span-2">
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
              {lines.map((ln, i) => (
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
                        <option key={item.id} value={item.id.toString()}>
                          {item.name} (Stok: {item.current_stock ?? 0})
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
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right"
                      value={ln.qty}
                      onChange={e => onQtyChange(i, e.target.value)}
                      required
                    />
                  </div>
                   <div className="md:col-span-3">
                    <label htmlFor={`price-${i}`} className="block text-xs font-medium text-gray-600 mb-1">Harga Satuan (Beli)</label>
                    <input
                      type="text"
                      id={`price-${i}`}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right bg-gray-100" // Added bg-gray-100 for visual cue
                      value={formatCurrencyDisplay(ln.unitPrice)}
                      readOnly // Make the input read-only
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
              ))}
              <button
                type="button"
                onClick={addLine}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium hover:cursor-pointer"
                disabled={items.length === 0}
              >
                + Tambah Barang
              </button>
            </div>

            {submitError && (
              <p className="text-red-600 text-sm bg-red-100 p-3 rounded-md mt-4">{submitError}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => onClose(false)}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 hover:cursor-pointer"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:opacity-70 hover:cursor-pointer"
                disabled={isSubmitting || lines.some(ln => !ln.itemId) || lines.length === 0 || !transactionName.trim()}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAddSupplierModal && (
        <AddSupplierModal
          onClose={() => setShowAddSupplierModal(false)}
          onSupplierAdded={handleSupplierAdded}
        />
      )}
    </>
  );
}
