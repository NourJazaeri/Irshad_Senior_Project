import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';

const SupervisorLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  
  // Reset sidebar to collapsed on mount and whenever path changes
  useEffect(() => {
    setCollapsed(true);
  }, [location.pathname]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Use setTimeout to ensure this runs after React state updates
      setTimeout(() => setCollapsed(true), 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <UnifiedSidebar 
        key={location.pathname}
        userType="supervisor" 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <UnifiedTopbar userType="supervisor" companyName="Irshad Company" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SupervisorLayout;

