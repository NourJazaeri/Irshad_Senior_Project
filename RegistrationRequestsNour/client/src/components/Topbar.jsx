// client/src/components/Topbar.jsx
import React from 'react';
import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Topbar({ title = "Registration Requests", showTitle = true, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <FiMenu />
        </button>
        {showTitle && title && (
          <h1 className="page-title">{title}</h1>
        )}
      </div>

      <div className="topbar-right">
        <button className="topbar-btn">
          <FiBell />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-menu">
          <button className="user-btn">
            <FiUser />
            <span>Web Owner</span>
          </button>
        </div>

        <button className="logout-btn">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
