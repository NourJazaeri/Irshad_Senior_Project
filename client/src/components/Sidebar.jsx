import React, { useState } from 'react';
import { FiHome, FiUsers, FiClipboard, FiSettings, FiLogOut } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser } from '../services/api';
import '../styles/owner-components.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Get admin email from localStorage (assuming user info is stored as JSON)
  // Get the login email from localStorage (direct or from user object)
  // Get login email from window global if set by login page
  let adminEmail = '';
  console.log('DEBUG Sidebar: window.__loginEmail =', typeof window !== 'undefined' ? window.__loginEmail : 'window undefined');
  if (typeof window !== 'undefined' && window.__loginEmail) {
    adminEmail = window.__loginEmail;
    console.log('DEBUG Sidebar: Using window.__loginEmail =', adminEmail);
  } else {
    console.log('DEBUG Sidebar: No window.__loginEmail found, using fallback');
    adminEmail = 'admin@company.com';
  }

  // Map route to sidebar item key (exact match, only one active)
  let activeItem = '';
  if (pathname.startsWith('/profile')) activeItem = 'profile';
  else if (pathname.startsWith('/companies')) activeItem = 'companies';
  else if (pathname.startsWith('/user-management')) activeItem = 'user-management';
  else if (pathname.startsWith('/registrations')) activeItem = 'registrations';
  else if (pathname.startsWith('/reports')) activeItem = 'reports';

  const handleItemClick = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to the correct route
    switch (item) {
      case 'profile':
        navigate('/profile');
        break;
      case 'companies':
        navigate('/companies');
        break;
      case 'user-management':
        navigate('/user-management');
        break;
      case 'registrations':
        navigate('/registrations');
        break;
      case 'reports':
        navigate('/reports');
        break;
      default:
        break;
    }
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
    <aside className="wo-sidebar">
      <div className="wo-brand">
        <div className="wo-logo">WO</div>
      </div>
      <nav className="wo-nav">
        <button
          className={`wo-nav__item ${activeItem === 'profile' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('profile', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">🏠</span> <span>Company Profile</span>
        </button>
        <button
          className={`wo-nav__item ${activeItem === 'companies' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('companies', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">🏢</span> <span>Manage Companies</span>
        </button>
        <button
          className={`wo-nav__item ${activeItem === 'user-management' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('user-management', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">👥</span> <span>User Management</span>
        </button>
        <button
          className={`wo-nav__item ${activeItem === 'registrations' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('registrations', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">📋</span> <span>Registrations</span>
        </button>
        <button
          className={`wo-nav__item ${activeItem === 'reports' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('reports', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">📊</span> <span>Reports</span>
        </button>
      </nav>
      <div className="wo-sidebar__user">
        <div className="wo-avatar">A</div>
        <div>
          <div className="wo-user__name">Admin</div>
          <div className="wo-user__mail">{adminEmail || 'admin@company.com'}</div>
          {/* TEMP: Show raw user object for debugging */}
          <div style={{ fontSize: '0.7rem', color: '#ccc', wordBreak: 'break-all', marginTop: 8 }}>
            {(() => {
              try {
                return localStorage.getItem('user');
              } catch (e) { return ''; }
            })()}
          </div>
        </div>
      </div>
      <div className="wo-sidebar__logout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <button className="wo-logout-btn" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
}
