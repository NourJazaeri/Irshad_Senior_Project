import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';
import '../styles/admin-components.css';

const SupervisorLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
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
        key={location.pathname}
        userType="supervisor" 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <UnifiedTopbar 
          userType="supervisor" 
          companyName="Irshad Company" 
          onMobileMenuToggle={toggleMobileMenu}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50" style={{ padding: '1.5rem' }}>
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

