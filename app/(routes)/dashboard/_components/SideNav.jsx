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
                    group mx-auto  hover:bg-[#68658d] w-full h-20 items-center flex gap-2 justify-center hover:cursor-pointer transition-colors duration-300
                    ${path==link.path&&'bg-[#68658d] text-white'}
                  `}>
                      <link.image className={`
                        w-6 h-6
                        ${path === link.path ? 'text-white' : 'text-[#4d4d4d]'}
                        group-hover:text-white
                      `}/>
                      <h1 className={`text-[#95969B] ${path==link.path&&' text-white '} group-hover:text-white`}>{link.name}</h1>
                  </button>
                </Link>
                ))}
            </div>
        </div>

    </div>
  )
}

export default SideNav