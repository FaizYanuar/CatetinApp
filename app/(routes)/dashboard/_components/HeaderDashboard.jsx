// File: app/(routes)/dashboard/_components/HeaderDashboard.jsx
"use client"; 

import { UserButton } from '@clerk/nextjs'; 
import React from 'react';
import { Menu as MenuIcon } from 'lucide-react'; 

export default function HeaderDashboard({ onMenuClick }) { 
  return (
    <div className='h-20 flex justify-between items-center px-4 sm:px-6 border-b bg-white shadow-sm sticky top-0 z-30'>
      <button
        onClick={onMenuClick}
        className='md:hidden text-gray-600 hover:text-gray-800 p-2 -ml-2'
        aria-label="Buka menu"
      >
        <MenuIcon size={28} />
      </button>

      <h2 className='hidden md:block text-xl font-semibold text-gray-700 flex-grow text-center md:text-left'>
      </h2>
      
      <div className="md:ml-0"> 
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: '40px',
                height: '40px',
              },
              userButtonPopoverCard: { 
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