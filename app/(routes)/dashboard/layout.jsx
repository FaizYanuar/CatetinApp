// File: app/(routes)/dashboard/layout.jsx
// (Pastikan path impor untuk SideNav dan HeaderDashboard sudah benar)
"use client";

import React, { useState, useEffect } from 'react';
import SideNav from './_components/SideNav'; // Menggunakan SideNav kustom Anda
import HeaderDashboard from './_components/HeaderDashboard'; // Menggunakan HeaderDashboard kustom Anda

export default function DashboardLayout({ children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  // Efek untuk menangani scroll body saat navigasi seluler terbuka
  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Fungsi cleanup untuk mereset overflow body saat komponen di-unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileNavOpen]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* SideNav Desktop */}
      <div className='fixed inset-y-0 left-0 hidden md:flex md:flex-col md:w-64 z-20'>
        {/* Untuk SideNav desktop, onCloseMobileNav bisa berupa fungsi kosong */}
        <SideNav onCloseMobileNav={() => {}} isMobileView={false} />
      </div>

      {/* SideNav Seluler - ditampilkan secara kondisional sebagai overlay */}
      {isMobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden"
            onClick={toggleMobileNav}
            aria-hidden="true"
          ></div>
          {/* Panel Navigasi Seluler */}
          <div
            className={`fixed top-0 left-0 w-64 h-full shadow-xl z-50 transform transition-transform ease-in-out duration-300 md:hidden 
                        ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Meneruskan fungsi untuk menutup nav saat item diklik */}
            <SideNav onCloseMobileNav={toggleMobileNav} isMobileView={true} />
          </div>
        </>
      )}

      {/* Area Konten Utama */}
      <div className='flex-1 flex flex-col md:ml-64'>
        <HeaderDashboard onMenuClick={toggleMobileNav} />
        <main className="flex-1 p-4 sm:p-6 bg-[#DEDFEC]"> {/* Warna background disesuaikan dengan Dashboard page */}
          {children}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------
