import React from 'react';
import { FiDatabase, FiUserCheck, FiTrendingUp } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function QuickLinks() {
  return (
    <section className="quick-links">
      <div className="card">
        <div className="card-icon"><FiDatabase /></div>
        <div className="card-title">Active Companies</div>
        <p className="card-text">Manage all registered companies and their details.</p>
        <button className="btn">View Details</button>
      </div>
      <div className="card">
        <div className="card-icon"><FiUserCheck /></div>
        <div className="card-title">Pending Registrations</div>
        <p className="card-text">Review and approve new user and company registrations.</p>
        <button className="btn">View Details</button>
      </div>
      <div className="card">
        <div className="card-icon"><FiTrendingUp /></div>
        <div className="card-title">Usage History</div>
        <p className="card-text">Access detailed reports on platform history and user engagement.</p>
        <button className="btn">View Details</button>
      </div>
    </section>
  );
}
