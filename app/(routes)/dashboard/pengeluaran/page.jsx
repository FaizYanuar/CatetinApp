'use client'
import React, { useEffect, useState } from "react";
import AddPengeluaran from '@/app/(routes)/dashboard/pengeluaran/_components/addPengeluaranForm';

function Pengeluaran() {
  const [showModal, setShowModal] = useState(false);
  const [transactions, setTransactions] = useState([]);

useEffect(() => {
  fetch("/api/transactions")
    .then(async res => {
      if (!res.ok) {
        const text = await res.text();
        console.error("Bad response:", text);
        return;
      }
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    })
    .catch(err => console.error("Fetch failed:", err));
}, [showModal]);


  return (
    <div className='bg-[#DEDFEC] min-h-screen'>
      <div className='p-5'>
        <h1 className='font-semibold'>Pengeluaran | <span className='text-blue-800'>Pembelian</span></h1>
      </div>

      <div className="px-5 mt-5">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-300 px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-950 hover:text-white transition-colors duration-250"
        >
          Tambah Transaksi
        </button>

        <div className="overflow-x-auto my-5">
          <table className="min-w-full bg-white shadow rounded">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nama</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Tanggal</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Metode Pembayaran</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">Total Harga</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{tx.name}</td>
                  <td className="px-4 py-2 hidden md:table-cell">{tx.date}</td>
                  <td className="px-4 py-2 hidden md:table-cell">{tx.payment_method || "-"}</td>
                  <td className="px-4 py-2 hidden md:table-cell">Rp {tx.total_amount.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-2">{tx.notes || "-"}</td>
                  <td className="px-4 py-2">
                    <button className=" bg-green-400 py-1 px-3 rounded-sm hover:cursor-pointer hover:bg-[#192030] hover:text-white transition-colors duration-300">Detail</button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddPengeluaran onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default Pengeluaran;
