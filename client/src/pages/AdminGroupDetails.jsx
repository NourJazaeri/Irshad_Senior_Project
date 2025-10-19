// client/src/pages/AdminGroupDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetGroupDetails,
  adminRemoveSupervisor,
  adminRemoveTrainee
} from '../services/api';
import { Users, Building2, Shield, Mail, User, Trash2, ChevronRight, Loader2, Edit, Briefcase } from 'lucide-react';

// Reusable components for clean JSX
const IconWrapper = ({ children }) => (
    <div className="icon-wrapper">{children}</div> // Placeholder for icon background styling
);

export default function AdminGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState({ groupName: 'Loading Group', departmentName: 'Loading Department', membersCount: 0 });
  const [supervisor, setSupervisor] = useState(null);
  const [members, setMembers] = useState([]);
  const [removing, setRemoving] = useState({ sup: false, t: '' });
  const [error, setError] = useState(null);

  // --- Functions (unchanged for logic) ---
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetGroupDetails(id);
      if (!data?.ok) throw new Error(data?.error || 'Failed to load');
      
      setGroup(data.group || { groupName: 'Group Not Found', departmentName: 'N/A', membersCount: 0 });
      setSupervisor(data.supervisor || null);
      setMembers(data.members || []); 
      
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */}, [id]);

  const onRemoveSupervisor = async () => {
    if (!confirm(`Are you sure you want to remove ${supervisor?.name || 'the supervisor'} from this group?`)) return;
    // ... logic ...
  };

  const onRemoveTrainee = async (traineeId, traineeName) => {
    if (!confirm(`Remove trainee ${traineeName || 'from this group'}?`)) return;
    // ... logic ...
  };

  // --- Loading/Error States ---
  if (loading) {
    return (
      <div className="sv-loading-center">
        <Loader2 className="sv-loader" />
        <span className="sv-loader-text">Loading group details…</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="sv-error-message">
        <p>{error}</p>
        <button onClick={load} className="sv-button-retry">Try reloading</button>
      </div>
    );
  }

  // --- Main Render (CSS Structure) ---
  return (
    <div className="sup-main">
      <div className="sup-content">
        
        {/* Back Link and Title */}
        <div className="sv-backline">
            <Link to="/admin/departments" className="sv-backlink">
                <ChevronRight className="sv-icon-small sv-icon-rotate" />
                Back to Groups
            </Link>
        </div>
        <h1 className="sv-title">Group Details</h1>

        {/* 1. Overview Cards (Uses sv-grid-3) */}
        <div className="sv-grid sv-grid-3 sv-spacing-top">
          
          {/* CARD 1: Group/Department Info - NOW ONLY NAME & DEPARTMENT */}
          <div className="sv-card sv-card-pad sv-flex-col sv-justify-center"> {/* Changed justify-between to justify-center for vertical alignment */}
            <div className="sv-kpi-header">
                <IconWrapper><Users size={28} color="#0b2b5a" /></IconWrapper>
                <div className="sv-group-details">
                    <div className="sv-group-name">{group.groupName}</div>
                    <div className="sv-group-sub sv-flex-row sv-align-center"><Building2 size={16} /> {group.departmentName || '—'}</div>
                </div>
            </div>
            {/* REMOVED: Total Members KPI Footer */}
          </div>

          {/* CARD 2: Supervisor Details (UNCHANGED) */}
          <div className="sv-card sv-card-pad sv-flex-col sv-justify-between">
            <div className="sv-flex-row sv-justify-between sv-border-bottom sv-mb">
              <div className="sv-flex-row sv-align-center">
                <Shield size={22} color="#0b2b5a" />
                <h3 className="sv-section-title-small sv-ml">Supervisor</h3>
              </div>
              <button
                disabled={!supervisor || removing.sup}
                onClick={onRemoveSupervisor}
                className={`sv-button-remove ${!supervisor || removing.sup ? 'sv-disabled' : ''}`}
              >
                {removing.sup ? <Loader2 className="sv-icon-spin" size={16} /> : <Trash2 size={16} />}
                {removing.sup ? 'Removing…' : 'Remove'}
              </button>
            </div>

            {supervisor ? (
              <div className="sv-supervisor-info">
                <p className="sv-user-name sv-large">{supervisor.name || '—'}</p>
                <p className="sv-group-sub sv-flex-row sv-align-center"><Mail size={16} /> {supervisor.email || '—'}</p>
                <p className="sv-group-sub sv-flex-row sv-align-center"><Briefcase size={16} /> ID: <span className="sv-emp-id">{supervisor.empId || '—'}</span></p>
              </div>
            ) : (
              <p className="sv-text-muted sv-mt">No supervisor assigned to this group. <a href="#" className="sv-link">Assign one?</a></p>
            )}
          </div>

          {/* CARD 3: Active Trainees KPI (UNCHANGED) */}
          <div className="sv-card sv-card-pad sv-flex-col sv-justify-between">
            <div className="sv-kpi-header">
                <IconWrapper><Users size={28} color="#047857" /></IconWrapper>
                <h3 className="sv-kpi-title">Active Trainees</h3>
            </div>
            <p className="sv-kpi-number sv-green">{members.length}</p>
            <p className="sv-kpi-caption">Currently assigned to this group.</p>
          </div>
        </div>

        {/* 2. Trainees Table (Group Members) */}
        <div className="sv-section-title">Group Members ({members.length})</div>
        
        <div className="sv-table-card">
          <div className="sv-table-header">
              <p className="sv-table-caption">Manage trainees and view their contact details.</p>
              <button className="sv-button-primary sv-button-icon">
                  <Edit size={16} /> Assign Trainee
              </button>
          </div>

          {members.length === 0 ? (
            <div className="sv-table-empty">
                — No trainees are currently assigned to this group. —
            </div>
          ) : (
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th className="sv-col-name">Name</th>
                    <th className="sv-col-email">Email</th>
                    <th className="sv-col-id">Employee ID</th>
                    <th className="sv-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((t) => (
                    <tr key={t.traineeId}>
                      <td className="sv-col-name">
                        <div className="sv-user">
                          <div className="sv-avatar"><User className="sv-avatar-icon" /></div>
                          <span className="sv-user-name">{t.name || '—'}</span>
                        </div>
                      </td>
                      <td className="sv-col-email">
                        <a href={`mailto:${t.email}`} className="sv-email sv-link">
                          <span className="sv-ellipsis">{t.email || '—'}</span>
                        </a>
                      </td>
                      <td className="sv-col-id">
                        {t.empId || '—'}
                      </td>
                      <td className="sv-col-actions sv-text-right">
                        <button
                          onClick={() => onRemoveTrainee(t.traineeId, t.name)}
                          disabled={removing.t === t.traineeId}
                          className={`sv-button-remove-inline ${removing.t === t.traineeId ? 'sv-disabled' : ''}`}
                        >
                          {removing.t === t.traineeId ? <Loader2 className="sv-icon-spin" size={14} /> : <Trash2 size={14} />}
                          {removing.t === t.traineeId ? 'Removing…' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}