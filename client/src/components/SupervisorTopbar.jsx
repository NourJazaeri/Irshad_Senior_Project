import React from 'react';
import '../styles/admin-components.css';

export default function SupervisorTopbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__title">
        <h2>Supervisor Panel</h2>
      </div>
      
      <div className="admin-topbar__actions">
        <div className="admin-notification">
          <span>🔔</span>
          <div className="admin-notification__badge">3</div>
        </div>
      </div>
    </header>
  );
}