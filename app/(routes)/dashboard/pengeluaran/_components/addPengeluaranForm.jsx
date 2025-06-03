// addPengeluaranForm.jsx

import React, { useState, useEffect } from 'react';

export default function AddPengeluaranForm({ onClose }) {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([{ itemId: 0, qty: 1, unitPrice: 0 }]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // To disable button during submit
  const [submitError, setSubmitError] = useState(null);   // To display submit errors

  // Fetch items on mount
  useEffect(() => {
    fetch('/api/stock')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load stock items');
        return res.json();
      })
      .then(data => {
        setItems(data);
        if (data.length && lines[0].itemId === 0) {
          setLines([{
            itemId: data[0].id,
            qty: 1,
            unitPrice: Number(data[0].cost_price)
          }]);
        }
      })
      .catch(err => {
        console.error(err);
        // Optionally, set an error state here to inform the user
      });
  }, []); // Removed 'lines' from dependency array to avoid re-fetching if only lines change

  function addLine() {
    const first = items[0] || {};
    setLines([...lines, {
      itemId: first.id || 0,
      qty: 1,
      unitPrice: Number(first.cost_price) || 0
    }]);
  }

  function removeLine(idx) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function onItemChange(idx, newItemId) {
    const item = items.find(i => i.id === newItemId);
    if (!item) return;
    setLines(lines.map((ln, i) =>
      i === idx
        ? { itemId: newItemId, qty: ln.qty, unitPrice: Number(item.cost_price) }
        : ln
    ));
  }

  function onQtyChange(idx, newQty) {
    setLines(lines.map((ln, i) =>
      i === idx ? { ...ln, qty: newQty >= 1 ? newQty : 1 } : ln // Ensure qty is at least 1
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null); // Clear previous errors
    setIsSubmitting(true); // Disable button

    const total = lines.reduce((sum, ln) => sum + ln.unitPrice * ln.qty, 0);
    const payload = {
      name,
      date,
      type: 'expense',
      total_amount: total,
      payment_method: paymentMethod,
      notes,
      is_stock_related: true,
      items: lines.map(ln => ({
        item_id: ln.itemId,
        quantity: parseInt(ln.qty, 10), // Ensure quantity is an integer
        unit_price: parseFloat(ln.unitPrice) // Ensure unit_price is a float
      }))
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred during submission.' })); // Try to parse error
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Transaction saved:', result);
      // alert('Pengeluaran berhasil disimpan!'); // Simple success feedback

      // Call onClose to close the modal
      if (onClose) {
        onClose(true); // Pass true or the new data if you want to refresh the list outside
      }
      // Optionally, reset form fields if the modal isn't always unmounted
      // setName('');
      // setDate(new Date().toISOString().substr(0, 10));
      // setLines([{ itemId: items[0]?.id || 0, qty: 1, unitPrice: Number(items[0]?.cost_price) || 0 }]);
      // setNotes('');
      // setPaymentMethod('cash');

    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Gagal menyimpan transaksi. Silakan coba lagi.');
      // alert(`Error: ${err.message}`); // Simple error feedback
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Tambah Pengeluaran</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              required
              placeholder="Nama Transaksi"
              value={name}
              onChange={e => setName(e.target.value)}
              className="border px-3 py-2 rounded"
            />
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
            <input
              type="text"
              placeholder="Catatan (Opsional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="border px-3 py-2 rounded col-span-1 md:col-span-2 lg:col-span-1"
            />
          </div>

          {/* Line Items */}
          <h3 className="text-md font-semibold mt-6 mb-2">Detail Barang</h3>
          <div className="space-y-4">
            {lines.map((ln, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <select
                  className="md:col-span-5 border px-3 py-2 rounded"
                  value={ln.itemId}
                  onChange={e => onItemChange(i, Number(e.target.value))}
                  disabled={items.length === 0}
                >
                  {items.length === 0 && <option value={0}>Memuat item...</option>}
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stok: {item.current_stock ?? 0})
                    </option>
                  ))}
                </select>
                <div className="flex items-center md:col-span-3">
                  <input
                    type="number"
                    min={1}
                    className="w-full border px-3 py-2 rounded"
                    value={ln.qty}
                    onChange={e => onQtyChange(i, Number(e.target.value))}
                  />
                  <span className="ml-2 text-sm whitespace-nowrap">pcs</span>
                </div>
                <input
                  type="text"
                  readOnly
                  className="md:col-span-3 border px-3 py-2 rounded bg-gray-100"
                  value={`Rp ${ln.unitPrice.toLocaleString('id-ID')}`}
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="md:col-span-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                  disabled={lines.length <= 1}
                >🗑️</button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
              disabled={items.length === 0}
            >
              + Tambah Barang
            </button>
          </div>

          {submitError && (
            <p className="text-red-500 text-sm bg-red-100 p-3 rounded">{submitError}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting || lines.some(ln => ln.itemId === 0) || lines.length === 0}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}