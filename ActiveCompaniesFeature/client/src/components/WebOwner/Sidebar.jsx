import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/dashboard.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {setCollapsed && (
        <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div className="brand">
        <div className="brand-mark">WO</div>
      </div>
      <nav className="nav">
        <Link 
          to="/owner/dashboard" 
          className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
        >
          <span className="nav-icon">🏠</span> <span>Dashboard</span>
        </Link>
        <Link 
          to="/owner/companies" 
          className={`nav-item ${isActive('companies') ? 'active' : ''}`}
        >
          <span className="nav-icon">🏢</span> <span>Companies</span>
        </Link>
        <Link 
          to="/owner/registrations" 
          className={`nav-item ${isActive('registrations') ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span> <span>Registrations</span>
        </Link>
        <Link 
          to="/owner/reports" 
          className={`nav-item ${isActive('reports') ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span> <span>Reports</span>
        </Link>
      </nav>
    </aside>
  );
}
