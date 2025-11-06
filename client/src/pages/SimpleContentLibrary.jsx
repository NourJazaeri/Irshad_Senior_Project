import React, { useState } from 'react';
import '../styles/content-library.css';

export default function SimpleContentLibrary() {
  const [message, setMessage] = useState('');

  const handleTestUpload = async () => {
    setMessage('Testing upload...');

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5002';

      // Simple test - just try to upload a YouTube video
      const formData = new FormData();
      formData.append('title', 'Test Video');
      formData.append('description', 'This is a test');
      formData.append('category', 'Training');
      formData.append('youtubeUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      formData.append('ackRequired', 'false');

      // For now, just hardcode a group ID - you'll need to replace this
      formData.append('assignedTo_GroupID', '673a5fa90de38dba69d51e9e');

      const response = await fetch(`${API_BASE}/api/content/upload-youtube`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ SUCCESS! Content uploaded. Notifications should be sent to trainees!');
      } else {
        setMessage(`❌ Error: ${data.error || 'Upload failed'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Content Library - Simple Test</h1>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Click the button below to test uploading a YouTube video and triggering notifications.
        </p>

        <button
          onClick={handleTestUpload}
          style={{
            padding: '1rem 2rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          Test Upload YouTube Video
        </button>

        {message && (
          <div style={{
            padding: '1rem',
            background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
            color: message.includes('✅') ? '#065f46' : '#991b1b',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Instructions:</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Click the "Test Upload" button above</li>
            <li>If you see an error about group ID, that's expected - we need to get your actual group ID</li>
            <li>Open the browser console (F12) to see detailed logs</li>
            <li>Login as a trainee in another tab to see if the notification bell appears</li>
          </ol>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#9a3412' }}>Next Steps:</h3>
          <p style={{ color: '#9a3412', marginBottom: '0.5rem' }}>
            To make this fully work, we need to:
          </p>
          <ol style={{ paddingLeft: '1.5rem', color: '#9a3412', lineHeight: '1.8' }}>
            <li>Find your actual group IDs from the database</li>
            <li>Add a proper group selector</li>
            <li>Add file upload and link upload options</li>
          </ol>
          <p style={{ color: '#9a3412', marginTop: '0.5rem', fontWeight: 'bold' }}>
            But this simple version will let you test the notification system immediately!
          </p>
        </div>
      </div>
    </div>
  );
}
