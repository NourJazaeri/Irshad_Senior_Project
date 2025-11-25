import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';
import '../styles/admin-components.css';

const SupervisorLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  
  // Removed auto-collapse on navigation - sidebar only collapses when user clicks the toggle button

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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
        <footer className="admin-footer">
          © 2025 Irshad — Your Digital Onboarding and Training Platform
        </footer>
      </div>
    </div>
  );
};

export default SupervisorLayout;

