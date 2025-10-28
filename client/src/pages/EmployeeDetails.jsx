import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchEmployeeDetails, checkEmployeeUserType, deleteTraineeByEmployeeId, deleteSupervisorByEmployeeId } from '../services/api';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromTab = searchParams.get('from'); // Get which tab user came from
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState(null); // 'employee', 'trainee', 'supervisor'
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      try {
        setLoading(true);
        const [employeeResponse, userTypeResponse] = await Promise.all([
          fetchEmployeeDetails(id),
          checkEmployeeUserType(id)
        ]);
        
        if (employeeResponse.success) {
          setEmployee(employeeResponse.data);
        } else {
          setError(employeeResponse.message || 'Failed to load employee details');
        }
        
        if (userTypeResponse.success) {
          setUserType(userTypeResponse.data?.userType || 'employee');
        }
      } catch (err) {
        setError('Error loading employee details');
        console.error('Employee details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadEmployeeDetails();
    }
  }, [id]);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userType || userType === 'employee') {
      return;
    }
    
    try {
      setDeleting(true);
      let response;
      
      if (userType === 'trainee') {
        response = await deleteTraineeByEmployeeId(id);
      } else if (userType === 'supervisor') {
        response = await deleteSupervisorByEmployeeId(id);
      }
      
      if (response.success) {
        setShowDeleteModal(false);
        navigate('/admin/users');
      } else {
        setError(response.message || `Failed to delete ${userType}`);
      }
    } catch (err) {
      setError(`Error deleting ${userType}`);
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Employee Details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate('/admin/users')} style={{ marginTop: '10px', padding: '10px 20px' }}>
          Back to User Management
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Employee Not Found</h2>
        <button onClick={() => navigate('/admin/users')} style={{ marginTop: '10px', padding: '10px 20px' }}>
          Back to User Management
        </button>
      </div>
    );
  }

  // Get breadcrumb text
  const getBreadcrumb = () => {
    if (!fromTab) return '';
    const tabMap = {
      'employees': 'Employees',
      'trainees': 'Trainees',
      'supervisors': 'Supervisors'
    };
    return tabMap[fromTab] || '';
  };

  return (
    <div style={{ 
      padding: '40px 20px',
      margin: '10px 8px',
      minHeight: '100vh',
    }}>
        {/* Content area */}
         <div style={{ 
           backgroundColor: '#fff', 
           padding: '32px', 
           borderRadius: '12px', 
           boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
           maxWidth: '1400px',
           margin: '0 auto',
           width: '100%'
         }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
            <span 
              style={{ color: '#6b7280', cursor: 'pointer' }} 
              onClick={() => navigate('/admin/users')}
            >
              User Management
            </span>
            {fromTab && (
              <>
                <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
                <span style={{ color: '#111827', fontWeight: 700 }}>
                  {getBreadcrumb()}
                </span>
              </>
            )}
          </div>

          {/* H1 and Delete Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '30px', 
            borderBottom: '2px solid #1976d2', 
            paddingBottom: '16px'
          }}>
            <h1 style={{ 
              color: '#111827', 
              fontSize: '28px',
              fontWeight: 700,
              margin: 0
            }}>
              Employee Details {userType && userType !== 'employee' && (
                <span style={{ fontSize: '0.7em', color: '#1976d2', fontWeight: 'normal' }}>
                  ({userType.charAt(0).toUpperCase() + userType.slice(1)})
                </span>
              )}
            </h1>

            {/* Delete button - only show for trainees and supervisors when coming from their respective tabs */}
            {userType && fromTab && 
             ((userType === 'trainee' && fromTab === 'trainees') || 
              (userType === 'supervisor' && fromTab === 'supervisors')) && (
              <button 
                onClick={handleDelete}
                disabled={deleting}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  padding: '4px 8px',
                  flexShrink: 0,
                  opacity: deleting ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.target.style.opacity = '0.8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleting) {
                    e.target.style.opacity = '1';
                  }
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" color="#dc2626">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? 'Deleting...' : `Delete ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
              </button>
            )}
          </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div 
            style={{ 
              padding: '24px', 
              borderRadius: '12px', 
              background: '#f8f9fa',
              border: '2px solid #e5e7eb',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1976d2';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h3 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>Personal Information</h3>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Name:</strong> {employee.fname} {employee.lname}
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Email:</strong> {employee.email}
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Phone:</strong> {employee.phone || 'Not provided'}
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Department:</strong> {employee.ObjectDepartmentID?.departmentName || 'Not assigned'}
            </div>
          </div>

          <div 
            style={{ 
              padding: '24px', 
              borderRadius: '12px', 
              background: '#f8f9fa',
              border: '2px solid #e5e7eb',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1976d2';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h3 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>Employment Details</h3>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Employee ID:</strong> {employee.EmpID || 'Not assigned'}
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Position:</strong> {employee.position || 'Not specified'}
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827' }}>
              <strong style={{ color: '#1976d2' }}>Status:</strong> {employee.status || 'Active'}
            </div>
          </div>
        </div>

        {employee.bio && (
          <div 
            style={{ 
              marginTop: '32px', 
              padding: '20px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '12px', 
              border: '2px solid #e5e7eb',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1976d2';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <h3 style={{ color: '#1976d2', marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Biography</h3>
            <p style={{ 
              lineHeight: '1.6',
              fontSize: '15px',
              color: '#374151',
            }}>
              {employee.bio}
            </p>
          </div>
        )}

        <div 
          style={{ 
            marginTop: '32px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '12px', 
            border: '2px solid #e5e7eb',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1976d2';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.2)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <h4 style={{ margin: '0 0 16px 0', color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Additional Information</h4>
          <div style={{ fontSize: '15px', color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><strong style={{ color: '#1976d2' }}>Created:</strong> {employee.createdAt ? new Date(employee.createdAt).toLocaleString() : 'Not available'}</div>
            <div><strong style={{ color: '#1976d2' }}>Last Updated:</strong> {employee.updatedAt ? new Date(employee.updatedAt).toLocaleString() : 'Not available'}</div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
        }} onClick={cancelDelete}>
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
                Confirm Deletion
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: '1.5',
                margin: 0
              }}>
                Are you sure you want to delete this {userType}? This action will remove their access but keep their employee record. This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={cancelDelete}
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
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  background: deleting ? '#ccc' : '#dc2626',
                  color: '#fff',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { 
                  if (!deleting) {
                    e.target.style.background = '#b91c1c'; 
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!deleting) {
                    e.target.style.background = '#dc2626'; 
                  }
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}