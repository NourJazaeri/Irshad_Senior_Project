import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { UnifiedSidebar } from '../components/UnifiedSidebar.jsx';
import { UnifiedTopbar } from '../components/UnifiedTopbar.jsx';
import { Bot } from 'lucide-react';
import '../styles/admin-components.css';

const TraineeLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // false = expanded by default
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isChatbotPage = location.pathname.includes('/trainee/chatbot');

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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 relative" style={{ padding: '1.5rem' }}>
          <Outlet />

          {/* Floating AI Assistant button */}
          {!isChatbotPage && (
            <Link
              to="/trainee/chatbot"
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-110 transition-transform duration-200 border border-white/60"
            >
              <Bot size={24} className="text-white" />
            </Link>
          )}
        </main>
        <footer className="admin-footer">
          © 2025 Irshad — Your Digital Onboarding and Training Platform
        </footer>
      </div>
    </div>
  );
};

export default TraineeLayout;