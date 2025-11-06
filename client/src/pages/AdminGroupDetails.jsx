// client/src/pages/AdminGroupDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetGroupDetails,
  adminRemoveSupervisor,
  adminRemoveTrainee
} from '../services/api';
import { User, Trash2, Loader2, Edit, Users, Shield } from 'lucide-react';
import '../styles/admingroupdetail.css';
import Toast from '../components/Toast';

export default function AdminGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState({ groupName: 'Loading Group', departmentName: 'Loading Department', membersCount: 0 });
  const [supervisor, setSupervisor] = useState(null);
  const [members, setMembers] = useState([]);
  const [removing, setRemoving] = useState({ sup: false, t: '' });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', targetName: '', targetId: '' });

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

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const showConfirmModal = (type, targetName, targetId) => {
    setConfirmModal({ show: true, type, targetName, targetId });
  };

  const hideConfirmModal = () => {
    setConfirmModal({ show: false, type: '', targetName: '', targetId: '' });
  };

  const onRemoveSupervisor = () => {
    showConfirmModal('supervisor', supervisor?.name || 'Supervisor', null);
  };

  const onRemoveTrainee = (traineeId, traineeName) => {
    showConfirmModal('trainee', traineeName || 'Trainee', traineeId);
  };

  const handleConfirmRemove = async () => {
    if (confirmModal.type === 'supervisor') {
      const supervisorName = supervisor?.name || 'Supervisor';
      setRemoving(prev => ({ ...prev, sup: true }));
      hideConfirmModal();
      
      try {
        await adminRemoveSupervisor(id);
        setSupervisor(null);
        await load();
        showToast(`${supervisorName} removed successfully`, 'success');
      } catch (err) {
        console.error('Failed to remove supervisor:', err);
        showToast('Failed to remove supervisor. Please try again.', 'error');
      } finally {
        setRemoving(prev => ({ ...prev, sup: false }));
      }
    } else if (confirmModal.type === 'trainee') {
      const traineeName = confirmModal.targetName;
      const traineeId = confirmModal.targetId;
      
      setRemoving(prev => ({ ...prev, t: traineeId }));
      hideConfirmModal();
      
      try {
        await adminRemoveTrainee(id, traineeId);
        setMembers(prev => prev.filter(m => m.traineeId !== traineeId));
        await load();
        showToast(`${traineeName} removed successfully`, 'success');
      } catch (err) {
        console.error('Failed to remove trainee:', err);
        showToast('Failed to remove trainee. Please try again.', 'error');
      } finally {
        setRemoving(prev => ({ ...prev, t: '' }));
      }
    }
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
        
        {/* Breadcrumb Navigation */}
        <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => navigate('/admin')}>Departments</span>
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
          <span style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => navigate(`/admin/departments/${group.departmentName}/details`)}>
            {group.departmentName}
          </span>
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
          <span style={{ color: '#111827', fontWeight: '700' }}>{group.groupName}</span>
        </div>
        
        {/* Overview Cards */}
        <div className="sv-grid sv-grid-3 sv-spacing-top">
          
          {/* CARD 1: Group Info */}
          <div className="sv-card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#0b2b5a" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                Group Name
              </div>
            </div>

            {group ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', minHeight: '26px', display: 'flex', alignItems: 'center' }}>{group.groupName || '—'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', minHeight: '20px', display: 'flex', alignItems: 'center' }}>Department: {group.departmentName || '—'}</div>
                <div style={{ minHeight: '20px' }}></div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>No group information available.</div>
            )}
          </div>

          {/* CARD 2: Supervisor Details */}
          <div className="sv-card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="#d97706" />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Supervisor</div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', minHeight: '26px', display: 'flex', alignItems: 'center' }}>{supervisor.name || '—'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', minHeight: '20px', display: 'flex', alignItems: 'center' }}>Email: {supervisor.email || '—'}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', minHeight: '20px', display: 'flex', alignItems: 'center' }}>ID: {supervisor.empId || '—'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>No supervisor assigned to this group. <a href="#" className="sv-link">Assign one?</a></div>
            )}
          </div>

          {/* CARD 3: Active Trainees KPI */}
          <div className="sv-card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#047857" />
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                Active Trainees
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#047857', minHeight: '60px', display: 'flex', alignItems: 'flex-start' }}>
                {members.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280', minHeight: '20px', display: 'flex', alignItems: 'center' }}>
                Currently assigned to this group.
              </div>
              <div style={{ minHeight: '20px' }}></div>
            </div>
          </div>
        </div>

        {/* 2. Trainees Table (Group Members) */}
        <div style={{ marginTop: '40px' }}>
          <div className="sv-table-card">
          <div className="sv-table-header">
              <p className="sv-table-caption" style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>Group Trainees</p>
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
                      <td className="sv-col-actions">
                        <button
                          onClick={() => onRemoveTrainee(t.traineeId, t.name)}
                          disabled={removing.t === t.traineeId}
                          className={`sv-button-remove-inline ${removing.t === t.traineeId ? 'sv-disabled' : ''}`}
                          style={{ color: '#dc2626' }}
                        >
                          {removing.t === t.traineeId ? <Loader2 className="sv-icon-spin" size={14} color="#dc2626" /> : <Trash2 size={14} color="#dc2626" />}
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
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
      
      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={hideConfirmModal}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '16px',
            width: '600px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e5e7eb',
            animation: 'fadeIn 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg width="24" height="24" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Confirm Removal
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: '1.5',
                margin: 0
              }}>
                Are you sure you want to remove <strong>{confirmModal.targetName}</strong>? This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={hideConfirmModal}
                style={{
                  background: '#f3f4f6',
                  color: '#111827',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }}
                onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#b91c1c'; }}
                onMouseLeave={(e) => { e.target.style.background = '#dc2626'; }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}