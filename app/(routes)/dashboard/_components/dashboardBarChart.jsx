// File: components/DashboardBarChart.js
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Helper function untuk format mata uang (IDR)
const formatCurrencyForChart = (value) => {
  if (value === 0) return 'Rp 0';
  if (typeof value !== 'number') return 'Rp -';
  if (Math.abs(value) < 1000) return `Rp ${value}`;
  const suffixes = ["", "rb", "jt", "M", "T"];
  const i = Math.floor(Math.log10(Math.abs(value)) / 3);
  let number = (value / Math.pow(1000, i));
  number = (number % 1 !== 0) ? number.toFixed(1) : number.toFixed(0);
  return `Rp ${number}${suffixes[i] || ''}`;
};

// Helper function untuk format tanggal pada sumbu X
const formatDateForXAxis = (dateString) => {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};

// Custom Tooltip Content untuk menampilkan kedua nilai
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg text-sm">
        <p className="font-semibold text-gray-800 mb-2">{`Tanggal: ${new Date(data.date + "T00:00:00").toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`}</p>
        <p className="text-blue-600">{`Pemasukan: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.totalIncome)}`}</p>
        <p className="text-red-600">{`Pengeluaran: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(data.totalExpenses)}`}</p>
      </div>
    );
  }
  return null;
};

function DashboardBarChart() {
  const { user, isLoaded } = useUser();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterType, setFilterType] = useState('last10days');
  const [filterValue, setFilterValue] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  
  const fetchChartData = useCallback(async () => {
    if (!isLoaded || !user) return;

    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    params.append('filterType', filterType);

    if (filterType === 'monthYear') {
      params.append('month', filterValue.month);
      params.append('year', filterValue.year);
    }

    try {
      const response = await fetch(`/api/daily-sales-summary?${params.toString()}`);
      
      // Memeriksa jika respons tidak OK
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        // Jika server mengembalikan halaman HTML (misalnya, halaman 404 Not Found)
        if (contentType && contentType.includes("text/html")) {
          throw new Error(`Error ${response.status}: API endpoint tidak ditemukan. Pastikan path /api/daily-sales-summary sudah benar.`);
        }
        // Jika server mengembalikan error lain (misalnya, 500 dengan pesan JSON)
        let errorData = { message: `Gagal mengambil data: ${response.statusText}` };
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Biarkan pesan error default jika respons error bukan JSON
        }
        throw new Error(errorData.message || errorData.error || `Gagal mengambil data: ${response.statusText}`);
      }

      const data = await response.json();
      setChartData(data);
    } catch (e) {
      console.error("Gagal mengambil data chart:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, filterType, filterValue]);
  
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  if (loading) return <div className='flex justify-center items-center p-10 w-full h-72 bg-white rounded-lg shadow-md mt-6'><p>Memuat data chart...</p></div>;
  if (error) return <div className='p-5 w-full h-72 bg-red-100 text-red-700 rounded-lg shadow-md mt-6 flex flex-col justify-center items-center text-center'><p className='font-bold mb-2'>Terjadi Kesalahan</p><p className='text-sm'>{error}</p></div>;

  return (
    <div className="md:mx-auto justify-center p-4 w-full sm:w-6/7 bg-white rounded-lg shadow-lg mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-700">
          {filterType === 'last10days' ? 'Pemasukan & Pengeluaran 10 Hari Terakhir' : 'Pemasukan & Pengeluaran per Bulan'}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setFilterType('last10days')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'last10days' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            10 Hari Terakhir
          </button>
          <button 
            onClick={() => setFilterType('monthYear')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === 'monthYear' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Per Bulan
          </button>
          {filterType === 'monthYear' && (
            <div className="flex gap-2">
              <select 
                name="month" 
                value={filterValue.month} 
                onChange={(e) => setFilterValue(prev => ({...prev, month: e.target.value}))}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>)}
              </select>
              <input 
                type="number" 
                name="year" 
                value={filterValue.year} 
                onChange={(e) => setFilterValue(prev => ({...prev, year: e.target.value}))}
                className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className='flex flex-col justify-center items-center p-5 w-full h-72'>
          <p className="text-gray-500 text-center">Tidak ada data untuk periode yang dipilih.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 25, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="date" tickFormatter={formatDateForXAxis} tick={{ fontSize: 10, fill: '#6b7280' }} angle={-30} textAnchor="end" interval={0} height={50} />
            <YAxis tickFormatter={formatCurrencyForChart} tick={{ fontSize: 10, fill: '#6b7280' }} label={{ value: 'Jumlah (IDR)', angle: -90, position: 'insideLeft', offset: -15, style: {fontSize: '12px', fill: '#6b7280', textAnchor: 'middle'} }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(230, 239, 253, 0.5)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            <Bar dataKey="totalIncome" name="Pemasukan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalExpenses" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default DashboardBarChart;
