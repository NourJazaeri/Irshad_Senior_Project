import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { UnifiedSidebar } from "../components/UnifiedSidebar.jsx";
import { UnifiedTopbar } from "../components/UnifiedTopbar.jsx";
import WelcomeSection from "../components/WebOwnerWelcomeSection.jsx";
import "../styles/owner-components.css";
import "../styles/admin-components.css";

export default function OwnerLayout() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Show the welcome section on the layout's index route (tweak paths as needed)
  const showWelcome =
    pathname === "/owner" || pathname === "/webowner" || pathname === "/owner/";

  return (
    <div className="wo-shell h-screen">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <UnifiedSidebar 
        userType="webOwner" 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="wo-main">
        <UnifiedTopbar 
          userType="webOwner"
          onMobileMenuToggle={toggleMobileMenu}
        />

        <div className="wo-content">
          {showWelcome && <WelcomeSection />}

          {/* page content from child routes */}
          <Outlet />
        </div>

        <footer className="wo-footer">
          © 2025 Irshad — Your Digital Onboarding and Training Platform
        </footer>
      </main>
    </div>
  );
}
