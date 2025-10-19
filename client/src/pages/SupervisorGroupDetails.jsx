import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { getSupervisorGroupDetails } from '../services/api';
import { FiMail, FiArrowLeft, FiUser } from 'react-icons/fi';
import '../styles/supervisor.css';

export default function SupervisorGroupDetails() {
  const { id } = useParams();
  const [meta, setMeta] = useState({ groupName: '', departmentName: '', membersCount: 0 });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSupervisorGroupDetails(id);
        setMeta(data.group);
        setMembers(data.members || []);
      } catch (e) {
        console.error('Load group details failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="sup-shell">
      {/* LEFT SIDEBAR */}
      <aside className="sup-sidebar">
        <Sidebar />
      </aside>

      {/* MAIN */}
      <main className="sup-main">
        <Topbar />

        <div className="sup-content">
          {/* Back link */}
          <div className="sv-backline">
            <Link to="/supervisor" className="sv-backlink">
              <FiArrowLeft /> Back
            </Link>
          </div>

          {/* Title */}
          <h1 className="sv-title">
            {meta.groupName || 'Group'}{' '}
            <span className="sv-title-sub">({meta.departmentName || '—'})</span>
          </h1>

          {/* Overview KPI */}
          <div className="sv-grid sv-grid-2" style={{ gap: 22, marginTop: 14 }}>
            <div className="sv-card sv-card-pad">
              <div className="sv-kpi-title">Group Overview</div>
              <div className="sv-kpi-caption">Members</div>
              <div className="sv-kpi-number">{meta.membersCount}</div>
            </div>
          </div>

          {/* Members Table */}
          <div className="sv-table-card" style={{ marginTop: 22 }}>
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th className="sv-col-name">Name</th>
                    <th className="sv-col-email">Email</th>
                    <th className="sv-col-id">Employee ID</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 18, color: '#6b7280' }}>
                        Loading…
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 18, color: '#6b7280' }}>
                        No trainees in this group.
                      </td>
                    </tr>
                  ) : (
                    members.map((m, idx) => (
                      <tr key={m.traineeId || idx} className="hoverable">
                        {/* NAME */}
                        <td className="sv-col-name">
                          <div className="sv-user">
                            <span className="sv-avatar">
                              <FiUser className="sv-avatar-icon" />
                            </span>
                            <span className="sv-user-name">{m.name || '—'}</span>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="sv-col-email">
                          <div className="sv-email">
                            <FiMail className="sv-email-ic" />
                            {m.email ? (
                              <a
                                className="sv-link sv-ellipsis"
                                href={`mailto:${m.email}`}
                                title={m.email}
                              >
                                {m.email}
                              </a>
                            ) : (
                              <span className="sv-ellipsis">—</span>
                            )}
                          </div>
                        </td>

                        {/* EMPLOYEE ID */}
                        <td className="sv-col-id">{m.empId || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
