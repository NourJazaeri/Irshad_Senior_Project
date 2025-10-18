import React from 'react';
import '../styles/admin-components.css';

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-search"></div>
      <div className="admin-topbar__right">
        <button className="admin-link">Settings</button>
        
      </div>
    </header>
  );
}
