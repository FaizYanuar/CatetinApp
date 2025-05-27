'use client'
import React, { useEffect, useState } from "react";
import AddBarang from '@/app/(routes)/dashboard/stok-barang/_components/addBarangForm';

export default function Stok() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetch("/api/stock")
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error("Expected array but got:", data);
        setItems([]); // or show an error
      }
    })
    .catch((err) => {
      console.error("Failed to load stock:", err);
      setItems([]);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);


  const formatIDR = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const [showModal, setShowModal] = useState(false);


  return (
    <div className="bg-[#DEDFEC] h-fit pb-3">
      <div className="p-5">
        <h1 className="font-semibold">
          Inventory | <span className="text-blue-800">Stok Barang</span>
        </h1>
      </div>

      <div className="px-5 mt-5">
        <button onClick={() => setShowModal(true)} className="bg-blue-300 px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-950 hover:text-white transition-colors duration-250">
          Tambah Barang
        </button>

        <div className="overflow-x-auto my-5">
          {loading ? (
            <p className="p-4">Loading stock…</p>
          ) : items.length === 0 ? (
            <p className="p-4">Belum ada barang.</p>
          ) : (
            <table className="min-w-full bg-white shadow rounded">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Nama Barang
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    SKU
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    Harga Pokok
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    Harga Jual
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Stok
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {item.sku}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {formatIDR(item.cost_price)}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                      {formatIDR(item.sale_price)}
                    </td>
                    <td className="px-4 py-2">{item.current_stock ?? 0}</td>
                    <td className="px-4 py-2">
                      {/* Replace this with your action buttons */}
                      <button className="text-blue-600 hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showModal && <AddBarang onClose={() => setShowModal(false)} />}
    </div>
  );
}
