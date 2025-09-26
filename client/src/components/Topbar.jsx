import React from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';

export default function Topbar() {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Logout button clicked - Topbar is working!');
    alert('Logout button clicked - Topbar is working!');
    
    // Clear any stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Navigate back to login page
    navigate('/');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const searchTerm = e.target.value;
      console.log('Searching for:', searchTerm);
      // Add search functionality here
    }
  };

  return (
    <header className="topbar">
      <h1 className="page-title">Web_Owner - Homepage</h1>
      <div className="search">
        <FiSearch />
        <input 
          placeholder="Search dashboard..." 
          onKeyPress={handleSearch}
        />
      </div>
      <button className="logout" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>
    </header>
  );
}
