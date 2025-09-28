import React from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import '../styles/owner-components.css';

export default function UsageReportTopbar({ searchTerm = '', setSearchTerm = () => {} }) {
  return (
    <header className="usage-topbar">
      <div className="topbar-content">
        <h1 className="page-title">Website Owner</h1>
        <p className="page-subtitle">Company Usage / History</p>
      </div>
      
      <div className="topbar-separator"></div>
      
      <div className="search">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, status, or reviewed by..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
     {/* Replace button with your reusable Logout component */}
      <Logout className="logout" />
      
    </header>
  );
}
