// app/(routes)/dashboard/pemasukan/_components/PemasukanDetailModal.jsx
import React from 'react';

export default function PemasukanDetailModal({ transaction, onClose }) {
  if (!transaction) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatCurrency = (value) => {
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numberValue);
  };

  const displayValue = (value) => value || '-';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-6 md:p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Detail Transaksi Penjualan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Transaction Info Section */}
        <div className="space-y-3 mb-6 text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <strong className="text-gray-500">ID Transaksi:</strong>
            <span className="md:col-span-2">#{String(transaction.id).padStart(5, '0')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <strong className="text-gray-500">Nama Transaksi:</strong>
            {/* Menampilkan nama customer jika ada, jika tidak nama transaksi, jika tidak juga strip */}
            <span className="md:col-span-2">{displayValue(transaction.customer_name || transaction.name)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <strong className="text-gray-500">Tanggal:</strong>
            <span className="md:col-span-2">{formatDate(transaction.date)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <strong className="text-gray-500">Metode Pembayaran:</strong>
            <span className="md:col-span-2">{displayValue(transaction.payment_method)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
            <strong className="text-gray-500">Catatan Transaksi:</strong>
            <span className="md:col-span-2 whitespace-pre-wrap break-words">{displayValue(transaction.notes)}</span>
          </div>
        </div>

        {/* Customer Info Section - Ditampilkan jika ada data customer */}
        {(transaction.customer_name || transaction.customer_city || transaction.customer_email || transaction.customer_phone || transaction.customer_address) && (
          <>
            <hr className="my-4 border-gray-200"/>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Detail Customer</h3>
            <div className="space-y-3 mb-6 text-sm text-gray-700">
              {/* Nama Customer sudah ditampilkan di atas sebagai bagian dari Nama Transaksi jika ada */}
              {/* Jika customer_name ada dan berbeda dari transaction.name, Anda bisa menampilkannya lagi di sini */}
              {/* Untuk menghindari duplikasi jika transaction.name adalah nama customer, kita bisa skip field nama customer di sini jika sudah ada di atas */}
              {transaction.customer_city && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                  <strong className="text-gray-500">Kota Customer:</strong>
                  <span className="md:col-span-2">{displayValue(transaction.customer_city)}</span>
                </div>
              )}
              {transaction.customer_email && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                  <strong className="text-gray-500">Email Customer:</strong>
                  <span className="md:col-span-2">{displayValue(transaction.customer_email)}</span>
                </div>
              )}
              {transaction.customer_phone && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                  <strong className="text-gray-500">Telepon Customer:</strong>
                  <span className="md:col-span-2">{displayValue(transaction.customer_phone)}</span>
                </div>
              )}
              {transaction.customer_address && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                  <strong className="text-gray-500">Alamat Customer:</strong>
                  <span className="md:col-span-2 whitespace-pre-wrap break-words">{displayValue(transaction.customer_address)}</span>
                </div>
              )}
            </div>
          </>
        )}

        <hr className="my-4 border-gray-200"/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 items-center mb-6">
            <strong className="text-gray-600 text-base">Total Pemasukan:</strong>
            <span className="md:col-span-2 font-bold text-lg text-emerald-600">
              {formatCurrency(transaction.total_amount)}
            </span>
        </div>

        {/* Items Sold Section */}
        <h3 className="text-lg font-semibold mb-3 text-gray-700 mt-8">Barang yang Dibeli:</h3>
        {transaction.items && transaction.items.length > 0 ? (
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider text-xs">Nama Barang</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider text-xs hidden sm:table-cell">SKU</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase tracking-wider text-xs">Jumlah</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase tracking-wider text-xs">Harga Satuan</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase tracking-wider text-xs">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transaction.items.map((item, index) => (
                  <tr key={item.itemId ? `${item.itemId}-${index}` : index}>
                    <td className="px-4 py-3 text-gray-800">{item.itemName || 'Nama Item Tidak Tersedia'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-md">Tidak ada detail item untuk transaksi ini.</p>
        )}

        {/* Modal Footer */}
        <div className="mt-8 pt-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-150 text-sm font-medium shadow hover:shadow-md"
          >
            Tutup
          </button>
        </div>
      </div>
      <style jsx global>{`
        @keyframes modalFadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-modalFadeInScale {
          animation: modalFadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
