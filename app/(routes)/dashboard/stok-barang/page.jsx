import React from 'react'

function Stok() {
  return (
    <div className='bg-[#DEDFEC] h-screen'>
      
      <div className='p-5'>
        <h1 className='font-semibold'>Inventory | <span className='text-blue-800'>Stok Barang</span></h1>
      </div>

      <div className='px-5 mt-5'>
        
        <button className='bg-blue-300 px-4 py-2 rounded hover:cursor-pointer hover:bg-blue-950 hover:text-white transition-colors duration-250'>Tambah Barang</button>
      
        <table className="min-w-full bg-white shadow rounded my-5 ">
          <thead>
            <tr>
            {['Nama Barang','SKU','Harga Pokok','Harga Jual','Stok','Aksi']
              .map((h) => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  {h}
                </th>
              ))}
          </tr>
          </thead>
          <tbody>
            <tr className='border-t hover:bg-gray-50'>
              <td className='px-4 py-2'>Keyboard Logitech</td>
              <td className='px-4 py-2'>K201</td>
              <td className='px-4 py-2'>Rp400.000</td>
              <td className='px-4 py-2'>Rp500.000</td>
              <td className='px-4 py-2'>41</td>
              <td className='px-4 py-2 italic'>unavailable</td>
            </tr>
          </tbody>
        </table>

      </div>

    </div>
  )
}

export default Stok