import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSupervisorTraineeDetails } from '../services/api';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiHash, FiCheckCircle } from 'react-icons/fi';

export default function SupervisorTraineeDetails() {
  const { traineeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the group ID from location state or go back to groups
  const groupId = location.state?.groupId;
  const groupName = location.state?.groupName;

  useEffect(() => {
    const loadTraineeDetails = async () => {
      try {
        setLoading(true);
        const response = await getSupervisorTraineeDetails(traineeId);
        
        if (response.success) {
          setTrainee(response.data);
        } else {
          setError(response.message || 'Failed to load trainee details');
        }
      } catch (err) {
        setError(err.message || 'Error loading trainee details');
        console.error('Trainee details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (traineeId) {
      loadTraineeDetails();
    }
  }, [traineeId]);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Loading Trainee Details...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button 
          onClick={() => groupId ? navigate(`/supervisor/groups/${groupId}`) : navigate('/supervisor/groups')} 
          style={{ 
            marginTop: '10px', 
            padding: '10px 20px',
            background: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back to Group
        </button>
      </div>
    );
  }

  if (!trainee) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Trainee Not Found</h2>
        <button 
          onClick={() => groupId ? navigate(`/supervisor/groups/${groupId}`) : navigate('/supervisor/groups')} 
          style={{ 
            marginTop: '10px', 
            padding: '10px 20px',
            background: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          ← Back to Group
        </button>
      </div>
    );
  }

  const employee = trainee.EmpObjectUserID || {};
  const department = employee.ObjectDepartmentID || {};

  return (
    <div style={{ 
      padding: '40px 20px',
      margin: '10px 8px',
      minHeight: '100vh',
    }}>
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
            onClick={() => navigate('/supervisor/groups')}
          >
            Groups
          </span>
          {groupName && (
            <>
              <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
              <span 
                style={{ color: '#6b7280', cursor: 'pointer' }} 
                onClick={() => groupId && navigate(`/supervisor/groups/${groupId}`)}
              >
                {groupName}
              </span>
            </>
          )}
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
          <span style={{ color: '#111827', fontWeight: 700 }}>
            Trainee Details
          </span>
        </div>

        {/* Header */}
        <div style={{ 
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
            Employee Details (Trainee)
          </h1>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Personal Information Card */}
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
            <h3 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiUser size={20} />
              Personal Information
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px' }}>Name:</strong> 
              <span>{employee.fname || ''} {employee.lname || ''}</span>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiMail size={16} />
                Email:
              </strong> 
              <a href={`mailto:${trainee.loginEmail || employee.email}`} style={{ color: '#2563EB', textDecoration: 'none' }}>
                {trainee.loginEmail || employee.email || 'Not provided'}
              </a>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiPhone size={16} />
                Phone:
              </strong> 
              <span>{employee.phone || employee.phoneNumber || 'Not provided'}</span>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px' }}>Department:</strong> 
              <span>{department.departmentName || 'Not assigned'}</span>
            </div>
          </div>

          {/* Employment Details Card */}
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
            <h3 style={{ color: '#1976d2', marginBottom: '20px', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBriefcase size={20} />
              Employment Details
            </h3>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiHash size={16} />
                Employee ID:
              </strong> 
              <span>{employee.EmpID || 'Not assigned'}</span>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px' }}>Position:</strong> 
              <span>{employee.position || 'Not specified'}</span>
            </div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: '#1976d2', minWidth: '120px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiCheckCircle size={16} />
                Status:
              </strong> 
              <span style={{ 
                color: '#059669', 
                fontWeight: '600',
                padding: '4px 12px',
                background: '#d1fae5',
                borderRadius: '12px',
                fontSize: '14px'
              }}>
                Active
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

