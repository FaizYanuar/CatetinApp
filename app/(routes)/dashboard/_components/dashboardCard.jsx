// File: components/DashboardCard.js (or your existing path)
"use client"
import React, { useState, useEffect } from 'react';
import { ShoppingBasket, ShoppingCart, Wallet } from 'lucide-react';

// Helper function to format currency to IDR (Indonesian Rupiah)
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    // Return a default or placeholder if amount is not a valid number
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0, // No decimal places for whole numbers
    maximumFractionDigits: 0,
  }).format(amount);
};

function DashboardCard() {
  // State to hold the fetched financial statistics
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
  });
  // State to manage loading status
  const [loading, setLoading] = useState(true);
  // State to hold any error messages
  const [error, setError] = useState(null);

  useEffect(() => {
    // Async function to fetch dashboard statistics from the API
    async function fetchStats() {
      setLoading(true); // Set loading to true before fetching
      setError(null);   // Clear any previous errors
      try {
        const response = await fetch('/api/dashboard'); // Calls the API route
        if (!response.ok) {
          // If response is not OK, parse error message from API or use status text
          const errorData = await response.json().catch(() => ({})); // Gracefully handle non-JSON error responses
          throw new Error(errorData.error || `Gagal mengambil data: ${response.statusText}`);
        }
        const data = await response.json(); // Parse JSON data from response
        setStats(data); // Update state with fetched data
      } catch (e) {
        console.error("Failed to fetch dashboard stats:", e);
        setError(e.message); // Set error message in state
      } finally {
        setLoading(false); // Set loading to false after fetching (success or failure)
      }
    }
    fetchStats(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array means this effect runs once on mount

  // Display loading message while data is being fetched
  if (loading) {
    return (
      <div className='flex justify-center items-center p-10 w-full'>
        <div className="flex flex-col items-center space-y-2">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Memuat data statistik...</p>
        </div>
      </div>
    );
  }

  // Display error message if fetching failed
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

  // Main component render with fetched data
  return (
    <div className='flex justify-center items-start p-5 w-full'> {/* items-start to align cards at the top if they have different heights due to long numbers */}
        <div className='flex flex-wrap justify-center gap-6'> {/* flex-wrap for responsiveness, gap-6 for spacing */}

            {/* Pemasukan Card */}
            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-green-600 w-1.5 h-12 self-stretch rounded-full'></div> {/* Decorative colored bar */}
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Pemasukan</h1>
                    <h2 className='font-semibold text-2xl text-green-700 tracking-tight'>{formatCurrency(stats.totalIncome)}</h2>
                </div>
                <div className="bg-green-600 text-white p-2.5 rounded-full shadow-md">
                    <ShoppingBasket size={24} /> {/* Lucide icon */}
                </div>
            </div>

            {/* Pengeluaran Card */}
            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-red-500 w-1.5 h-12 self-stretch rounded-full'></div> {/* Decorative colored bar */}
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Pengeluaran</h1>
                    <h2 className='font-semibold text-2xl text-red-600 tracking-tight'>{formatCurrency(stats.totalExpenses)}</h2>
                </div>
                <div className="bg-red-500 text-white p-2.5 rounded-full shadow-md">
                    <ShoppingCart size={24} /> {/* Lucide icon */}
                </div>
            </div>

            {/* Total Pendapatan Card */}
            <div className='bg-white w-full sm:w-auto min-w-[280px] max-w-xs py-4 px-5 rounded-lg flex gap-x-4 items-center shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out'>
                <div className='bg-blue-600 w-1.5 h-12 self-stretch rounded-full'></div> {/* Decorative colored bar */}
                <div className='flex-grow'>
                    <h1 className='text-gray-500 text-sm font-medium'>Total Pendapatan</h1>
                    <h2 className='font-semibold text-2xl text-blue-700 tracking-tight'>{formatCurrency(stats.netIncome)}</h2>
                </div>
                <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-md">
                     <Wallet size={24} /> {/* Lucide icon */}
                </div>
            </div>
        </div>
    </div>
  );
}

export default DashboardCard;
