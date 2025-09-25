import React from 'react';
import '../../styles/dashboard.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <h1 className="page-title">Web_Owner - Homepage</h1>
      <div className="topbar-spacer"></div>
      <button className="logout">
        <span className="logout-icon">🚪</span> Logout
      </button>
    </header>
  );
}
