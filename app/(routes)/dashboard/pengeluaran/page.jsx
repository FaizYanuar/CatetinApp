'use client'
import React, { useEffect, useState } from "react";
import AddPengeluaran from '@/app/(routes)/dashboard/pengeluaran/_components/addPengeluaranForm';
import TransactionDetailModal from '@/app/(routes)/dashboard/pengeluaran/_components/TransactionDetailModal'; // Ensure this path is correct

function Pengeluaran() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true); // For initial load

  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Bad response fetching transactions:", res.status, errorText);
        setTransactions([]); // Set to empty or handle error state
        throw new Error(`Failed to fetch transactions: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error("Fetched data is not an array:", data);
        setTransactions([]);
      }
    } catch (err) {
      console.error("Fetch transactions failed:", err);
      setTransactions([]); // Set to empty on error
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []); // Fetch transactions on initial component mount

  const handleShowDetail = async (transactionId) => {
    if (!transactionId) return;
    setIsLoadingDetail(true);
    setSelectedTransaction(null); // Clear previous selection
    try {
      const res = await fetch(`/api/transactions/${transactionId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to load transaction details" }));
        console.error("Bad response fetching transaction detail:", res.status, errorData);
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setSelectedTransaction(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Failed to fetch transaction details:", err);
      // Consider showing an error message to the user (e.g., using a toast notification)
      alert(`Error loading details: ${err.message}`);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Callback for AddPengeluaran to refresh data
  const handleAddModalClose = (refresh) => {
    setShowAddModal(false);
    if (refresh) {
      fetchTransactions(); // Re-fetch transactions if refresh is true
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Assuming dateString is in 'YYYY-MM-DD' format or a full ISO string
    const date = new Date(dateString);
    // Adjust for potential timezone issues if the date from DB is just YYYY-MM-DD
    // and JS interprets it as UTC. Adding local timezone offset can help.
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
        <h1 className='font-semibold'>Pengeluaran | <span className='text-blue-800'>Pembelian</span></h1>
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 px-5 py-2.5 rounded-md text-white hover:bg-blue-700 transition-colors duration-250 shadow hover:shadow-md text-sm font-medium"
        >
          + Tambah Transaksi
        </button>

        <div className="overflow-x-auto my-6 bg-white shadow-lg rounded-lg">
          {isLoadingTransactions ? (
            <p className="p-10 text-center text-gray-500">Memuat data transaksi...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Metode Pembayaran</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Total Harga</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap text-base text-gray-800">{tx.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-base text-gray-600 hidden md:table-cell">{formatDate(tx.date)}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-base text-gray-600 hidden md:table-cell">{tx.payment_method || "-"}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-base text-gray-800 text-right hidden md:table-cell">{formatCurrency(tx.total_amount)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate" title={tx.notes}>{tx.notes || "-"}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleShowDetail(tx.id)}
                        disabled={isLoadingDetail && selectedTransaction?.id !== tx.id}
                        className="bg-green-500 text-white py-1.5 px-4 rounded-md hover:bg-green-600 transition-colors duration-200 text-md font-medium disabled:opacity-50"
                      >
                        {(isLoadingDetail && selectedTransaction?.id === tx.id) ? 'Memuat...' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      Tidak ada data transaksi pembelian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && <AddPengeluaran onClose={handleAddModalClose} />}

      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
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

export default Pengeluaran;
