import { FiHome, FiUsers, FiClipboard, FiSettings, FiChevronLeft } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-mark">
            <span>I</span>
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <h2>Irshad</h2>
              <p>Registration System</p>
            </div>
          )}
        </div>
        
        <button className="sidebar-collapse-btn" onClick={onToggle}>
          <FiChevronLeft className={isCollapsed ? 'rotate-180' : ''} />
        </button>
      </div>

      <nav className="nav">
        <NavLink 
          to="/owner/registrations" 
          className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
          title={isCollapsed ? "Dashboard" : ""}
        >
          <FiHome />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>
        
        <a className="nav-item" title={isCollapsed ? "Companies" : ""}>
          <FiUsers />
          {!isCollapsed && <span>Companies</span>}
        </a>
        
        <NavLink 
          to="/owner/registrations" 
          className="nav-item"
          title={isCollapsed ? "Registrations" : ""}
        >
          <FiClipboard />
          {!isCollapsed && <span>Registrations</span>}
        </NavLink>
        
        <a className="nav-item" title={isCollapsed ? "Settings" : ""}>
          <FiSettings />
          {!isCollapsed && <span>Settings</span>}
        </a>
      </nav>

      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">WO</div>
            <div className="user-info">
              <p className="user-name">Web Owner</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
