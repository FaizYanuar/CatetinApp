// File: app/(routes)/dashboard/_components/HeaderDashboard.jsx
// "use client"; // Tidak perlu jika tidak ada hook client di sini, tapi aman untuk ditambahkan

import { UserButton } from '@clerk/nextjs'; // Pastikan @clerk/nextjs terinstal
import React from 'react';
import { Menu as MenuIcon, X } from 'lucide-react'; // Mengganti nama Menu agar tidak konflik

function HeaderDashboardComponent({ onMenuClick }) { // Mengganti nama fungsi agar unik
  return (
    <div className='h-20 flex justify-between items-center px-4 sm:px-6 border-b bg-white shadow-sm sticky top-0 z-30'>
      {/* Tombol Hamburger Menu untuk Mobile */}
      <button
        onClick={onMenuClick}
        className='md:hidden text-gray-600 hover:text-gray-800 p-2 -ml-2'
        aria-label="Buka menu"
      >
        <MenuIcon size={28} />
      </button>

      {/* Judul Dashboard (hanya tampil di desktop) */}
      <h2 className='hidden md:block text-xl font-semibold text-gray-700'>
        {/* Anda bisa menambahkan judul dinamis di sini jika perlu */}
      </h2>
      
      {/* UserButton dari Clerk */}
      <div className="ml-auto md:ml-0"> {/* Memastikan UserButton selalu di kanan */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: '40px',
                height: '40px',
              },
              userButtonPopoverCard: { // Untuk memastikan popover bisa diklik jika ada masalah z-index
                pointerEvents: "initial",
                zIndex: 9999 
              }
            },
          }}
        />
      </div>
    </div>
  );
}
export default HeaderDashboardComponent; // Ekspor dengan nama yang diubah