import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SupervisorSidebar from "../components/SupervisorSidebar.jsx";
import SupervisorTopbar from "../components/SupervisorTopbar.jsx";
import "../styles/admin-components.css";

export default function SupervisorLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-shell">
      <SupervisorSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="admin-main">
        <SupervisorTopbar />

        <div className="admin-content">
          {/* page content from child routes */}
          <Outlet />
        </div>

        <footer className="admin-footer">
          © {new Date().getFullYear()} Supervisor Management Platform. All rights reserved.
          <div className="admin-footer__icons">⚙️ 🔒 🛈</div>
        </footer>
      </main>
    </div>
  );
}