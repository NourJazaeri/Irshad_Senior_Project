import React from 'react';
import { FiDatabase, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/owner-components.css';

export default function KPIs({ companyCount, pendingCount }) {
  const navigate = useNavigate();

  const handleCompaniesClick = () => {
    navigate('/owner/companies');
  };

  const handleRegistrationsClick = () => {
    navigate('/owner/registrations');
  };

  return (
    <section className="kpis">
      <div className="kpi" onClick={handleCompaniesClick} style={{ cursor: 'pointer' }}>
        <div className="kpi-label">Total Companies</div>
        <div className="kpi-value">{companyCount}</div>
        <div className="kpi-icon"><FiDatabase /></div>
      </div>
      <div className="kpi" onClick={handleRegistrationsClick} style={{ cursor: 'pointer' }}>
        <div className="kpi-label">Pending Requests</div>
        <div className="kpi-value">{pendingCount}</div>
        <div className="kpi-icon"><FiCalendar /></div>
      </div>
    </section>
  );
}
