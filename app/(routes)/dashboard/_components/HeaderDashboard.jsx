import { UserButton } from '@clerk/nextjs'
import React from 'react'

function HeaderDashboard() {
  return (
    <div className='h-20 justify-between flex items-center mx-5'>
        <h1 className='text-4xl font-semibold'></h1>
        <UserButton  
          appearance={{
            elements: {
              userButtonAvatarBox: {
                width: '40px',
                height: '40px',
              },
            },
          }}
        />
    </div>
  )
}

export default HeaderDashboard