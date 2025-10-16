import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../services/api';
import '../styles/admin-components.css';

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      if (sessionId) await logoutUser(sessionId);

      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
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
        <div className="admin-logo">AD</div>
      </div>

      <nav className="admin-nav">
        {/* 🏠 Home Page */}
        <Link
          to="/admin"
          className={`admin-nav__item ${isActive('/admin') ? 'active' : ''}`}
        >
          <span className="admin-ico">🏠</span>
          <span className="admin-nav__text">Home</span>
        </Link>

        {/* 🏢 Company Profile */}
        <Link
          to="/admin/company-profile"
          className={`admin-nav__item ${isActive('/admin/company-profile') ? 'active' : ''}`}
        >
          <span className="admin-ico">🏢</span>
          <span className="admin-nav__text">Company Profile</span>
        </Link>

        {/* 📊 Manage Companies */}
        <Link
          to="/admin/companies"
          className={`admin-nav__item ${isActive('/admin/companies') ? 'active' : ''}`}
        >
          <span className="admin-ico">📊</span>
          <span className="admin-nav__text">Manage Companies</span>
        </Link>

        {/* 📝 Registrations */}
        <Link
          to="/admin/registrations"
          className={`admin-nav__item ${isActive('/admin/registrations') ? 'active' : ''}`}
        >
          <span className="admin-ico">📝</span>
          <span className="admin-nav__text">Registrations</span>
        </Link>

        {/* 📈 Reports */}
        <Link
          to="/admin/reports"
          className={`admin-nav__item ${isActive('/admin/reports') ? 'active' : ''}`}
        >
          <span className="admin-ico">📈</span>
          <span className="admin-nav__text">Reports</span>
        </Link>
      </nav>

      <div className="admin-sidebar__user">
        <div className="admin-avatar">A</div>
        <div className="admin-user__info">
          <div className="admin-user__name">Admin</div>
          <div className="admin-user__mail">admin@company.com</div>
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
