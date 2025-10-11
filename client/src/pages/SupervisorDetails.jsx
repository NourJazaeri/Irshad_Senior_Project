import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSupervisorDetails } from '../services/api';

export default function SupervisorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supervisor, setSupervisor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSupervisorDetails = async () => {
      try {
        setLoading(true);
        const response = await fetchSupervisorDetails(id);
        
        if (response.success) {
          setSupervisor(response.data);
        } else {
          setError(response.message || 'Failed to load supervisor details');
        }
      } catch (err) {
        setError('Error loading supervisor details');
        console.error('Supervisor details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSupervisorDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Supervisor Details...</h2>
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

  if (!supervisor) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Supervisor Not Found</h2>
        <button onClick={() => navigate('/admin/users')} style={{ marginTop: '10px', padding: '10px 20px' }}>
          Back to User Management
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
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
      </div>

      <div style={{ backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '30px', color: '#333', borderBottom: '2px solid #dc3545', paddingBottom: '10px' }}>
          Supervisor Details
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Personal Information</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Name:</strong> {supervisor.EmpObjectUserID?.fname} {supervisor.EmpObjectUserID?.lname}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {supervisor.loginEmail || supervisor.EmpObjectUserID?.email}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Phone:</strong> {supervisor.EmpObjectUserID?.phoneNumber || 'Not provided'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Department:</strong> {supervisor.EmpObjectUserID?.departmentName || 'Not assigned'}
            </div>
          </div>

          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Supervisor Details</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Supervisor ID:</strong> {supervisor._id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Employee ID:</strong> {supervisor.EmpObjectUserID?._id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Supervisor Level:</strong> {supervisor.level || 'Standard'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Team Size:</strong> {supervisor.teamSize || 'Not specified'}
            </div>
          </div>
        </div>

        {supervisor.responsibilities && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Responsibilities</h3>
            <p style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', lineHeight: '1.6' }}>
              {supervisor.responsibilities}
            </p>
          </div>
        )}

        {supervisor.specializations && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Specializations</h3>
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px' }}>
              {Array.isArray(supervisor.specializations) ? (
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {supervisor.specializations.map((spec, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{spec}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>{supervisor.specializations}</p>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Additional Information</h4>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>Created: {supervisor.createdAt ? new Date(supervisor.createdAt).toLocaleString() : 'Not available'}</div>
            <div>Last Updated: {supervisor.updatedAt ? new Date(supervisor.updatedAt).toLocaleString() : 'Not available'}</div>
            <div>Years of Experience: {supervisor.experience || 'Not specified'}</div>
            <div>Status: {supervisor.status || 'Active'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}