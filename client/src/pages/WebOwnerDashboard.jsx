
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
    // Fetch companies count
    fetch('/api/companies/count')
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json()
      })
      .then(d => {
        console.log('Companies count response:', d);
        setCompanyCount(d.count?.toLocaleString?.() ?? String(d.count))
      })
      .catch(err => {
        console.error('Companies count error:', err);
        setCompanyCount('Error')
      })

    // Fetch pending registration requests count
    fetch('/api/registration-requests/count')
      .then(r => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json()
      })
      .then(d => {
        console.log('Registration requests count response:', d);
        setPendingCount(d.count?.toLocaleString?.() ?? String(d.count))
      })
      .catch(err => {
        console.error('Registration requests count error:', err);
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



