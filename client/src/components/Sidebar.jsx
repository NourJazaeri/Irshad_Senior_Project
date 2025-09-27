import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiClipboard, FiSettings } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
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
          to="/" 
          className={`nav-item${isActive('/') ? ' active' : ''}`}
        >
          <FiHome /> <span>Dashboard</span>
        </Link>
        <Link 
          to="/company-usage-history" 
          className={`nav-item${isActive('/company-usage-history') || isActive('/company-details') ? ' active' : ''}`}
        >
          <FiUsers /> <span>Companies</span>
        </Link>
        <a className="nav-item"><FiClipboard /> <span>Registrations</span></a>
        <a className="nav-item"><FiSettings /> <span>Settings</span></a>
      </nav>
    </aside>
  );
}
