import React from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <h1 className="page-title">Web_Owner - Homepage</h1>
      <div className="search">
        <FiSearch />
        <input placeholder="Search dashboard..." />
      </div>
      <button className="logout"><FiLogOut /> Logout</button>
    </header>
  );
}
