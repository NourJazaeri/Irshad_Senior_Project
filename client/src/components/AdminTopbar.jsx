import React from 'react';
import '../styles/admin-components.css';

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-search">
        <input type="text" placeholder="Search companies, registrations..." />
      </div>
      <div className="admin-topbar__right">
        <button className="admin-link">Settings</button>
        <div className="admin-top-avatar">A</div>
      </div>
    </header>
  );
}
