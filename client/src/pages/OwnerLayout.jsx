import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/WebOwnerSidebar.jsx";
import Topbar from "../components/WebOwnerTopbar.jsx";
import WelcomeSection from "../components/WebOwnerWelcomeSection.jsx";
import "../styles/owner-components.css";

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show the welcome section on the layout's index route (tweak paths as needed)
  const showWelcome =
    pathname === "/owner" || pathname === "/webowner" || pathname === "/owner/";

  return (
    <div className="wo-shell">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="wo-main">
        <Topbar />

        <div className="wo-content">
          {showWelcome && <WelcomeSection />}

          {/* page content from child routes */}
          <Outlet />
        </div>

      </main>
    </div>
  );
}
