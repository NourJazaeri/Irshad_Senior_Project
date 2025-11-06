import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UnifiedSidebar } from "../components/UnifiedSidebar.jsx";
import { UnifiedTopbar } from "../components/UnifiedTopbar.jsx";
import WelcomeSection from "../components/WebOwnerWelcomeSection.jsx";
import "../styles/owner-components.css";

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show the welcome section on the layout's index route (tweak paths as needed)
  const showWelcome =
    pathname === "/owner" || pathname === "/webowner" || pathname === "/owner/";

  return (
    <div className="wo-shell h-screen">
      <UnifiedSidebar userType="webOwner" collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className="wo-main">
        <UnifiedTopbar 
          userType="webOwner"
        />

        <div className="wo-content">
          {showWelcome && <WelcomeSection />}

          {/* page content from child routes */}
          <Outlet />
        </div>

        <footer className="wo-footer">
          © {new Date().getFullYear()} Platform Owner. All rights reserved.
          <div className="wo-footer__icons">⚙️ 🔒 🛈</div>
        </footer>
      </main>
    </div>
  );
}
