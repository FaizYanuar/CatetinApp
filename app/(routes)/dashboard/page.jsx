"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import dashboardCard from './_components/dashboardCard';

function Dashboard() {
  const {user}=useUser();
  return (
    <div className='bg-[#DEDFEC] h-screen'>
        <div className='p-5'>
            <h1 className='font-semibold'>| <span className='text-blue-800'>Dashboard</span></h1>
            <h1 className='mt-5 text-xl font-semibold'>Hello, {user?.fullName}! <span className='text-2xl'>👋</span></h1>
        </div>

        <dashboardCard/>
    </div>
  )
}

export default Dashboard