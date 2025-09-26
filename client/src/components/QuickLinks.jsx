import React from 'react';
import { FiDatabase, FiUserCheck, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/owner-components.css';

export default function QuickLinks() {
  const navigate = useNavigate();

  const handleViewCompanies = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating to Active Companies page...');
    navigate('/owner/companies');
  };

  const handleViewRegistrations = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating to Pending Registrations page...');
    navigate('/owner/registrations');
  };

  const handleViewHistory = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating to Usage History page...');
    navigate('/owner/reports');
  };

  return (
    <section className="quick-links">
      <div className="card">
        <div className="card-icon"><FiDatabase /></div>
        <div className="card-title">Active Companies</div>
        <p className="card-text">Manage all registered companies and their details.</p>
        <button className="btn" onClick={handleViewCompanies}>View Details</button>
      </div>
      <div className="card">
        <div className="card-icon"><FiUserCheck /></div>
        <div className="card-title">Pending Registrations</div>
        <p className="card-text">Review and approve new user and company registrations.</p>
        <button className="btn" onClick={handleViewRegistrations}>View Details</button>
      </div>
      <div className="card">
        <div className="card-icon"><FiTrendingUp /></div>
        <div className="card-title">Usage History</div>
        <p className="card-text">Access detailed reports on platform history and user engagement.</p>
        <button className="btn" onClick={handleViewHistory}>View Details</button>
      </div>
    </section>
  );
}
