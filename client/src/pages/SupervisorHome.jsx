import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function SupervisorHome() {
  // User name from localStorage
  const [userName, setUserName] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.firstName) {
          return userData.firstName;
        } else if (userData.email) {
          const namePart = userData.email.split('@')[0];
          return namePart.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    return 'Supervisor';
  });

  const [companyName, setCompanyName] = useState(() => {
    // Try to get cached company name from sessionStorage
    try {
      const cached = sessionStorage.getItem('companyName');
      if (cached) return cached;
    } catch (e) {
      console.error('Error reading companyName from sessionStorage:', e);
    }
    return 'Company';
  });

  useEffect(() => {
    // Fetch company name
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/supervisor/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (res.data?.supervisor?.company?.name) {
          const name = res.data.supervisor.company.name;
          setCompanyName(name);
          // Cache it for next time
          sessionStorage.setItem('companyName', name);
        }
      } catch (err) {
        console.error('Error fetching company name:', err);
      }
    };
    fetchCompanyName();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>Supervisor Dashboard</h1>
        <p style={{ fontSize: '18px', lineHeight: '28px', color: '#4b5563', marginBottom: '0' }}>
          Welcome, {userName}!
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
          Company: {companyName}
        </p>
      </div>
    </div>
  );
}
