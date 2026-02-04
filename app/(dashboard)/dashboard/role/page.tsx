"use client"
import React from 'react'


const page = () => {
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Try to get userRole from cookies (client-side)
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )userRole=([^;]*)/);
      if (match) {
        setRole(decodeURIComponent(match[1]));
      }
    }
  }, []);

  return (
    <div className='font-bold text-xl'>
     Welcome {role ? `Role: ${role}` : 'Role Page Dev Branch'}
    </div>
  );
}

export default page
