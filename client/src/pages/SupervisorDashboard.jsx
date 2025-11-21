import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSupervisorOverview, getSupervisorGroups } from '../services/api';
import { FiUserCheck, FiUsers } from 'react-icons/fi';
import '../styles/supervisor.css';

export default function SupervisorDashboard() {
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
        console.error('Supervisor dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
          {/* KPI cards */}
          <div className="sv-grid sv-grid-2" style={{ marginBottom: '24px' }}>
            <div className="sv-card sv-card-pad">
              <div className="sv-kpi-title">
                <FiUserCheck /> Total Trainees
              </div>
              <div className="sv-kpi-number">{stats.totalTrainees}</div>
              <div className="sv-kpi-caption">Across all groups</div>
            </div>
            <div className="sv-card sv-card-pad">
              <div className="sv-kpi-title">
                <FiUsers /> Active Groups
              </div>
              <div className="sv-kpi-number">{stats.activeGroups}</div>
              <div className="sv-kpi-caption">Currently managing</div>
            </div>
          </div>

          {/* Groups */}
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' }}>My Supervised Groups</h2>
          {loading ? (
            <div className="sv-card sv-card-muted" style={{ padding: '40px', textAlign: 'center' }}>
              Loading…
            </div>
          ) : groups.length === 0 ? (
            <div className="sv-card sv-card-muted" style={{ padding: '40px', textAlign: 'center' }}>
              No groups assigned yet.
            </div>
          ) : (
            <div className="sv-groups-grid">
              {groups.map((g) => (
                <Link
                  key={g._id}
                  to={`/supervisor/groups/${g._id}`}
                  className="sv-card sv-card-link sv-group-card"
                >
                  <div className="sv-group-name">{g.groupName}</div>
                  <div className="sv-group-sub">
                    {g.departmentName ? `${g.departmentName} • ` : ''}
                    {g.traineesCount} {g.traineesCount === 1 ? 'Member' : 'Members'}
                  </div>
                </Link>
              ))}
            </div>
          )}
    </div>
  );
}