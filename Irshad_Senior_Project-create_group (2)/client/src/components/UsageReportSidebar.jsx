import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiClipboard, FiSettings, FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../services/api';
import '../styles/owner-components.css';

export default function UsageReportSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (sessionId) {
        // Call backend to update session
        await logoutUser(sessionId);
      }

      // Clear JWT and session data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <aside className={`usage-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="brand">
        <div className="brand-mark">wo</div>
      </div>
      <nav className="nav">
        <Link 
          to="/reports" 
          className={`nav-item${isActive('/reports') ? ' active' : ''}`}
        >
          <FiHome /> <span>Dashboard</span>
        </Link>
        <Link 
          to="/activity-log" 
          className={`nav-item${isActive('/activity-log') || isActive('/company-details') ? ' active' : ''}`}
        >
          <FiUsers /> <span>Activity Log</span>
        </Link>
        <Link 
          to="/owner/registrations" 
          className={`nav-item${isActive('/owner/registrations') ? ' active' : ''}`}
        >
          <FiClipboard /> <span>Registrations</span>
        </Link>
        <Link 
          to="/owner/companies" 
          className={`nav-item${isActive('/owner/companies') ? ' active' : ''}`}
        >
          <FiSettings /> <span>Companies</span>
        </Link>
      </nav>
      <div className="sidebar-logout">
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
