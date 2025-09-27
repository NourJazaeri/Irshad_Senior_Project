import React from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Topbar({ searchTerm = '', setSearchTerm = () => {} }) {
  return (
    <header className="topbar">
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
      
      <button className="logout"><FiLogOut /> Logout</button>
    </header>
  );
}