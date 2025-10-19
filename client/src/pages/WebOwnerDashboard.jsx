// client/src/pages/WebOwnerDashboard.jsx
import React, { useEffect, useState } from 'react';

import WelcomeSection from '../components/WebOwnerWelcomeSection';
import KPIs from '../components/KPIs';
import QuickLinks from '../components/QuickLinks';
import '../styles/owner-components.css';
import api from '../services/api'; // centralized API helper

export default function WebOwnerDashboard() {
  const [companyCount, setCompanyCount] = useState('—');
  const [pendingCount, setPendingCount] = useState('—');
  const [error, setError] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      setLoadingCounts(true);
      setError(null);

      // quick auth check
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated — please log in.');
        setCompanyCount('Error');
        setPendingCount('Error');
        setLoadingCounts(false);
        return;
      }

      try {
        // Companies count
        const cResp = await fetch(`${api.API_BASE}/api/companies/count`, {
          headers: api.getAuthHeaders()
        });
        if (cResp.status === 401 || cResp.status === 403) {
          throw new Error(`Unauthorized (${cResp.status})`);
        }
        if (!cResp.ok) {
          const text = await cResp.text().catch(() => '');
          throw new Error(`Companies count failed: ${cResp.status} ${text}`);
        }
        const cData = await cResp.json();

        // Registration requests count
        const rResp = await fetch(`${api.API_BASE}/api/registration-requests/count`, {
          headers: api.getAuthHeaders()
        });
        if (rResp.status === 401 || rResp.status === 403) {
          throw new Error(`Unauthorized (${rResp.status})`);
        }
        if (!rResp.ok) {
          const text = await rResp.text().catch(() => '');
          throw new Error(`Requests count failed: ${rResp.status} ${text}`);
        }
        const rData = await rResp.json();

        if (!mounted) return;
        const format = (v) => {
          const n = v?.count ?? v;
          if (n === null || n === undefined) return '—';
          if (typeof n === 'number') return n.toLocaleString();
          return String(n);
        };

        setCompanyCount(format(cData));
        setPendingCount(format(rData));
      } catch (err) {
        console.error('Companies count error:', err);
        if (!mounted) return;
        // If unauthorized, show explicit message
        if (String(err.message).includes('Unauthorized') || String(err.message).includes('401') || String(err.message).includes('403')) {
          setError('You are not authorized to view this data. Please log in with the correct role.');
          // optionally clear token and redirect:
          // localStorage.removeItem('token');
          // window.location.href = '/login';
        } else {
          setError(err.message || 'Failed to load dashboard counts');
        }
        setCompanyCount('Error');
        setPendingCount('Error');
      } finally {
        if (mounted) setLoadingCounts(false);
      }
    };

    loadCounts();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <WelcomeSection />
      {/* If you want to show the error message somewhere */}
      {error && (
        <div style={{ padding: '12px 24px', color: '#b00020', background: '#fff6f6', borderRadius: 6, margin: '8px 24px' }}>
          {error}
        </div>
      )}
      <KPIs companyCount={companyCount} pendingCount={pendingCount} loading={loadingCounts} />
      <QuickLinks />
    </div>
  );
}
