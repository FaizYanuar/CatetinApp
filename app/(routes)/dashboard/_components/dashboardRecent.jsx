// File: components/DashboardRecent.js 
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs'; // 1. Impor useUser dari Clerk
import { Eye, Edit3, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';

// ... (Helper functions: formatCurrency, formatDate, truncateNotes tetap sama)
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'Rp -';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const truncateNotes = (notes, maxLength = 30) => {
  if (!notes) return '-';
  if (notes.length <= maxLength) return notes;
  return notes.substring(0, maxLength) + '...';
};

function DashboardRecent() {
  const { user, isLoaded } = useUser(); // 2. Dapatkan informasi pengguna dari Clerk
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // 3. Ubah useEffect agar bergantung pada perubahan user
  useEffect(() => {
    // Hanya fetch jika Clerk sudah siap dan user sudah teridentifikasi
    if (isLoaded && user) {
        async function fetchRecentTransactions() {
          setLoading(true);
          setError(null);
          console.log(`DashboardRecent: Memulai pengambilan transaksi terbaru untuk userId: ${user.id}...`);
          try {
            const response = await fetch('/api/recent-transaction?limit=10');
            
            if (!response.ok) {
              // Penanganan error yang lebih baik untuk Not Found
              if (response.status === 404) {
                  throw new Error(`Error ${response.status}: API endpoint tidak ditemukan di /api/recent-transactions.`);
              }
              let errorData = { message: `Gagal mengambil data: ${response.statusText}` };
              try {
                errorData = await response.json();
              } catch (jsonError) { /* biarkan errorData default */ }
              throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
            }

            const data = await response.json();
            // Perbaikan: Cek jika `type` ada sebelum mencoba menggunakan `displayType`
            const formattedData = data.map(tx => ({
              ...tx,
              displayType: tx.type === 'sale' ? 'Pemasukan' : (tx.type === 'expense' ? 'Pengeluaran' : tx.type)
            }));
            setTransactions(formattedData);

          } catch (e) {
            console.error("DashboardRecent: Gagal mengambil atau memproses transaksi terbaru:", e);
            setError(e.message);
            setTransactions([]); // Pastikan state dikosongkan jika ada error
          } finally {
            setLoading(false);
          }
        }
        fetchRecentTransactions();
    } else if (isLoaded && !user) {
        // Jika Clerk sudah selesai loading tapi tidak ada user, kosongkan data
        console.log("DashboardRecent: Tidak ada pengguna yang login, kosongkan transaksi.");
        setTransactions([]);
        setLoading(false);
    }
  }, [user?.id, isLoaded]); // Dependensi diperbarui

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Menunggu Clerk dan data awal selesai dimuat
  if (!isLoaded || loading) {
    return (
      <div className='bg-white w-full lg:w-6/7 mx-auto mt-10 rounded-lg shadow-lg p-4'>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Transaksi Terbaru</h3>
        <div className="flex justify-center items-center h-40">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-2 text-gray-500">Memuat transaksi...</p>
        </div>
      </div>
    );
  }

  // Menampilkan error jika ada
  if (error) {
    return (
      <div className='bg-white w-full lg:w-6/7 mx-auto mt-10 rounded-lg shadow-lg p-4'>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Transaksi Terbaru</h3>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center' role="alert">
          <strong className="font-bold">Oops! Terjadi Kesalahan</strong>
          <span className="block sm:inline mt-1 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white w-full lg:w-6/7 mx-auto mt-10 rounded-lg shadow-lg p-3 sm:p-4 overflow-x-auto'>
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Transaksi Terbaru</h3>
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mx-auto mb-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p className="text-gray-500">Belum ada transaksi untuk ditampilkan.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Metode Bayar</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider sm:hidden">Detail</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{tx.name || '-'}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.type === 'sale' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.displayType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{formatDate(tx.date)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium text-right ${
                      tx.type === 'sale' ? 'text-green-600' : 'text-red-600'
                    }`}>{formatCurrency(tx.totalAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{tx.paymentMethod || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium sm:hidden">
                      <button onClick={() => toggleExpandRow(tx.id)} className="text-gray-500 hover:text-gray-700" title="Detail">
                        {expandedRow === tx.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === tx.id && (
                    <tr className="sm:hidden bg-gray-50">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="text-xs text-gray-700 space-y-1">
                          <p><strong>Tanggal:</strong> {formatDate(tx.date)}</p>
                          <p><strong>Metode Bayar:</strong> {tx.paymentMethod || '-'}</p>
                          {tx.notes && <p><strong>Catatan:</strong> {truncateNotes(tx.notes, 100)}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default DashboardRecent;
