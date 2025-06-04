// File: components/DashboardBarChart.js (atau path yang Anda gunakan)
"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList // Opsional, jika Anda ingin menampilkan label di atas bar
} from 'recharts';

// Helper function untuk format mata uang (IDR)
const formatCurrencyForChart = (value) => {
  if (value === 0) return 'Rp 0';
  if (typeof value !== 'number') return 'Rp -'; // Tangani input non-numerik
  if (Math.abs(value) < 1000) return `Rp ${value}`;

  const suffixes = ["", "rb", "jt", "M", "T"]; // Ribu, Juta, Miliar, Triliun
  const i = Math.floor(Math.log10(Math.abs(value)) / 3);
  let number = (value / Math.pow(1000, i));
  // Tampilkan satu desimal jika bukan bilangan bulat setelah pembagian, jika tidak tampilkan bilangan bulat
  number = (number % 1 !== 0) ? number.toFixed(1) : number.toFixed(0);
  return `Rp ${number}${suffixes[i] || ''}`; // Tambahkan fallback string kosong untuk suffixes
};

// Helper function untuk format tanggal pada sumbu X
const formatDateForXAxis = (dateString) => {
  // dateString diharapkan dalam format YYYY-MM-DD
  const date = new Date(dateString + "T00:00:00"); // Tambahkan T00:00:00 untuk menghindari masalah zona waktu saat parsing
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }); // Contoh: "03 Jun"
};

// Custom Tooltip Content untuk tampilan yang lebih baik
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Label di sini adalah tanggal yang sudah diformat oleh XAxis tickFormatter
    // Kita ambil data asli dari payload untuk tanggal YYYY-MM-DD
    const originalDate = payload[0].payload.date; // Asumsi 'date' adalah YYYY-MM-DD dari API
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
        <p className="text-sm font-semibold text-gray-700">{`Tanggal: ${new Date(originalDate + "T00:00:00").toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`}</p>
        <p className="text-sm text-blue-600">{`Total Penjualan: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};


function DashboardBarChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDailySalesSummary() {
      setLoading(true);
      setError(null);
      console.log("DashboardBarChart: Memulai pengambilan ringkasan penjualan harian...");
      try {
        // Panggil API endpoint baru, misal untuk 10 hari terakhir dengan data
        // API akan mengembalikan 10 hari terakhir yang memiliki penjualan dari rentang 30 hari
        const response = await fetch('/api/daily-sales-summary?days=30');
        console.log("DashboardBarChart: Status respons API:", response.status);

        if (!response.ok) {
          let errorData = { message: `Gagal mengambil data: ${response.statusText}` };
          try {
            errorData = await response.json(); // Coba parse JSON error
            console.error("DashboardBarChart: Data respons error API:", errorData);
          } catch (jsonError) {
            // Jika respons error bukan JSON
            console.error("DashboardBarChart: Respons error API bukan JSON.", jsonError);
          }
          throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        console.log("DashboardBarChart: Data yang diterima dari API (penjualan harian):", data);
        setChartData(data); // Perbarui state dengan data yang diambil
      } catch (e) {
        console.error("DashboardBarChart: Gagal mengambil atau memproses ringkasan penjualan harian:", e);
        setError(e.message); // Atur pesan error untuk ditampilkan
      } finally {
        setLoading(false); // Pastikan loading diatur ke false setelah upaya fetch
      }
    }
    fetchDailySalesSummary();
  }, []); // Array dependensi kosong memastikan ini berjalan sekali saat mount

  // Tampilkan indikator loading
  if (loading) {
    return (
      <div className='flex justify-center items-center p-10 w-full h-72 bg-white rounded-lg shadow-md'>
        <div className="flex flex-col items-center space-y-2">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Memuat data chart penjualan harian...</p>
        </div>
      </div>
    );
  }

  // Tampilkan pesan error jika pengambilan gagal
  if (error) {
    return (
      <div className='flex justify-center items-center p-5 w-full h-72 bg-white rounded-lg shadow-md'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center' role="alert">
          <strong className="font-bold">Oops!</strong>
          <span className="block sm:inline"> Terjadi kesalahan: {error}</span>
        </div>
      </div>
    );
  }

  // Tampilkan pesan jika tidak ada data yang tersedia
  if (chartData.length === 0) {
    return (
       <div className='flex flex-col justify-center items-center p-5 w-full h-72 bg-white rounded-lg shadow-md'>
        {/* Icon sederhana untuk "tidak ada data" */}
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
        <p className="text-gray-500 text-center">Belum ada data penjualan harian untuk ditampilkan.</p>
      </div>
    )
  }

  // Render grafik batang
  return (
    <div className="md:mx-auto justify-center p-4 w-full sm:w-6/7 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Total Penjualan 10 Hari Terakhir</h3>
      <ResponsiveContainer width="100%" height={350}> {/* Tambah tinggi untuk label X-axis */}
        <BarChart
        className=''
          data={chartData}
          margin={{
            top: 5,
            right: 20, // Margin untuk sisi kanan chart
            left: 25,  // Margin kiri yang disesuaikan untuk label dan tick Y-axis
            bottom: 40, // Beri ruang lebih untuk label X-axis yang mungkin panjang/miring
          }}
          barCategoryGap="25%" // Spasi antar kategori bar (setiap tick X-axis)
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date" // Kunci data untuk label X-axis (tanggal dari API)
            tickFormatter={formatDateForXAxis} // Format tanggal untuk tampilan
            tick={{ fontSize: 10, fill: '#6b7280' }}
            angle={-30}    // Miringkan label X-axis untuk keterbacaan yang lebih baik
            textAnchor="end" // Titik jangkar untuk label yang dimiringkan
            interval={0}   // Tampilkan semua label
            height={50}    // Alokasikan lebih banyak tinggi untuk label X-axis yang dimiringkan
          />
          <YAxis
            tickFormatter={formatCurrencyForChart} // Format tick Y-axis sebagai mata uang
            tick={{ fontSize: 10, fill: '#6b7280' }}
            // Judul/label Y-axis
            label={{ value: 'Total Penjualan (IDR)', angle: -90, position: 'insideLeft', offset: -15, style: {fontSize: '12px', fill: '#6b7280', textAnchor: 'middle'} }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(230, 239, 253, 0.5)' }} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
          <Bar 
            dataKey="totalSales" // Kunci data untuk nilai bar (total penjualan dari API)
            name="Total Penjualan Harian" 
            fill="#3b82f6" // Warna bar (Tailwind blue-500)
            radius={[4, 4, 0, 0]} // Sudut atas bar yang dibulatkan
            barSize={30} // Lebar maksimum setiap bar
          >
            {/* Opsional: LabelList untuk menampilkan nilai di atas setiap bar */}
            {/* <LabelList dataKey="totalSales" position="top" formatter={formatCurrencyForChart} style={{ fontSize: 9, fill: '#374151' }} /> */}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardBarChart;
