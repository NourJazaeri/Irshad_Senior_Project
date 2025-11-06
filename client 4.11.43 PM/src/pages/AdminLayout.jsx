import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UnifiedSidebar } from "../components/UnifiedSidebar.jsx";
import { UnifiedTopbar } from "../components/UnifiedTopbar.jsx";
import "../styles/admin-components.css";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  // Reset sidebar to collapsed on mount and whenever path changes
  useEffect(() => {
    setSidebarCollapsed(true);
  }, [pathname]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Use setTimeout to ensure this runs after React state updates
      setTimeout(() => setSidebarCollapsed(true), 0);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="admin-shell h-screen">
      <UnifiedSidebar key={pathname} userType="admin" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="admin-main">
        <UnifiedTopbar 
          userType="admin"
        />

        <div className="admin-content" style={{ 
          background: 'transparent',
          minHeight: 'calc(100vh - 200px)',
          padding: '0'
        }}>
          <div style={{
            maxWidth: '1800px',
            margin: '0 auto',
            width: '100%',
            padding: '40px 20px'
          }}>
            {/* page content from child routes */}
            <Outlet />
          </div>
        </div>

        <footer className="admin-footer">
          © {new Date().getFullYear()} Company Management Platform. All rights reserved.
          <div className="admin-footer__icons">⚙️ 🔒 🛈</div>
        </footer>
      </main>
    </div>
  );
}
