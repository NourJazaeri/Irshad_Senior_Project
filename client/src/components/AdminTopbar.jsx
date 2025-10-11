import React from 'react';
import '../styles/admin-components.css';

export default function AdminTopbar() {
  return (
    <header className="admin-topbar">
      {/* Search bar removed */}
      <div className="admin-topbar__right">
        <button className="admin-link">Settings</button>
        <div className="admin-top-avatar">A</div>
      </div>
    </header>
  );
}
