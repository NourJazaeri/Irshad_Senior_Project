// client/src/pages/AdminGroupDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetGroupDetails,
  adminRemoveSupervisor,
  adminRemoveTrainee,
  getAvailableTraineesForGroup,
  adminAddTraineesToGroup,
  getAvailableSupervisorsForGroup,
  adminAssignSupervisorToGroup
} from '../services/api';
import { User, Trash2, Loader2, Edit, Users, Shield, CheckCircle, Mail, AlertTriangle, CheckCircle2, XCircle, UsersRound } from 'lucide-react';
import '../styles/admingroupdetail.css';
import '../styles/assign-members.css';
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
  const [assignModal, setAssignModal] = useState({ show: false });
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState(new Set());
  const [loadingTrainees, setLoadingTrainees] = useState(false);
  const [searchTrainee, setSearchTrainee] = useState('');
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [emailResults, setEmailResults] = useState([]);
  const [newlyCreatedCount, setNewlyCreatedCount] = useState(0);
  // Supervisor assignment modal state
  const [assignSupervisorModal, setAssignSupervisorModal] = useState({ show: false });
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [searchSupervisor, setSearchSupervisor] = useState('');
  const [savingSupervisor, setSavingSupervisor] = useState(false);
  const [showSupervisorEmailPopup, setShowSupervisorEmailPopup] = useState(false);
  const [supervisorEmailResult, setSupervisorEmailResult] = useState(null);

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

  // Handle opening assign modal
  const handleOpenAssignModal = async () => {
    setAssignModal({ show: true });
    setLoadingTrainees(true);
    setSearchTrainee('');
    
    try {
      // Get available trainees from department
      const data = await getAvailableTraineesForGroup(id);
      
      if (data.ok && data.trainees) {
        setAvailableTrainees(data.trainees);
        
        // Pre-check employees/trainees already in the group
        // Use traineeId if available, otherwise use employeeId for employees without trainee records
        const currentMemberIds = new Set(members.map(m => m.traineeId?.toString()));
        const preSelected = new Set();
        
        data.trainees.forEach(emp => {
          // If employee is in the group, select them
          if (emp.isInGroup) {
            preSelected.add(emp.traineeId);
          }
        });
        
        setSelectedTraineeIds(preSelected);
      } else {
        showToast(data.error || 'Failed to load available trainees', 'error');
        setAssignModal({ show: false });
      }
    } catch (err) {
      console.error('Failed to load trainees:', err);
      const errorMsg = err.message || 'Failed to load available trainees';
      showToast(errorMsg, 'error');
      
      // If it's an auth error, close the modal
      if (errorMsg.includes('session') || errorMsg.includes('log in')) {
        setAssignModal({ show: false });
      }
    } finally {
      setLoadingTrainees(false);
    }
  };

  // Handle closing assign modal
  const handleCloseAssignModal = () => {
    setAssignModal({ show: false });
    setAvailableTrainees([]);
    setSelectedTraineeIds(new Set());
    setSearchTrainee('');
  };

  // Toggle trainee selection with validation
  const toggleTraineeSelection = (traineeId) => {
    // Find the trainee/employee object
    const traineeObj = availableTrainees.find(t => t.traineeId === traineeId);
    
    if (!traineeObj) {
      console.error('Trainee not found:', traineeId);
      return;
    }
    
    // If deselecting, allow it
    if (selectedTraineeIds.has(traineeId)) {
      setSelectedTraineeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(traineeId);
        return newSet;
      });
      return;
    }
    
    // Validate before selecting
    // Check if employee is a supervisor
    if (traineeObj.isSupervisor) {
      showToast(`${traineeObj.name} is a supervisor and cannot be assigned as a trainee.`, 'error');
      return;
    }
    
    // Check if trainee is in another group
    if (traineeObj.inAnotherGroup && !traineeObj.isInGroup) {
      showToast(`${traineeObj.name} is already assigned to another group. Trainees can only be assigned to one group.`, 'error');
      return;
    }
    
    // Allow selection if validation passes
    setSelectedTraineeIds(prev => {
      const newSet = new Set(prev);
      newSet.add(traineeId);
      return newSet;
    });
  };

  // Save trainee assignments
  const handleSaveAssignments = async () => {
    try {
      setSavingAssignments(true);
      
      const selectedIds = Array.from(selectedTraineeIds);
      const currentMemberIds = new Set(members.map(m => m.traineeId?.toString()));
      
      // Find trainees to add (selected but not in group)
      const traineesToAdd = selectedIds.filter(id => !currentMemberIds.has(id));
      
      // Find trainees to remove (in group but not selected)
      const traineesToRemove = Array.from(currentMemberIds).filter(id => !selectedTraineeIds.has(id));
      
      // Add new trainees
      if (traineesToAdd.length > 0) {
        const addResult = await adminAddTraineesToGroup(id, traineesToAdd);
        
        // Check if there were any issues or successes
        if (addResult.results) {
          const { added, inAnotherGroup, notFound, newlyCreated, emailResults } = addResult.results;
          
          // Show popup for newly created trainees with email status
          if (newlyCreated && newlyCreated.length > 0 && emailResults && emailResults.length > 0) {
            setNewlyCreatedCount(newlyCreated.length);
            setEmailResults(emailResults);
            // Show popup to indicate emails were sent
            setShowEmailPopup(true);
          } else if (newlyCreated && newlyCreated.length > 0) {
            // New trainees created but no email results (shouldn't happen, but handle gracefully)
            showToast(`✅ Created ${newlyCreated.length} new trainee(s)`, 'success');
          }
          
          if (inAnotherGroup && inAnotherGroup.length > 0) {
            showToast(`${inAnotherGroup.length} trainee(s) are already in another group`, 'warning');
          }
          if (notFound && notFound.length > 0) {
            showToast(`${notFound.length} trainee(s) not found`, 'warning');
          }
        }
      }
      
      // Remove trainees that were unchecked
      for (const traineeId of traineesToRemove) {
        try {
          await adminRemoveTrainee(id, traineeId);
        } catch (err) {
          console.error(`Failed to remove trainee ${traineeId}:`, err);
          showToast(`Failed to remove one or more trainees: ${err.message}`, 'warning');
        }
      }
      
      // Reload group data
      await load();
      handleCloseAssignModal();
      
      const addedCount = traineesToAdd.length;
      const removedCount = traineesToRemove.length;
      if (addedCount > 0 || removedCount > 0) {
        showToast(`Successfully updated: ${addedCount} added, ${removedCount} removed`, 'success');
      } else {
        showToast('No changes made', 'info');
      }
    } catch (err) {
      console.error('Failed to save assignments:', err);
      const errorMsg = err.message || 'Failed to save assignments. Please try again.';
      showToast(errorMsg, 'error');
      
      // If it's an auth error, close the modal
      if (errorMsg.includes('session') || errorMsg.includes('log in')) {
        handleCloseAssignModal();
      }
    } finally {
      setSavingAssignments(false);
    }
  };

  // Filter trainees by search
  const filteredTrainees = availableTrainees.filter(trainee => {
    const searchLower = searchTrainee.toLowerCase();
    return (
      trainee.name.toLowerCase().includes(searchLower) ||
      trainee.email.toLowerCase().includes(searchLower) ||
      trainee.empId.toLowerCase().includes(searchLower)
    );
  });

  // Handle opening assign supervisor modal
  const handleOpenAssignSupervisorModal = async () => {
    setAssignSupervisorModal({ show: true });
    setLoadingSupervisors(true);
    setSearchSupervisor('');
    
    try {
      const data = await getAvailableSupervisorsForGroup(id);
      
      if (data.ok && data.employees) {
        setAvailableSupervisors(data.employees);
        // Pre-select current supervisor if exists
        if (supervisor && supervisor.id) {
          const currentSupervisor = data.employees.find(emp => 
            emp.supervisorId === supervisor.id || emp.employeeId === supervisor.id
          );
          if (currentSupervisor) {
            setSelectedSupervisorId(currentSupervisor.supervisorId);
          }
        }
      } else {
        showToast(data.error || 'Failed to load available employees', 'error');
        setAssignSupervisorModal({ show: false });
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
      const errorMsg = err.message || 'Failed to load available employees';
      showToast(errorMsg, 'error');
      
      if (errorMsg.includes('session') || errorMsg.includes('log in')) {
        setAssignSupervisorModal({ show: false });
      }
    } finally {
      setLoadingSupervisors(false);
    }
  };

  // Handle closing assign supervisor modal
  const handleCloseAssignSupervisorModal = () => {
    setAssignSupervisorModal({ show: false });
    setAvailableSupervisors([]);
    setSelectedSupervisorId(null);
    setSearchSupervisor('');
  };

  // Handle supervisor selection (single selection, radio button style)
  const handleSupervisorSelection = (supervisorId) => {
    // If clicking the same supervisor, deselect (allow unselecting)
    if (selectedSupervisorId === supervisorId) {
      setSelectedSupervisorId(null);
    } else {
      setSelectedSupervisorId(supervisorId);
    }
  };

  // Save supervisor assignment
  const handleSaveSupervisorAssignment = async () => {
    if (!selectedSupervisorId) {
      showToast('Please select a supervisor', 'error');
      return;
    }

    try {
      setSavingSupervisor(true);
      
      const result = await adminAssignSupervisorToGroup(id, selectedSupervisorId);
      
      if (result.ok) {
        // Show email popup if supervisor was newly created
        if (result.newlyCreated && result.emailResult) {
          setSupervisorEmailResult({
            email: result.supervisor.email,
            name: result.supervisor.name,
            success: result.emailResult.success,
            error: result.emailResult.error
          });
          setShowSupervisorEmailPopup(true);
        } else {
          showToast('Supervisor assigned successfully', 'success');
        }
        
        // Reload group data
        await load();
        handleCloseAssignSupervisorModal();
      } else {
        showToast(result.error || 'Failed to assign supervisor', 'error');
      }
    } catch (err) {
      console.error('Failed to assign supervisor:', err);
      const errorMsg = err.message || 'Failed to assign supervisor. Please try again.';
      showToast(errorMsg, 'error');
      
      if (errorMsg.includes('session') || errorMsg.includes('log in')) {
        handleCloseAssignSupervisorModal();
      }
    } finally {
      setSavingSupervisor(false);
    }
  };

  // Filter supervisors by search
  const filteredSupervisors = availableSupervisors.filter(emp => {
    const searchLower = searchSupervisor.toLowerCase();
    return (
      emp.name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.empId.toLowerCase().includes(searchLower)
    );
  });

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
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                No supervisor assigned to this group.{' '}
                <a 
                  href="#" 
                  className="sv-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleOpenAssignSupervisorModal();
                  }}
                >
                  Assign one?
                </a>
              </div>
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
              <button 
                className="sv-button-primary sv-button-icon"
                onClick={handleOpenAssignModal}
              >
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

      {/* Assign Trainees Modal */}
      {assignModal.show && (
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
        }} onClick={handleCloseAssignModal}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827'
              }}>
                Assign Employees to Group
              </h2>
              <button
                onClick={handleCloseAssignModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#111827'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#6b7280'; }}
              >
                ×
              </button>
            </div>

            {/* Search Input */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchTrainee}
                onChange={(e) => setSearchTrainee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            {/* Trainees List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 28px'
            }}>
              {loadingTrainees ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
                  <p>Loading employees...</p>
                </div>
              ) : filteredTrainees.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <p>No employees found in this department.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTrainees.map((trainee) => {
                    const isChecked = selectedTraineeIds.has(trainee.traineeId);
                    return (
                      <div
                        key={trainee.traineeId}
                        onClick={() => toggleTraineeSelection(trainee.traineeId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: isChecked ? '#2563EB' : '#e5e7eb',
                          background: isChecked ? '#eff6ff' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = '#2563EB';
                            e.currentTarget.style.background = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#fff';
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTraineeSelection(trainee.traineeId)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={trainee.isSupervisor || (trainee.inAnotherGroup && !trainee.isInGroup)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: (trainee.isSupervisor || (trainee.inAnotherGroup && !trainee.isInGroup)) ? 'not-allowed' : 'pointer',
                            accentColor: '#2563EB',
                            opacity: (trainee.isSupervisor || (trainee.inAnotherGroup && !trainee.isInGroup)) ? 0.5 : 1
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '4px'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#111827'
                            }}>
                              {trainee.name}
                            </p>
                            {trainee.isSupervisor && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#fef3c7',
                                color: '#d97706',
                                borderRadius: '12px',
                                fontWeight: '500'
                              }}>
                                Supervisor
                              </span>
                            )}
                            {trainee.isInGroup && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#dbeafe',
                                color: '#2563EB',
                                borderRadius: '12px',
                                fontWeight: '500'
                              }}>
                                In Group
                              </span>
                            )}
                            {trainee.inAnotherGroup && !trainee.isInGroup && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '12px',
                                fontWeight: '500'
                              }}>
                                In Another Group
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <span>{trainee.email}</span>
                            <span>•</span>
                            <span>ID: {trainee.empId}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseAssignModal}
                disabled={savingAssignments}
                style={{
                  padding: '10px 24px',
                  background: '#f3f4f6',
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: savingAssignments ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  opacity: savingAssignments ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!savingAssignments) {
                    e.target.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingAssignments) {
                    e.target.style.background = '#f3f4f6';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
                style={{
                  padding: '10px 24px',
                  background: savingAssignments ? '#94a3b8' : '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: savingAssignments ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingAssignments) {
                    e.target.style.background = '#1D4ED8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingAssignments) {
                    e.target.style.background = '#2563EB';
                  }
                }}
              >
                {savingAssignments ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Assignments</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Supervisor Modal */}
      {assignSupervisorModal.show && (
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
        }} onClick={handleCloseAssignSupervisorModal}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '800px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827'
              }}>
                Assign Supervisor to Group
              </h2>
              <button
                onClick={handleCloseAssignSupervisorModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#111827'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#6b7280'; }}
              >
                ×
              </button>
            </div>

            {/* Search Input */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchSupervisor}
                onChange={(e) => setSearchSupervisor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
              />
            </div>

            {/* Employees List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 28px'
            }}>
              {loadingSupervisors ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <Loader2 className="animate-spin" size={32} style={{ marginBottom: '16px' }} />
                  <p>Loading employees...</p>
                </div>
              ) : filteredSupervisors.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#6b7280'
                }}>
                  <p>No employees found in this department.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredSupervisors.map((emp) => {
                    const isSelected = selectedSupervisorId === emp.supervisorId;
                    return (
                      <div
                        key={emp.supervisorId}
                        onClick={() => handleSupervisorSelection(emp.supervisorId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: isSelected ? '#2563EB' : '#e5e7eb',
                          background: isSelected ? '#eff6ff' : '#fff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#2563EB';
                            e.currentTarget.style.background = '#f8fafc';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#fff';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => handleSupervisorSelection(emp.supervisorId)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            accentColor: '#2563EB'
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '4px'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#111827'
                            }}>
                              {emp.name}
                            </p>
                            {emp.isSupervisor && (
                              <span style={{
                                fontSize: '12px',
                                padding: '2px 8px',
                                background: '#fef3c7',
                                color: '#d97706',
                                borderRadius: '12px',
                                fontWeight: '500'
                              }}>
                                Supervisor
                              </span>
                            )}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            <span>{emp.email}</span>
                            <span>•</span>
                            <span>ID: {emp.empId}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 28px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseAssignSupervisorModal}
                disabled={savingSupervisor}
                style={{
                  padding: '10px 24px',
                  background: '#f3f4f6',
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: savingSupervisor ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  opacity: savingSupervisor ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!savingSupervisor) {
                    e.target.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingSupervisor) {
                    e.target.style.background = '#f3f4f6';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupervisorAssignment}
                disabled={savingSupervisor || !selectedSupervisorId}
                style={{
                  padding: '10px 24px',
                  background: (savingSupervisor || !selectedSupervisorId) ? '#94a3b8' : '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (savingSupervisor || !selectedSupervisorId) ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!savingSupervisor && selectedSupervisorId) {
                    e.target.style.background = '#1D4ED8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingSupervisor && selectedSupervisorId) {
                    e.target.style.background = '#2563EB';
                  }
                }}
              >
                {savingSupervisor ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Assign Supervisor</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Email Success Popup - Same style as AssignMembers */}
      {showSupervisorEmailPopup && supervisorEmailResult && (
        <div className="success-popup-overlay" onClick={() => {
          setShowSupervisorEmailPopup(false);
          setSupervisorEmailResult(null);
        }}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="success-popup-header">
              <div className="success-icon">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3>Login Credentials Sent!</h3>
            </div>
            
            <div className="success-popup-content">
              <p>New supervisor created and login credentials sent via email.</p>
              
              <div className="email-status">
                <h4 className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Status:
                </h4>
                <div className="email-list">
                  <div className={`email-item ${supervisorEmailResult.success ? 'success' : 'failed'}`}>
                    <span className="email-type">
                      <Shield className="w-4 h-4" />
                      Supervisor
                    </span>
                    <span className="email-address">{supervisorEmailResult.email}</span>
                    <span className="email-status-icon">
                      {supervisorEmailResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="email-summary">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {supervisorEmailResult.success ? (
                      <>Login credentials sent to <strong>{supervisorEmailResult.name}</strong> ({supervisorEmailResult.email}).</>
                    ) : (
                      <>Failed to send email to {supervisorEmailResult.email}. Supervisor can still log in with assigned credentials.</>
                    )}
                  </p>
                  {!supervisorEmailResult.success && supervisorEmailResult.error && (
                    <p className="warning flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Error: {supervisorEmailResult.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="success-popup-actions">
              <button 
                onClick={() => {
                  setShowSupervisorEmailPopup(false);
                  setSupervisorEmailResult(null);
                }}
                className="success-popup-btn"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Success Popup - Same style as AssignMembers */}
      {showEmailPopup && (
        <div className="success-popup-overlay" onClick={() => {
          setShowEmailPopup(false);
          setEmailResults([]);
          setNewlyCreatedCount(0);
        }}>
          <div className="success-popup" onClick={(e) => e.stopPropagation()}>
            <div className="success-popup-header">
              <div className="success-icon">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3>Login Credentials Sent!</h3>
            </div>
            
            <div className="success-popup-content">
              <p><strong>{newlyCreatedCount}</strong> new trainee(s) created and login credentials sent via email.</p>
              
              {emailResults && emailResults.length > 0 ? (
                <div className="email-status">
                  <h4 className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Status:
                  </h4>
                  <div className="email-list">
                    {emailResults.map((result, index) => (
                      <div key={index} className={`email-item ${result.success ? 'success' : 'failed'}`}>
                        <span className="email-type">
                          <UsersRound className="w-4 h-4" />
                          Trainee
                        </span>
                        <span className="email-address">{result.email}</span>
                        <span className="email-status-icon">
                          {result.success ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="email-summary">
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Login credentials sent to <strong>{emailResults.filter(r => r.success).length}</strong> out of <strong>{emailResults.length}</strong> new trainee(s).
                    </p>
                    {emailResults.some(r => !r.success) && (
                      <p className="warning flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Some emails failed to send. Trainees can still log in with their assigned credentials.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="email-status">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    No new credentials were generated (existing trainees were assigned).
                  </p>
                </div>
              )}
            </div>
            
            <div className="success-popup-actions">
              <button 
                onClick={() => {
                  setShowEmailPopup(false);
                  setEmailResults([]);
                  setNewlyCreatedCount(0);
                }}
                className="success-popup-btn"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}