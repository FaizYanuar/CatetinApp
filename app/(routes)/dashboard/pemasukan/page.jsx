'use client'
import React, { useEffect, useState } from "react";
import AddPemasukan from '@/app/(routes)/dashboard/pemasukan/_components/addPemasukanForm';
import PemasukanDetailModal from '@/app/(routes)/dashboard/pemasukan/_components/PemasukanDetailModal';

function Pemasukan() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await fetch("/api/pemasukan"); // API endpoint untuk pemasukan
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Bad response fetching pemasukan:", res.status, errorText);
        setTransactions([]);
        throw new Error(`Failed to fetch pemasukan: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error("Fetched pemasukan data is not an array:", data);
        setTransactions([]);
      }
    } catch (err) {
      console.error("Fetch pemasukan failed:", err);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleShowDetail = async (transactionId) => {
    if (!transactionId) return;
    setIsLoadingDetail(true);
    setSelectedTransaction(null);
    try {
      // Asumsi Anda memiliki atau akan membuat endpoint ini
      const res = await fetch(`/api/pemasukan/${transactionId}`); 
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to load pemasukan details" }));
        console.error("Bad response fetching pemasukan detail:", res.status, errorData);
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      // Pastikan data yang diterima sesuai dengan yang diharapkan oleh TransactionDetailModal
      // Misalnya, jika modal mengharapkan 'items', pastikan API mengirimkannya.
      setSelectedTransaction(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Failed to fetch pemasukan details:", err);
      alert(`Error loading details: ${err.message}`);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleAddModalClose = (refresh) => {
    setShowAddModal(false);
    if (refresh) {
      fetchTransactions();
    }
  };

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

  return (
    <div className='bg-[#DEDFEC] min-h-screen pb-10'>
      <div className='p-5'>
        <h1 className='font-semibold'>Pemasukan | <span className='text-blue-800'>Daftar Penjualan</span></h1>
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 px-5 py-2.5 rounded-md text-white hover:bg-green-700 transition-colors duration-250 shadow hover:shadow-md text-sm font-medium hover:cursor-pointer"
        >
        Tambah Transaksi
        </button>

        <div className="overflow-x-auto my-6 bg-white shadow-lg rounded-lg">
          {isLoadingTransactions ? (
            <p className="p-10 text-center text-gray-500">Memuat data transaksi...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Transaksi/Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Metode Pembayaran</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Total Pemasukan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Catatan</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{tx.customer_name || tx.name || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">{tx.payment_method || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right hidden lg:table-cell">{formatCurrency(tx.total_amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate hidden xl:table-cell" title={tx.notes}>{tx.notes || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleShowDetail(tx.id)}
                        disabled={isLoadingDetail && selectedTransaction?.id !== tx.id}
                        className="bg-sky-500 text-white py-1.5 px-3 rounded-md hover:bg-sky-600 transition-colors duration-200 text-xs font-medium disabled:opacity-50 hover:cursor-pointer"
                      >
                        {(isLoadingDetail && selectedTransaction?.id === tx.id) ? 'Memuat...' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500"> {/* Sesuaikan colSpan */}
                      Tidak ada data transaksi pemasukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && <AddPemasukan onClose={handleAddModalClose} />}

      {showDetailModal && selectedTransaction && (
      <PemasukanDetailModal // <-- Ganti ini
        transaction={selectedTransaction}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
      />
)}
    </div>
  );
}

export default Pemasukan;
