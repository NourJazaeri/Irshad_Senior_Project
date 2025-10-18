import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../services/api';
import '../styles/admin-components.css';

export default function SupervisorSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActive = (path) => {
    return location.pathname.includes(path);
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
    <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}>
      <div className="admin-sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
        <div className="admin-hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      
      <div className="admin-brand">
        <div className="admin-logo">SU</div>
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/supervisor" 
          className={`admin-nav__item ${location.pathname === '/supervisor' ? 'active' : ''}`}
        >
          <span className="admin-ico">🏠</span>
          <span className="admin-nav__text">Dashboard</span>
        </Link>
        
        <Link 
          to="/supervisor/templates" 
          className={`admin-nav__item ${isActive('/supervisor/templates') ? 'active' : ''}`}
        >
          <span className="admin-ico">📋</span>
          <span className="admin-nav__text">Ready Templates</span>
        </Link>
      </nav>
      
      <div className="admin-sidebar__user">
        <div className="admin-avatar">S</div>
        <div className="admin-user__info">
          <div className="admin-user__name">Supervisor</div>
          <div className="admin-user__mail">supervisor@company.com</div>
        </div>
      </div>
      
      <div className="admin-sidebar__logout">
        <button className="admin-logout-btn" onClick={handleLogout}>
          <FiLogOut className="admin-ico" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}