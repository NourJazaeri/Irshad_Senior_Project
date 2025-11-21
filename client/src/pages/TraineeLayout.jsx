import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';

const TraineeLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // false = expanded by default

  // Removed auto-collapse on navigation - sidebar only collapses when user clicks the toggle button

  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <UnifiedSidebar 
        userType="trainee" 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <UnifiedTopbar userType="trainee" companyName="Irshad Company" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50" style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TraineeLayout;