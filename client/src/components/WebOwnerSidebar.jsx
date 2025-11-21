import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../services/api';
import '../styles/owner-components.css';

export default function Sidebar({ collapsed, setCollapsed }) {
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
      
      // Clear chatbot conversation from sessionStorage
      sessionStorage.removeItem("chatbot_conversation");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
      sessionStorage.removeItem("chatbot_conversation");
      navigate("/login");
    }
  };

  return (
    <aside className={`wo-sidebar ${collapsed ? 'wo-sidebar--collapsed' : ''}`}>
      <div className="wo-sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
        <div className="wo-hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="wo-brand">
        <div className="wo-logo">WO</div>
      </div>
      <nav className="wo-nav">
        <Link 
          to="/owner/dashboard" 
          className={`wo-nav__item ${isActive('dashboard') ? 'active' : ''}`}
        >
          <span className="wo-ico">🏠</span> <span className="wo-nav__text">Dashboard</span>
        </Link>
        <Link 
          to="/owner/companies" 
          className={`wo-nav__item ${isActive('companies') ? 'active' : ''}`}
        >
          <span className="wo-ico">🏢</span> <span className="wo-nav__text">Companies</span>
        </Link>
        <Link 
          to="/owner/registrations" 
          className={`wo-nav__item ${isActive('registrations') ? 'active' : ''}`}
        >
          <span className="wo-ico">📋</span> <span className="wo-nav__text">Registrations</span>
        </Link>
        <Link 
          to="/owner/reports" 
          className={`wo-nav__item ${isActive('reports') ? 'active' : ''}`}
        >
          <span className="wo-ico">📊</span> <span className="wo-nav__text">Reports & Activity</span>
        </Link>
      </nav>
      <div className="wo-sidebar__logout">
        <button className="wo-logout-btn" onClick={handleLogout}>
          <FiLogOut /> <span className="wo-nav__text">Logout</span>
        </button>
      </div>
      <div className="wo-sidebar__user">
        <div className="wo-avatar">WO</div>
        <div className="wo-user__info">
          <div className="wo-user__name">Web Owner</div>
          <div className="wo-user__mail">owner@platform.com</div>
        </div>
      </div>
    </aside>
  );
}
