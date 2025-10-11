import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTraineeDetails } from '../services/api';

export default function TraineeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTraineeDetails = async () => {
      try {
        setLoading(true);
        const response = await fetchTraineeDetails(id);
        
        if (response.success) {
          setTrainee(response.data);
        } else {
          setError(response.message || 'Failed to load trainee details');
        }
      } catch (err) {
        setError('Error loading trainee details');
        console.error('Trainee details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadTraineeDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Trainee Details...</h2>
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

  if (!trainee) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Trainee Not Found</h2>
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
        <h1 style={{ marginBottom: '30px', color: '#333', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
          Trainee Details
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Personal Information</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Name:</strong> {trainee.EmpObjectUserID?.fname} {trainee.EmpObjectUserID?.lname}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {trainee.loginEmail || trainee.EmpObjectUserID?.email}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Phone:</strong> {trainee.EmpObjectUserID?.phoneNumber || 'Not provided'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Department:</strong> {trainee.EmpObjectUserID?.departmentName || 'Not assigned'}
            </div>
          </div>

          <div>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Training Details</h3>
            <div style={{ marginBottom: '10px' }}>
              <strong>Trainee ID:</strong> {trainee._id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Employee ID:</strong> {trainee.EmpObjectUserID?._id}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Training Start:</strong> {trainee.trainingStartDate ? new Date(trainee.trainingStartDate).toLocaleDateString() : 'Not set'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <strong>Training End:</strong> {trainee.trainingEndDate ? new Date(trainee.trainingEndDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>
        </div>

        {trainee.trainingProgram && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Training Program</h3>
            <p style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', lineHeight: '1.6' }}>
              {trainee.trainingProgram}
            </p>
          </div>
        )}

        {trainee.notes && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#555', marginBottom: '15px' }}>Notes</h3>
            <p style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', lineHeight: '1.6' }}>
              {trainee.notes}
            </p>
          </div>
        )}

        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Additional Information</h4>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div>Created: {trainee.createdAt ? new Date(trainee.createdAt).toLocaleString() : 'Not available'}</div>
            <div>Last Updated: {trainee.updatedAt ? new Date(trainee.updatedAt).toLocaleString() : 'Not available'}</div>
            <div>Progress: {trainee.progress || 'Not tracked'}</div>
            <div>Status: {trainee.status || 'Active'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}