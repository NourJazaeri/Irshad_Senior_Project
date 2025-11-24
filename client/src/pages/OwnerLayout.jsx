import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UnifiedSidebar } from "../components/UnifiedSidebar.jsx";
import { UnifiedTopbar } from "../components/UnifiedTopbar.jsx";
import "../styles/owner-components.css";
import "../styles/admin-components.css";

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="wo-shell h-screen">
      <UnifiedSidebar userType="webOwner" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="wo-main">
        <UnifiedTopbar 
          userType="webOwner"
        />

        <div className="wo-content">
          {/* page content from child routes */}
          <Outlet />
        </div>

        <footer className="admin-footer">
          © 2025 Irshad — Your Digital Onboarding and Training Platform
        </footer>
      </main>
    </div>
  );
}
