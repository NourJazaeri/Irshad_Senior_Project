import React from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/owner-components.css';

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
    <header className="wo-topbar">
      <div className="wo-search">
        <input 
          type="text" 
          placeholder="Search..." 
          onKeyPress={handleSearch}
        />
      </div>
      <div className="wo-topbar__right">
        <button className="wo-link" onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
        <div className="wo-top-avatar">WO</div>
      </div>
    </header>
  );
}
