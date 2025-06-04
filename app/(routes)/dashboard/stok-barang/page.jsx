// File: app/(routes)/dashboard/stok-barang/page.js (atau path yang sesuai)
'use client'
import React, { useEffect, useState, useCallback } from "react";
import { useUser } from '@clerk/nextjs'; // Import useUser dari Clerk
import AddBarang from '@/app/(routes)/dashboard/stok-barang/_components/addBarangForm'; // Pastikan path ini benar
// Impor ikon jika Anda ingin menggunakannya untuk aksi atau indikator
import { Edit, Trash2, AlertTriangle } from 'lucide-react'; 

export default function Stok() {
  const { user, isLoaded } = useUser(); // Dapatkan informasi pengguna dari Clerk
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Default ke true
  const [error, setError] = useState(null); // State untuk menangani error fetch

  const [showModal, setShowModal] = useState(false);
  const BATAS_MINIMUM_STOK = 15;

  // Fungsi untuk mengambil data stok
  const fetchStockItems = useCallback(async () => {
    if (!user) { // Jangan fetch jika tidak ada user
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null); // Reset error sebelum fetch baru
    console.log(`Stok Component: Memulai pengambilan data stok untuk user ID: ${user.id}...`);
    try {
      const res = await fetch("/api/stock");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Failed to fetch stock: ${res.statusText}`}));
        console.error("Bad response fetching stock:", res.status, errorData);
        setError(errorData.error || `Gagal mengambil data stok: ${res.status}`);
        setItems([]);
        throw new Error(errorData.error || `Gagal mengambil data stok: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("Expected array for stock data but got:", data);
        setError("Format data stok tidak sesuai.");
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load stock:", err);
      setError(err.message || "Terjadi kesalahan saat memuat stok.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]); // Tambahkan user sebagai dependensi useCallback

  useEffect(() => {
    // Hanya jalankan fetch jika Clerk selesai loading dan user sudah teridentifikasi
    if (isLoaded && user) {
      fetchStockItems();
    } else if (isLoaded && !user) {
      // Jika Clerk sudah loaded tapi tidak ada user (misalnya, setelah logout)
      console.log("Stok Component: Tidak ada pengguna yang login, kosongkan item stok.");
      setItems([]);
      setLoading(false); // Pastikan loading dihentikan
    }
    // user?.id dan isLoaded sebagai dependensi untuk re-fetch saat user berubah
  }, [user?.id, isLoaded, fetchStockItems]);

  const formatIDR = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Rp -';
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(numValue);
  }

  const handleModalClose = (refresh) => {
    setShowModal(false);
    if (refresh && user) { // Hanya refresh jika ada user
        fetchStockItems();
    }
  };
  
  // Menunggu Clerk dan data awal selesai dimuat
  if (!isLoaded || loading) {
    return (
      <div className="bg-[#DEDFEC] h-fit min-h-screen pb-3">
        <div className="p-5">
          <h1 className="font-semibold">
            Inventory | <span className="text-blue-800">Stok Barang</span>
          </h1>
        </div>
        <div className="px-5 mt-5">
          <div className="flex justify-center items-center h-40 bg-white shadow rounded-lg">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-2 text-gray-500">Memuat data stok...</p>
          </div>
        </div>
      </div>
    );
  }

  // Jika sudah selesai loading (isLoaded true) dan tidak ada user, tampilkan pesan sesuai
  if (isLoaded && !user) {
    return (
      <div className="bg-[#DEDFEC] h-fit min-h-screen pb-3">
        <div className="p-5">
          <h1 className="font-semibold">
            Inventory | <span className="text-blue-800">Stok Barang</span>
          </h1>
        </div>
        <div className="px-5 mt-5">
          <div className="text-center py-10 bg-white shadow rounded-lg">
            <p className="text-gray-500">Silakan login untuk melihat data stok barang.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#DEDFEC] h-fit min-h-screen pb-3">
        <div className="p-5">
          <h1 className="font-semibold">
            Inventory | <span className="text-blue-800">Stok Barang</span>
          </h1>
        </div>
        <div className="px-5 mt-5">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center shadow-lg" role="alert">
            <strong className="font-bold">Oops!</strong>
            <span className="block sm:inline"> Terjadi kesalahan: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#DEDFEC] h-fit min-h-screen pb-10"> {/* min-h-screen untuk memastikan background mengisi layar */}
      <div className="p-5">
        <h1 className="font-semibold">
          Inventory | <span className="text-blue-800">Stok Barang</span>
        </h1>
      </div>

      <div className="px-5 mt-5">
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-green-600 px-5 py-2.5 rounded-md text-white hover:bg-green-700 transition-colors duration-250 shadow hover:shadow-md text-sm font-medium"
        >
          Tambah Barang
        </button>

        <div className="overflow-x-auto my-6 bg-white shadow-lg rounded-lg">
          {items.length === 0 && !loading ? ( // Cek !loading juga
            <div className="text-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mx-auto mb-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <p className="text-gray-500">Belum ada barang yang ditambahkan.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nama Barang
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Harga Pokok
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Harga Jual
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                      (item.current_stock ?? 0) < BATAS_MINIMUM_STOK ? 'bg-red-50' : '' // Highlight baris jika stok menipis
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {formatIDR(item.cost_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                      {formatIDR(item.sale_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 text-center">
                      {item.current_stock ?? 0}
                      {(item.current_stock ?? 0) < BATAS_MINIMUM_STOK && (
                        <span className="ml-1.5 text-red-500 inline-flex items-center" title={`Stok menipis! Batas minimum: ${BATAS_MINIMUM_STOK}`}>
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => alert(`Edit item ID: ${item.id}`)} // Placeholder untuk aksi edit
                        className="text-indigo-600 hover:text-indigo-900 hover:underline transition-colors duration-150 mr-2"
                        title="Edit Barang"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => alert(`Hapus item ID: ${item.id}`)} // Placeholder untuk aksi hapus
                        className="text-red-600 hover:text-red-900 hover:underline transition-colors duration-150"
                        title="Hapus Barang"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showModal && <AddBarang onClose={handleModalClose} />}
    </div>
  );
}
