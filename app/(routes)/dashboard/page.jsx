"use client"
import { UserButton, useUser } from '@clerk/nextjs'
import React from 'react'
import DashboardCard from './_components/dashboardCard';
import DashboardBarChart from './_components/dashboardBarChart';
import DashboardRecent from './_components/dashboardRecent';

function Dashboard() {
  const {user}=useUser();
  return (
    <div className='bg-[#DEDFEC] h-full pb-5'>
        <div className='p-5'>
            <h1 className='font-semibold text-blue-800'>
              Dashboard <span className='text-black text-xl'>
                
                | Hello, {user?.fullName}! 
                
                <span className='text-2xl'>
                  👋
                  
                  </span></span></h1>
        </div>

        <DashboardCard />
        <DashboardBarChart/>
        <DashboardRecent/>
    </div>
  )
}

export default Dashboard