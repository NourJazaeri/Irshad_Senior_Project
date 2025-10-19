import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UnifiedSidebar } from "../components/UnifiedSidebar.jsx";
import { UnifiedTopbar } from "../components/UnifiedTopbar.jsx";
import "../styles/admin-components.css";

export default function SupervisorLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-shell h-screen">
      <UnifiedSidebar userType="supervisor" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="admin-main">
        <UnifiedTopbar 
          userType="supervisor"
        />

        <div className="admin-content">
          {/* page content from child routes */}
          <Outlet />
        </div>

        <footer className="admin-footer">
          © {new Date().getFullYear()} Company Management Platform. All rights reserved.
          <div className="admin-footer__icons">⚙️ 🔒 🛈</div>
        </footer>
      </main>
    </div>
  );
}
