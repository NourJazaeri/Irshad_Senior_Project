import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';

const TraineeLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // false = expanded by default
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <UnifiedSidebar 
        userType="trainee" 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <UnifiedTopbar 
          userType="trainee" 
          companyName="Irshad Company" 
          onMobileMenuToggle={toggleMobileMenu}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50" style={{ padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TraineeLayout;