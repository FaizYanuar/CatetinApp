"use client";

import React, { useState, useEffect } from 'react';

export default function PemasukanForm({ onClose }) { // Renamed component, added onClose
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([{ itemId: 0, qty: 1, unitPrice: 0 }]); // Matched initial line
  const [name, setName] = useState(''); // Renamed from transactionName
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10)); // Matched date init
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Matched paymentMethod options/init
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
          // Set initial line if items are available, similar to pengeluaranform
          // but uses sale_price and checks current_stock
          setLines([{
            itemId: availableItems[0].id,
            qty: 1,
            unitPrice: Number(availableItems[0].sale_price)
          }]);
        } else {
          // If no available items, set lines to empty or a placeholder if needed
          setLines([]);
        }
      })
      .catch(err => console.error("Error fetching stock:", err));
    // Default date is already set in useState
  }, []);

  function addLine() {
    // Prefer availableItem logic from original pemasukanform to avoid adding duplicates
    // or items that are out of stock if items list isn't filtered for addLine
    const selectedIds = lines.map(line => line.itemId);
    const availableItemToAdd = items.find(item => !selectedIds.includes(item.id) && item.current_stock > 0);

    if (availableItemToAdd) {
      setLines([...lines, {
        itemId: availableItemToAdd.id,
        qty: 1,
        unitPrice: Number(availableItemToAdd.sale_price)
      }]);
    } else if (items.length > 0 && lines.length < items.length) {
        // Fallback if all unique items are selected but more could be added (e.g. same item multiple times, if allowed)
        // For now, this logic tries to add a new unique item. If you want to allow same item,
        // then use items[0] or similar default.
        console.warn("No new unique available items to add, or all items already added.");
    } else if (items.length === 0) {
        console.warn("No items available to add a new line.");
    }
  }

  function removeLine(idx) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  function onItemChange(idx, newItemId) {
    const item = items.find(i => i.id === newItemId);
    if (!item) return;
    setLines(lines.map((ln, i) =>
      i === idx
        ? { itemId: newItemId, qty: ln.qty, unitPrice: Number(item.sale_price) } // Use sale_price
        : ln
    ));
  }

  function onQtyChange(idx, newQty) {
    const item = items.find(i => i.id === lines[idx].itemId);
    const maxQty = item ? item.current_stock : 1; // Ensure qty doesn't exceed stock
    const validatedQty = Math.max(1, Math.min(Number(newQty), maxQty));

    setLines(lines.map((ln, i) =>
      i === idx ? { ...ln, qty: validatedQty } : ln
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name || !date || lines.length === 0) {
      alert("Please fill in transaction name, date, and add at least one item.");
      return;
    }
    // Ensure all lines have a valid item and quantity
    for (const line of lines) {
        if (!line.itemId || line.qty <= 0) {
            alert("One or more item lines are incomplete or have invalid quantities.");
            return;
        }
        const itemDetails = items.find(i => i.id === line.itemId);
        if (line.qty > itemDetails.current_stock) {
            alert(`Quantity for item "${itemDetails.name}" exceeds available stock (${itemDetails.current_stock}).`);
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
        item_id: ln.itemId, // Ensure field names match API expectations
        quantity: ln.qty,
        unit_price: ln.unitPrice
      }))
    };

    console.log('Submitting Pemasukan', payload);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Sale transaction added successfully!");
        if (onClose) onClose(); // Call onClose to close the modal/form
        // Resetting form state might be handled by unmounting or explicitly if needed
      } else {
        const errorData = await response.json();
        alert(`Failed to add transaction: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentTotal = lines.reduce((sum, ln) => sum + (ln.unitPrice || 0) * (ln.qty || 0), 0);

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl shadow-lg max-h-[90vh] overflow-y-auto"> {/* Added max-h and overflow */}
        <h2 className="text-lg font-semibold mb-4">Tambah Pemasukan</h2>

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
              {/* Add other payment methods if necessary */}
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
          <h3 className="text-md font-semibold pt-3 text-gray-700">Detail Item</h3>
          <div className="space-y-4">
            {lines.map((ln, i) => {
              const currentItem = items.find(item => item.id === ln.itemId);
              const maxStock = currentItem ? currentItem.current_stock : 999; // Default high if item not found yet
              return (
                <div key={i} className="grid grid-cols-6 gap-4 items-center">
                  <select
                    className="col-span-2 border px-3 py-2 rounded"
                    value={ln.itemId}
                    onChange={e => onItemChange(i, Number(e.target.value))}
                  >
                    <option value={0} disabled>Pilih item...</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.current_stock} pcs)
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center col-span-1">
                    <input
                      type="number"
                      min={1}
                      max={maxStock} // Set max based on current_stock
                      className="w-full border px-3 py-2 rounded"
                      value={ln.qty}
                      onChange={e => onQtyChange(i, Number(e.target.value))} // Ensure Number conversion
                      required
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
                    className="col-span-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >🗑️</button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addLine}
              className="px-4 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200 disabled:opacity-50"
              disabled={submitting || items.length === 0 || lines.length >= items.filter(it => it.current_stock > 0).length}
            >Tambah Item</button>
          </div>

          {/* Total Display */}
          <div className="text-xl font-semibold text-right text-gray-800 mt-4">
            Total: Rp {currentTotal.toLocaleString()}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <button 
              type="submit" 
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting || lines.length === 0 || lines.some(l => l.itemId === 0 || l.qty <=0)}
            >
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={submitting}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}