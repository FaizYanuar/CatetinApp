// app/(routes)/dashboard/pengeluaran/_components/AddSupplierModal.jsx
import React, { useState } from 'react';

export default function AddSupplierModal({ onClose, onSupplierAdded }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nama supplier tidak boleh kosong.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, phone, email, address, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Gagal menambahkan supplier" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const newSupplier = await response.json();
      onSupplierAdded(newSupplier); // Callback to update parent component
      onClose(); // Close the modal

    } catch (err) {
      console.error("Failed to add supplier:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 md:p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 pb-3 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Tambah Supplier Baru</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="supplierName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplierCity" className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
              <input
                type="text"
                id="supplierCity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="supplierPhone" className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
              <input
                type="tel"
                id="supplierPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="supplierEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="supplierEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="supplierAddress" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              id="supplierAddress"
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="supplierNotes" className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              id="supplierNotes"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
