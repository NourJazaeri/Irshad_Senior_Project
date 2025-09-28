import React, { useState } from 'react';
import { FiHome, FiUsers, FiClipboard, FiSettings } from 'react-icons/fi';
import '../styles/owner-components.css';

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
    <aside className="wo-sidebar">
      <div className="wo-brand">
        <div className="wo-logo">WO</div>
      </div>
      <nav className="wo-nav">
        <button 
          className={`wo-nav__item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('dashboard', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">🏠</span> <span>Dashboard</span>
        </button>
        <button 
          className={`wo-nav__item ${activeItem === 'companies' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('companies', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">🏢</span> <span>Companies</span>
        </button>
        <button 
          className={`wo-nav__item ${activeItem === 'registrations' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('registrations', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">📋</span> <span>Registrations</span>
        </button>
        <button 
          className={`wo-nav__item ${activeItem === 'settings' ? 'active' : ''}`}
          onClick={(e) => handleItemClick('settings', e)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className="wo-ico">📊</span> <span>Settings</span>
        </button>
      </nav>
      <div className="wo-sidebar__user">
        <div className="wo-avatar">WO</div>
        <div>
          <div className="wo-user__name">Web Owner</div>
          <div className="wo-user__mail">owner@platform.com</div>
        </div>
      </div>
    </aside>
  );
}
