// File: app/(routes)/dashboard/stok-barang/page.js (atau path yang sesuai)
'use client'
import React, { useEffect, useState, useCallback } from "react";
import { useUser } from '@clerk/nextjs'; // Import useUser dari Clerk
import AddBarang from '@/app/(routes)/dashboard/stok-barang/_components/addBarangForm'; // Pastikan path ini benar
// Impor ikon jika Anda ingin menggunakannya untuk aksi atau indikator
import { Trash2, AlertTriangle, X } from 'lucide-react'; // Hapus Edit, tambahkan X untuk modal

export default function Stok() {
  const { user, isLoaded } = useUser(); // Dapatkan informasi pengguna dari Clerk
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // Default ke true
  const [error, setError] = useState(null); // State untuk menangani error fetch

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const BATAS_MINIMUM_STOK = 5;

  // Fungsi untuk mengambil data stok
  const fetchStockItems = useCallback(async () => {
    if (!user && isLoaded) {
      console.log("Stok Component: Tidak ada pengguna yang login, mengambil item global (jika API mendukung).");
    } else if (!isLoaded) {
        return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stock");
      if (!res.ok) {
        let errorData = { error: `Failed to fetch stock: ${res.statusText} (Status: ${res.status})` };
        try {
            errorData = await res.json();
        } catch (e) {
            // Biarkan errorData default jika parsing gagal
        }
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
  }, [user, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      fetchStockItems();
    }
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

  const handleAddModalClose = (refresh) => {
    setShowAddModal(false);
    if (refresh && isLoaded) {
        fetchStockItems();
    }
  };

  const openDeleteConfirmModal = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirmModal(true);
  };

  const closeDeleteConfirmModal = () => {
    setItemToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stock/${itemToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Gagal menghapus item: ${res.statusText}` }));
        throw new Error(errorData.error || `Gagal menghapus item: ${res.status}`);
      }
      // Sukses menghapus
      console.log(`Item ID: ${itemToDelete.id} berhasil dihapus.`);
      setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id)); // Optimistic update atau panggil fetchStockItems()
      // fetchStockItems(); // Panggil untuk refresh data dari server
    } catch (err) {
      console.error("Failed to delete item:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus item.");
      // Tampilkan notifikasi error ke pengguna jika perlu
    } finally {
      setIsDeleting(false);
      closeDeleteConfirmModal();
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

  if (isLoaded && !user && items.length === 0 && !error) { 
    return (
      <div className="bg-[#DEDFEC] h-fit min-h-screen pb-3">
        <div className="p-5">
          <h1 className="font-semibold">
            Inventory | <span className="text-blue-800">Stok Barang</span>
          </h1>
        </div>
        <div className="px-5 mt-5">
          <div className="text-center py-10 bg-white shadow rounded-lg">
            <p className="text-gray-500">Silakan login untuk mengelola stok barang atau melihat stok spesifik Anda.</p>
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
    <div className="bg-[#DEDFEC] h-fit min-h-screen pb-10">
      <div className="p-5">
        <h1 className="font-semibold">
          Inventory | <span className="text-blue-800">Stok Barang</span>
        </h1>
      </div>

      <div className="px-5 mt-5">
        {user && (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="bg-green-600 px-5 py-2.5 rounded-md text-white hover:bg-green-700 transition-colors duration-250 shadow hover:shadow-md text-sm font-medium mb-6"
            >
              Tambah Barang
            </button>
        )}

        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          {items.length === 0 && !loading ? (
            <div className="text-center py-10">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mx-auto mb-2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <p className="text-gray-500">Belum ada barang yang dapat ditampilkan.</p>
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
                {items.map((item) => {
                  const isGlobalAndNotOwner = item.item_owner_id === null && user;
                  const isNotOwnedByUser = item.item_owner_id !== null && user && item.item_owner_id !== user.id;
                  const actionsUnavailable = !user || isGlobalAndNotOwner || isNotOwnedByUser;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        (item.current_stock ?? 0) < BATAS_MINIMUM_STOK ? 'bg-red-50' : '' 
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
                        {actionsUnavailable ? (
                          <span className="text-xs text-gray-400 italic">Tidak Tersedia</span>
                        ) : (
                          <button 
                            onClick={() => openDeleteConfirmModal(item)}
                            className="text-red-600 hover:text-red-800 hover:underline transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus Barang"
                            disabled={isDeleting}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showAddModal && <AddBarang onClose={handleAddModalClose} />}

      {/* Modal Konfirmasi Penghapusan */}
      {showDeleteConfirmModal && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Konfirmasi Penghapusan</h3>
              <button onClick={closeDeleteConfirmModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus barang "<strong>{itemToDelete.name}</strong>"? Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirmModal}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteItem}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:opacity-70"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
