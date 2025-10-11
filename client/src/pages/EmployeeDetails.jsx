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

  const handleDelete = async () => {
    if (!userType || userType === 'employee') {
      return; // Should not happen as button won't show
    }
    
    const confirmMessage = `Are you sure you want to delete this ${userType}? This will remove their access but keep their employee record.`;
    if (!window.confirm(confirmMessage)) {
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
        alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully!`);
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

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/admin/users')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back to User Management
        </button>
        
        {/* Delete button - only show for trainees and supervisors when coming from their respective tabs */}
        {userType && fromTab && 
         ((userType === 'trainee' && fromTab === 'trainees') || 
          (userType === 'supervisor' && fromTab === 'supervisors')) && (
          <button 
            onClick={handleDelete}
            disabled={deleting}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: deleting ? '#ccc' : '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: deleting ? 'not-allowed' : 'pointer'
            }}
          >
            {deleting ? 'Deleting...' : `Delete ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
          </button>
        )}
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '30px', color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
          Employee Details {userType && userType !== 'employee' && (
            <span style={{ fontSize: '0.7em', color: '#666', fontWeight: 'normal' }}>
              ({userType.charAt(0).toUpperCase() + userType.slice(1)})
            </span>
          )}
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Personal Information</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Name:</strong> {employee.fname} {employee.lname}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {employee.email}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Phone:</strong> {employee.phone || 'Not provided'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Department:</strong> {employee.ObjectDepartmentID?.departmentName || 'Not assigned'}
            </div>
          </div>

          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Employment Details</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Employee ID:</strong> {employee.EmpID || 'Not assigned'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Position:</strong> {employee.position || 'Not specified'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Status:</strong> {employee.status || 'Active'}
            </div>
          </div>
        </div>

        {employee.bio && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Biography</h3>
            <p style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', lineHeight: '1.6' }}>
              {employee.bio}
            </p>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Additional Information</h4>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>Created: {employee.createdAt ? new Date(employee.createdAt).toLocaleString() : 'Not available'}</div>
            <div>Last Updated: {employee.updatedAt ? new Date(employee.updatedAt).toLocaleString() : 'Not available'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}