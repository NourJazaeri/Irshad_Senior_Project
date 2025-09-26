import React from 'react';
import { FiDatabase, FiCalendar } from 'react-icons/fi';
import '../styles/dashboard.css';

export default function KPIs({ companyCount, pendingCount }) {
  return (
    <section className="kpis">
      <div className="kpi">
        <div className="kpi-label">Total Companies</div>
        <div className="kpi-value">{companyCount}</div>
        <div className="kpi-icon"><FiDatabase /></div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Pending Requests</div>
        <div className="kpi-value">{pendingCount}</div>
        <div className="kpi-icon"><FiCalendar /></div>
      </div>
    </section>
  );
}
