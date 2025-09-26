import React, { useState } from 'react';
import { FiHome, FiUsers, FiClipboard, FiSettings } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Sidebar({ collapsed, setCollapsed }) {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleItemClick = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveItem(item);
    console.log(`Clicked on ${item} - Sidebar navigation working!`);
    alert(`Clicked on ${item} - Sidebar navigation is working!`);
    // Add functionality here
  };

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Sidebar toggle clicked - Toggle is working!');
        setCollapsed(!collapsed);
      }}>
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
        <button 
          className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('dashboard', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <FiHome /> <span>Dashboard</span>
        </button>
        <button 
          className={`nav-item ${activeItem === 'companies' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('companies', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <FiUsers /> <span>Companies</span>
        </button>
        <button 
          className={`nav-item ${activeItem === 'registrations' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('registrations', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <FiClipboard /> <span>Registrations</span>
        </button>
        <button 
          className={`nav-item ${activeItem === 'settings' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('settings', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <FiSettings /> <span>Settings</span>
        </button>
      </nav>
    </aside>
  );
}
