// File: app/(routes)/dashboard/pengeluaran/page.js
'use client'
import React, { useEffect, useState, useCallback } from "react";
import { useUser } from '@clerk/nextjs';
import AddPengeluaran from '@/app/(routes)/dashboard/pengeluaran/_components/addPengeluaranForm';
import TransactionDetailModal from '@/app/(routes)/dashboard/pengeluaran/_components/TransactionDetailModal';
import { Filter, Search } from "lucide-react";

export default function Pengeluaran() {
  const { user, isLoaded } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // State untuk filter
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    date: new Date().toISOString().split('T')[0],
  });

  // Fungsi untuk mengambil data dari API pengeluaran
  const fetchTransactions = useCallback(async () => {
    if (!isLoaded || !user) {
        setTransactions([]);
        setIsLoadingTransactions(false);
        return;
    }

    setIsLoadingTransactions(true);
    
    // Bangun query string berdasarkan state filter
    const params = new URLSearchParams();
    params.append('type', filterType);
    if (filterType === 'month') {
        params.append('year', filterValue.year);
        params.append('month', filterValue.month);
    } else if (filterType === 'year') {
        params.append('year', filterValue.year);
    } else if (filterType === 'date') {
        params.append('date', filterValue.date);
    }

    try {
      // Panggil API pengeluaran (yaitu /api/transactions) dengan parameter filter
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Gagal mengambil data pengeluaran`);
      }
      
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch pengeluaran failed:", err);
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [user, isLoaded, filterType, filterValue]);

  // useEffect untuk memuat data awal saat user berubah atau pertama kali load
  useEffect(() => {
    if (isLoaded) {
      fetchTransactions();
    }
  }, [user?.id, isLoaded]); // Hanya fetch ulang saat user berubah

  const handleShowDetail = async (transactionId) => {
    if (!transactionId) return;
    setIsLoadingDetail(true);
    setSelectedTransaction(null);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to load transaction details" }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setSelectedTransaction(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Failed to fetch transaction details:", err);
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

  const handleFilterChange = (e) => {
    setFilterValue(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilter = () => {
    // Memanggil fetch secara manual saat tombol "Cari" diklik
    fetchTransactions();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('id-ID', {
      timeZone: 'UTC',
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

  if (!isLoaded) {
      return <div className="p-10 text-center">Memuat autentikasi...</div>;
  }

  return (
    <div className='bg-[#DEDFEC] min-h-screen pb-10'>
      <div className='p-5'>
        <h1 className='font-semibold'>Pengeluaran | <span className='text-blue-800'>Daftar Pembelian</span></h1>
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 px-5 py-2.5 rounded-md text-white hover:bg-blue-700 transition-colors duration-250 shadow hover:shadow-md text-sm font-medium"
        >
          Tambah Transaksi
        </button>

        {/* --- UI Filter --- */}
        <div className="my-6 p-4 bg-white shadow-lg rounded-lg flex flex-wrap items-end gap-4">
            <div className="flex-grow min-w-[150px]">
                <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1">Filter Berdasarkan</label>
                <select 
                    id="filterType"
                    name="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                    <option value="all">Semua</option>
                    <option value="date">Tanggal</option>
                    <option value="month">Bulan & Tahun</option>
                    <option value="year">Tahun</option>
                </select>
            </div>

            {filterType === 'date' && (
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tanggal</label>
                    <input type="date" name="date" value={filterValue.date} onChange={handleFilterChange} className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"/>
                </div>
            )}
            {filterType === 'month' && (
                <>
                    <div className="flex-grow min-w-[150px]">
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                        <select name="month" value={filterValue.month} onChange={handleFilterChange} className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm">
                            {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow min-w-[120px]">
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                        <input type="number" name="year" placeholder="e.g. 2024" value={filterValue.year} onChange={handleFilterChange} className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"/>
                    </div>
                </>
            )}
            {filterType === 'year' && (
                <div className="flex-grow min-w-[120px]">
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Pilih Tahun</label>
                    <input type="number" name="year" placeholder="e.g. 2024" value={filterValue.year} onChange={handleFilterChange} className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"/>
                </div>
            )}

            <button
                onClick={handleApplyFilter}
                className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                disabled={isLoadingTransactions}
            >
                <Search size={16} />
                {isLoadingTransactions ? 'Mencari...' : 'Cari'}
            </button>
        </div>

        {/* --- Tabel --- */}
        <div className="overflow-x-auto my-6 bg-white shadow-lg rounded-lg">
          {isLoadingTransactions ? (
            <p className="p-10 text-center text-gray-500">Memuat data transaksi...</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Transaksi/Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tanggal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Kota Supplier</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.length > 0 ? transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{tx.supplier_name || tx.name || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-right">{formatCurrency(tx.total_amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">{tx.supplier_city || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleShowDetail(tx.id)}
                        disabled={isLoadingDetail && selectedTransaction?.id === tx.id}
                        className="bg-green-500 text-white py-1.5 px-3 rounded-md hover:bg-green-600 transition-colors duration-200 text-xs font-medium disabled:opacity-50"
                      >
                        {(isLoadingDetail && selectedTransaction?.id === tx.id) ? 'Memuat...' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      Tidak ada data pengeluaran yang cocok dengan filter.
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
