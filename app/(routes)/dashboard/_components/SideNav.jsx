'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react'
import { LayoutDashboard, ShoppingBasket, ShoppingCart, Archive } from 'lucide-react';
import Link from 'next/link';

function SideNav() {
  const navLinks = [
    { id: 1, name: "Dashboard", path: "/dashboard", image: LayoutDashboard },
    { id: 2, name: "Pemasukan", path: "/dashboard/pemasukan", image: ShoppingBasket },
    { id: 3, name: "Pengeluaran", path: "/dashboard/pengeluaran", image: ShoppingCart },
    { id: 4, name: "Stok Barang", path: "/dashboard/stok-barang", image: Archive },
  ];

  const path = usePathname();

  useEffect(()=>{
    console.log(path)
  }, [path])


  return (
    <div className='h-screen bg-[#192030]'>
        
        <div>
            <div className='pt-40 justify-center items-center'>
                {navLinks.map((link, index) => (
                <Link href={link.path} key={link.name}>
                  <button 
                  
                  className={`
                    mx-auto hover:bg-[#787785] w-full h-20 items-center flex gap-2 justify-center hover:cursor-pointer
                    ${path==link.path&&'bg-[#787785]'}
                  `}>
                      <link.image color="#D9D9D9"/>
                      <h1 className='text-white'>{link.name}</h1>
                  </button>
                </Link>
                ))}
            </div>
        </div>

    </div>
  )
}

export default SideNav