import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { logoutUser } from '../services/api';
import '../styles/admin-components.css';

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin User');
  const [userEmail, setUserEmail] = useState('admin@company.com');
  const [userRole, setUserRole] = useState('Admin');
  
  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'Admin');
        setUserEmail(user.email || 'admin@company.com');
        
        // Set user name based on role
        if (user.role === 'Admin') {
          setUserName(`${user.firstName || 'Admin'} ${user.lastName || 'User'}`);
        } else if (user.role === 'Supervisor') {
          setUserName(`${user.firstName || 'Supervisor'} ${user.lastName || 'User'}`);
        } else if (user.role === 'Trainee') {
          setUserName(`${user.firstName || 'Trainee'} ${user.lastName || 'User'}`);
        } else {
          setUserName('User');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
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
        <div className="admin-logo">AD</div>
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/admin" 
          className={`admin-nav__item ${isActive('/admin') ? 'active' : ''}`}
        >
          <span className="admin-ico">🏢</span>
          <span className="admin-nav__text">Company Profile</span>
        </Link>
        
        <Link 
          to="/admin/companies" 
          className={`admin-nav__item ${isActive('/admin/companies') ? 'active' : ''}`}
        >
          <span className="admin-ico">📊</span>
          <span className="admin-nav__text">Manage Companies</span>
        </Link>
        
        <Link 
          to="/admin/registrations" 
          className={`admin-nav__item ${isActive('/admin/registrations') ? 'active' : ''}`}
        >
          <span className="admin-ico">📝</span>
          <span className="admin-nav__text">Registrations</span>
        </Link>
        
        <Link 
          to="/admin/content" 
          className={`admin-nav__item ${isActive('/admin/content') ? 'active' : ''}`}
        >
          <span className="admin-ico">📚</span>
          <span className="admin-nav__text">Content Library</span>
        </Link>
        
        <Link 
          to="/admin/reports" 
          className={`admin-nav__item ${isActive('/admin/reports') ? 'active' : ''}`}
        >
          <span className="admin-ico">📈</span>
          <span className="admin-nav__text">Reports</span>
        </Link>
      </nav>
      
      <div className="admin-sidebar__user">
        <div className="admin-avatar">{userName.charAt(0).toUpperCase()}</div>
        <div className="admin-user__info">
          <div className="admin-user__name">{userName}</div>
          <div className="admin-user__mail">{userEmail}</div>
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
