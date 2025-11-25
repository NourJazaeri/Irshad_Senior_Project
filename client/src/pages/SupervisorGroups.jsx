import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupervisorOverview, getSupervisorGroups } from '../services/api';
import { FiUserCheck, FiUsers } from 'react-icons/fi';
import '../styles/supervisor.css';

export default function SupervisorGroups() {
  const [name, setName] = useState('Supervisor');
  const [stats, setStats] = useState({ totalTrainees: 0, activeGroups: 0 });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch supervisor overview and groups
    (async () => {
      try {
        const [ov, gr] = await Promise.all([
          getSupervisorOverview(),
          getSupervisorGroups(),
        ]);
        setName(ov?.fullName || 'Supervisor');
        setStats({
          totalTrainees: ov?.totalTrainees || 0,
          activeGroups: ov?.activeGroups || 0,
        });
        setGroups(gr?.items || []);
      } catch (err) {
        console.error('Supervisor groups load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* KPI cards */}
          <div className="sv-grid sv-grid-2" style={{ marginBottom: '24px' }}>
            <div className="sv-card sv-card-pad sv-kpi-card-enhanced" style={{ padding: '16px 20px' }}>
              <div className="sv-kpi-icon-wrapper" style={{ width: '40px', height: '40px', marginBottom: '12px' }}>
                <FiUserCheck className="sv-kpi-icon" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="sv-kpi-title" style={{ fontSize: '18px', marginBottom: '4px' }}>
                Total Trainees
              </div>
              <div className="sv-kpi-number" style={{ fontSize: '24px', marginTop: '4px' }}>{stats.totalTrainees}</div>
              <div className="sv-kpi-caption" style={{ fontSize: '13px', marginTop: '2px' }}>Across all groups</div>
            </div>
            <div className="sv-card sv-card-pad sv-kpi-card-enhanced" style={{ padding: '16px 20px' }}>
              <div className="sv-kpi-icon-wrapper" style={{ width: '40px', height: '40px', marginBottom: '12px' }}>
                <FiUsers className="sv-kpi-icon" style={{ width: '20px', height: '20px' }} />
              </div>
              <div className="sv-kpi-title" style={{ fontSize: '18px', marginBottom: '4px' }}>
                Active Groups
              </div>
              <div className="sv-kpi-number" style={{ fontSize: '24px', marginTop: '4px' }}>{stats.activeGroups}</div>
              <div className="sv-kpi-caption" style={{ fontSize: '13px', marginTop: '2px' }}>Currently managing</div>
            </div>
          </div>

          {/* Groups */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>My Supervised Groups</h2>
            {groups.length > 0 && (
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                fontWeight: '500',
                padding: '6px 12px',
                background: '#f3f4f6',
                borderRadius: '6px'
              }}>
                {groups.length} {groups.length === 1 ? 'Group' : 'Groups'}
              </span>
            )}
          </div>
          {loading ? (
            <div className="sv-card sv-card-muted sv-loading-state" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="sv-spinner"></div>
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '15px' }}>Loading groups...</div>
            </div>
          ) : groups.length === 0 ? (
            <div className="sv-card sv-card-muted sv-empty-state" style={{ padding: '60px', textAlign: 'center' }}>
              <div className="sv-empty-icon">
                <FiUsers size={48} />
              </div>
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '16px', fontWeight: '500' }}>No groups assigned yet.</div>
              <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '14px' }}>Groups will appear here once assigned to you.</div>
            </div>
          ) : (
            <div className="sv-groups-grid">
              {groups.map((g, index) => (
                <Link
                  key={g._id}
                  to={`/supervisor/groups/${g._id}`}
                  className="sv-card sv-card-link sv-group-card sv-group-card-enhanced"
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  <div className="sv-group-card-header">
                    <div className="sv-group-icon-wrapper">
                      <FiUsers className="sv-group-icon" />
                    </div>
                    <div className="sv-group-badge">{g.traineesCount}</div>
                  </div>
                  <div className="sv-group-name">{g.groupName}</div>
                  <div className="sv-group-sub">
                    {g.departmentName ? (
                      <>
                        <span className="sv-group-dept">{g.departmentName}</span>
                        <span className="sv-group-sep">•</span>
                      </>
                    ) : null}
                    <span className="sv-group-members">
                      {g.traineesCount} {g.traineesCount === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>
                  <div className="sv-group-arrow">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 3l10 10-10 10M0 13h17" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
    </div>
  );
}

