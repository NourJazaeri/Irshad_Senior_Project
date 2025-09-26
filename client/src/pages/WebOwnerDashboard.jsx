
import React, { useEffect, useState } from 'react'

import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import WelcomeSection from '../components/WelcomeSection';
import KPIs from '../components/KPIs';
import QuickLinks from '../components/QuickLinks';
import '../styles/dashboard.css';

export default function WebOwnerDashboard() {
  const [companyCount, setCompanyCount] = useState('—')
  const [pendingCount, setPendingCount] = useState('—')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/companies/count')
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json()
      })
      .then(d => {
        setCompanyCount(d.count?.toLocaleString?.() ?? String(d.count))
      })
      .catch(err => {
        setCompanyCount('Error')
      })

    fetch('/api/registration-requests/count')
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json()
      })
      .then(d => {
        setPendingCount(d.count?.toLocaleString?.() ?? String(d.count))
      })
      .catch(err => {
        setPendingCount('Error')
      })
  }, [])

  return (
    <div className={`dashboard-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="main">
        <Topbar />
        <WelcomeSection />
        <KPIs companyCount={companyCount} pendingCount={pendingCount} />
        <QuickLinks />
      </main>
    </div>
  )
}


export default WebOwnerDashboard;

