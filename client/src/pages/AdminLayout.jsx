import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import "../styles/admin-components.css";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-shell h-screen">
      <AdminSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="admin-main">
        <AdminTopbar />

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
