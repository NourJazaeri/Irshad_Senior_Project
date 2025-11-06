import React from 'react';
import '../styles/owner-components.css';

export default function Topbar() {
  return (
    <header className="wo-topbar">
      <div className="wo-search">
        <input type="text" placeholder="Search..." />
      </div>
      <div className="wo-topbar__right">
        <button className="wo-link">Settings</button>
        <div className="wo-top-avatar">WO</div>
      </div>
    </header>
  );
}
