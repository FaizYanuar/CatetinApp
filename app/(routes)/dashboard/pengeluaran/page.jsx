'use client'
import React, { useEffect, useState } from "react";
import AddPengeluaran from '@/app/(routes)/dashboard/pengeluaran/_components/addPengeluaranForm';

function Pengeluaran() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className='bg-[#DEDFEC] h-screen'>

      <div className='p-5'>
        <h1 className='font-semibold'>Pengeluaran | <span className='text-blue-800'>Pembelian</span></h1>
      </div>

     <div className="px-5 mt-5">
        <button onClick={() => setShowModal(true)} className="bg-blue-300 px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-950 hover:text-white transition-colors duration-250">
          Tambah Transaksi
        </button>

        <div className="overflow-x-auto my-5">
            <table className="min-w-full bg-white shadow rounded">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Nama
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    Tanggal
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    Metode Pembayaran
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 hidden md:table-cell">
                    Total Harga
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Notes
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                  <tr
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 hidden md:table-cell">
                
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                  
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell">
                     
                    </td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
               
              </tbody>
            </table>
      
        </div>
      </div>
      {showModal && <AddPengeluaran onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default Pengeluaran