import React from 'react';
import { FiHome, FiUsers, FiClipboard, FiSettings } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">wo</div>
      </div>
      <nav className="nav">
        <a className="nav-item active"><FiHome /> <span>Dashboard</span></a>
        <a className="nav-item"><FiUsers /> <span>Companies</span></a>
        <a className="nav-item"><FiClipboard /> <span>Registrations</span></a>
        <a className="nav-item"><FiSettings /> <span>Settings</span></a>
      </nav>
    </aside>
  );
}
