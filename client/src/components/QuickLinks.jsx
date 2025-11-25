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

  const handleViewActivityLog = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating to Activity Report page...');
    navigate('/owner/activity-log');
  };

  return (
    <section className="quick-links">
      <div className="card enhanced-card fade-in-up delay-0">
        <div className="card-icon"><FiDatabase /></div>
        <div className="card-title">Active Companies</div>
        <p className="card-text">Manage all registered companies and their details.</p>
        <button className="btn btn-enhanced-primary" onClick={handleViewCompanies} data-testid="active-companies-btn">View Details</button>
      </div>
      <div className="card enhanced-card fade-in-up delay-1">
        <div className="card-icon"><FiUserCheck /></div>
        <div className="card-title">Pending Registrations</div>
        <p className="card-text">Review and approve new user and company registrations.</p>
        <button className="btn btn-enhanced-primary" onClick={handleViewRegistrations} data-testid="pending-registrations-btn">View Details</button>
      </div>
      <div className="card enhanced-card fade-in-up delay-2">
        <div className="card-icon"><FiTrendingUp /></div>
        <div className="card-title">Reports & Activity Report</div>
        <p className="card-text">View detailed activity reports and company registration history.</p>
        <button className="btn btn-enhanced-primary" onClick={handleViewActivityLog} data-testid="activity-log-btn">View Details</button>
      </div>
    </section>
  );
}
