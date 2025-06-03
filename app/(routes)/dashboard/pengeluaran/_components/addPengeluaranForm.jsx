import React, { useState, useEffect } from 'react';

export default function AddPengeluaranForm({ onClose }) {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([{ itemId: 0, qty: 1, unitPrice: 0 }]);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Fetch items on mount
  useEffect(() => {
    fetch('/api/stock')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
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
      .catch(err => console.error(err));
  }, []);

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
      i === idx ? { ...ln, qty: newQty } : ln
    ));
  }

  function handleSubmit(e) {
    e.preventDefault();
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
        quantity: ln.qty,
        unit_price: ln.unitPrice
      }))
    };
    console.log('Submitting', payload);
    // call your POST /api/transactions here
    // then onClose() or reset form
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Tambah Pengeluaran</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              placeholder="Catatan"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            {lines.map((ln, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 items-center">
                <select
                  className="col-span-2 border px-3 py-2 rounded"
                  value={ln.itemId}
                  onChange={e => onItemChange(i, Number(e.target.value))}
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center col-span-1">
                  <input
                    type="number"
                    min={1}
                    className="w-full border px-3 py-2 rounded"
                    value={ln.qty}
                    onChange={e => onQtyChange(i, Number(e.target.value))}
                  />
                  <span className="ml-2 text-sm">pcs</span>
                </div>
                <input
                  type="text"
                  readOnly
                  className="col-span-2 border px-3 py-2 rounded bg-gray-100"
                  value={`Rp ${ln.unitPrice.toLocaleString()}`}
                />
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="col-span-1 px-3 py-2 bg-red-500 text-white rounded"
                >🗑️</button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-2 bg-green-100 text-green-600 rounded"
            >Tambah</button>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded">
              Simpan
            </button>
            <button type="button" onClick={onClose} className="px-6 py-2 bg-red-600 text-white rounded">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
