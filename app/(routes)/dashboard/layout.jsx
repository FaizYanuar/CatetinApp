import React from 'react'
import SideNav from './_components/SideNav'
import HeaderDashboard from './_components/HeaderDashboard'

function DashboardLayout({children}) {
  return (
    <div>
        <div className='fixed hidden md:block md:w-64 '>
        <SideNav/>
        </div>
        <div className='md:ml-64'>
            <HeaderDashboard/>
        {children}
        </div>
        </div>
  )
}

export default DashboardLayout