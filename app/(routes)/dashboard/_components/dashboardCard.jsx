// File: components/DashboardCard.js (atau path yang Anda gunakan)
"use client"
import React, { useState, useEffect, useCallback } from 'react';
// import { useUser } from '@clerk/nextjs'; // Dihapus untuk mengatasi masalah kompilasi
import { ShoppingBasket, ShoppingCart, Wallet, Filter as FilterIcon, X as CloseIcon } from 'lucide-react';

// Helper function untuk format mata uang (IDR)
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function DashboardCard() {
  // const { user, isLoaded } = useUser(); // Dihapus untuk mengatasi masalah kompilasi
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, netIncome: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk filter
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  
  // State untuk modal filter
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // State sementara untuk menampung perubahan filter di dalam modal
  const [tempFilterType, setTempFilterType] = useState(filterType);
  const [tempFilterValue, setTempFilterValue] = useState(filterValue);


  const fetchStats = useCallback(async () => {
    // Pengecekan isLoaded dihapus
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('type', filterType); // Menggunakan filterType yang sudah di-commit, bukan temp
    if (filterType === 'month') {
        params.append('year', filterValue.year);
        params.append('month', filterValue.month);
    } else if (filterType === 'year') {
        params.append('year', filterValue.year);
    }

    try {
      const response = await fetch(`/api/dashboard?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Gagal mengambil data: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch dashboard stats:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterValue]); // Dependensi disederhanakan

  useEffect(() => {
    fetchStats();
  }, [fetchStats]); // useEffect sekarang hanya bergantung pada fetchStats, yang akan berubah jika filter berubah

  const handleApplyFilter = () => {
      setFilterType(tempFilterType);
      setFilterValue(tempFilterValue);
      setShowFilterModal(false);
  };
  
  const openFilterModal = () => {
      setTempFilterType(filterType);
      setTempFilterValue(filterValue);
      setShowFilterModal(true);
  };


  if (loading && !showFilterModal) { // Jangan tampilkan skeleton jika modal terbuka
    return (
        <div className='w-full px-5'>
            {/* Tampilkan tombol filter bahkan saat loading */}
            <div className="mb-4 flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 opacity-50 cursor-not-allowed">
                    <FilterIcon size={16} />
                    Filter
                </button>
            </div>
            <div className='flex flex-wrap justify-center gap-6 animate-pulse'>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className='bg-gray-200 w-full sm:w-auto min-w-[280px] max-w-xs h-[104px] rounded-lg'></div>
                ))}
            </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center p-5 w-full'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center' role="alert">
          <strong className="font-bold">Oops!</strong>
          <span className="block sm:inline"> Terjadi kesalahan saat memuat statistik: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full px-5'>
        {/* Tombol Filter Utama */}
        <div className="mb-4 flex justify-end">
            <button 
                onClick={openFilterModal}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <FilterIcon size={16} />
                Filter
            </button>
        </div>

        {/* Modal Filter */}
        {showFilterModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filter Data Statistik</h3>
                        <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-gray-600">
                            <CloseIcon size={24} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">Tampilkan Data</label>
                            <select 
                                id="filterType"
                                value={tempFilterType} 
                                onChange={(e) => setTempFilterType(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="all">Semua</option>
                                <option value="month">Per Bulan</option>
                                <option value="year">Per Tahun</option>
                            </select>
                        </div>
                        {tempFilterType === 'month' && (
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor="month" className="block text-sm font-medium text-gray-700">Bulan</label>
                                    <select id="month" value={tempFilterValue.month} onChange={(e) => setTempFilterValue(p => ({...p, month: e.target.value}))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="year" className="block text-sm font-medium text-gray-700">Tahun</label>
                                    <input type="number" id="year" value={tempFilterValue.year} onChange={(e) => setTempFilterValue(p => ({...p, year: e.target.value}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                        )}
                        {tempFilterType === 'year' && (
                            <div>
                                <label htmlFor="year-only" className="block text-sm font-medium text-gray-700">Tahun</label>
                                <input type="number" id="year-only" value={tempFilterValue.year} onChange={(e) => setTempFilterValue(p => ({...p, year: e.target.value}))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                            </div>
                        )}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setShowFilterModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
                        <button onClick={handleApplyFilter} className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700">Terapkan</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* --- Kartu Statistik --- */}
        <div className='flex flex-wrap justify-center gap-6'>
            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-green-600 w-1.5 h-12 self-stretch rounded-full'></div>
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Pemasukan</h1>
                    <h2 className='font-semibold text-2xl text-green-700 tracking-tight'>{formatCurrency(stats.totalIncome)}</h2>
                </div>
                <div className="bg-green-600 text-white p-2.5 rounded-full shadow-md">
                    <ShoppingBasket size={24} />
                </div>
            </div>

            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-red-500 w-1.5 h-12 self-stretch rounded-full'></div>
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Pengeluaran</h1>
                    <h2 className='font-semibold text-2xl text-red-600 tracking-tight'>{formatCurrency(stats.totalExpenses)}</h2>
                </div>
                <div className="bg-red-500 text-white p-2.5 rounded-full shadow-md">
                    <ShoppingCart size={24} />
                </div>
            </div>

            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-blue-600 w-1.5 h-12 self-stretch rounded-full'></div>
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Total Pendapatan</h1>
                    <h2 className='font-semibold text-2xl text-blue-700 tracking-tight'>{formatCurrency(stats.netIncome)}</h2>
                </div>
                <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-md">
                     <Wallet size={24} />
                </div>
            </div>
        </div>
    </div>
  );
}

export default DashboardCard;
