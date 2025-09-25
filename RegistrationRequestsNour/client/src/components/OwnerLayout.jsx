// client/src/components/OwnerLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import '../styles/dashboard.css';

export default function OwnerLayout({ title, showTitle = true, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />

      <div className="content-wrap">
        <Topbar 
          title={title} 
          showTitle={showTitle} 
          onToggleSidebar={toggleSidebar}
        />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
}
