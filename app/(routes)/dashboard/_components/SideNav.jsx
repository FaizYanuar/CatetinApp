'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { LayoutDashboard, ShoppingBasket, ShoppingCart, Archive, X as CloseIcon } from 'lucide-react';
import Link from 'next/link';

export default function SideNav({ onCloseMobileNav, isMobileView }) {
  const navLinks = [
    { id: 1, name: "Dashboard", path: "/dashboard", Icon: LayoutDashboard },
    { id: 2, name: "Pemasukan", path: "/dashboard/pemasukan", Icon: ShoppingBasket },
    { id: 3, name: "Pengeluaran", path: "/dashboard/pengeluaran", Icon: ShoppingCart },
    { id: 4, name: "Stok Barang", path: "/dashboard/stok-barang", Icon: Archive },
  ];

  const path = usePathname();

  const handleLinkClick = () => {
    if (isMobileView && onCloseMobileNav) {
      onCloseMobileNav();
    }
  };

  return (
    <div className='h-screen bg-[#192030] flex flex-col'>
      <div className="p-4">
        {isMobileView && (
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={onCloseMobileNav}
              className="text-gray-400 hover:text-white"
              aria-label="Tutup menu"
            >
              <CloseIcon size={28} />
            </button>
          </div>
        )}
        <div className={`${isMobileView ? 'pt-0' : 'pt-10 pb-10'}`}> 
          <h1 className="text-2xl font-bold text-white text-center">CatetinApp</h1>
        </div>
      </div>

      <nav className="flex-grow overflow-y-auto">
        <div className='justify-center items-center'>
          {navLinks.map((link) => {
            const IconComponent = link.Icon;
            const isActive = path === link.path;
            return (
              // Menghapus legacyBehavior dan passHref. onClick dan className dipindahkan ke Link.
              <Link 
                href={link.path} 
                key={link.id} 
                onClick={handleLinkClick}
                className={`
                  group mx-auto hover:bg-[#4A5568] w-full h-20 items-center flex gap-2 justify-center
                  transition-colors duration-300 cursor-pointer
                  ${isActive ? 'bg-[#68658d] text-white' : 'text-[#95969B] hover:text-white'}
                `}
              >
                <IconComponent className={`
                  w-6 h-6
                  ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} 
                  transition-colors duration-300
                `}/>
                <span className={`
                  text-base 
                  ${isActive ? 'text-white font-semibold' : 'text-[#95969B] group-hover:text-white'}
                  transition-colors duration-300
                `}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">&copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
