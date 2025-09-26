import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/owner-components.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.includes(path);
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
          <span className="wo-ico">📊</span> <span className="wo-nav__text">Reports</span>
        </Link>
      </nav>
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
