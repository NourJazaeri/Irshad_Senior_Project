import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Video } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import '../styles/content-library.css';

export default function ContentLibrary() {
  const [uploadType, setUploadType] = useState('file'); // file, link, youtube
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    deadline: '',
    ackRequired: false,
    file: null,
    linkUrl: '',
    youtubeUrl: ''
  });
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch groups and content on mount
  useEffect(() => {
    fetchGroups();
    fetchContent();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5002';

      console.log('🔍 User object from localStorage:', user);
      console.log('🔍 Fetching groups - User role:', user.role);

      // TEMPORARY FIX: Try supervisor endpoint by default since login isn't working
      let endpoint = `${API_BASE}/api/supervisor/my-groups`;

      console.log('📍 Using endpoint:', endpoint);
      console.log('⚠️ NOTE: Currently using supervisor endpoint as default for testing');

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Groups response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Data received:', data);

        // Parse supervisor groups response
        let groupsList = data.items || data.groups || data || [];

        // If data is an array directly, use it
        if (Array.isArray(data)) {
          groupsList = data;
        }

        console.log('📋 Setting groups:', groupsList);
        console.log('📊 Number of groups:', groupsList.length);
        setGroups(groupsList);
      } else {
        console.error('❌ Failed to fetch:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
    }
  };

  const fetchContent = async () => {
    try {
      setLoadingContent(true);
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5002';

      const response = await fetch(`${API_BASE}/api/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContentList(data.content || data || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file, title: formData.title || file.name });
    }
  };

  const handleGroupToggle = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5002';

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('ackRequired', formData.ackRequired);

      if (formData.deadline) {
        formDataToSend.append('deadline', formData.deadline);
      }

      // Append selected groups
      selectedGroups.forEach(groupId => {
        formDataToSend.append('assignedTo_GroupID', groupId);
      });

      let endpoint = '';

      if (uploadType === 'file' && formData.file) {
        formDataToSend.append('file', formData.file);
        endpoint = `${API_BASE}/api/content/upload`;
      } else if (uploadType === 'link' && formData.linkUrl) {
        formDataToSend.append('linkUrl', formData.linkUrl);
        endpoint = `${API_BASE}/api/content/link`;
      } else if (uploadType === 'youtube' && formData.youtubeUrl) {
        formDataToSend.append('youtubeUrl', formData.youtubeUrl);
        endpoint = `${API_BASE}/api/content/youtube`;
      } else {
        setMessage({ type: 'error', text: 'Please provide all required fields' });
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setMessage({ type: 'success', text: '✅ Content uploaded successfully! Notifications sent to trainees.' });
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'General',
          deadline: '',
          ackRequired: false,
          file: null,
          linkUrl: '',
          youtubeUrl: ''
        });
        setSelectedGroups([]);
        if (document.getElementById('fileInput')) {
          document.getElementById('fileInput').value = '';
        }
        // Refresh content list
        fetchContent();
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${data.error || 'Upload failed'}` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `❌ Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-library-page">
      <div className="content-library-header">
        <h1>Content Library</h1>
        <p>Upload and manage training content for your trainees</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="upload-section">
        {/* Upload Type Selector */}
        <div className="upload-type-selector">
          <button
            className={`type-btn ${uploadType === 'file' ? 'active' : ''}`}
            onClick={() => setUploadType('file')}
          >
            <Upload size={20} />
            <span>Upload File</span>
          </button>
          <button
            className={`type-btn ${uploadType === 'link' ? 'active' : ''}`}
            onClick={() => setUploadType('link')}
          >
            <LinkIcon size={20} />
            <span>Add Link</span>
          </button>
          <button
            className={`type-btn ${uploadType === 'youtube' ? 'active' : ''}`}
            onClick={() => setUploadType('youtube')}
          >
            <Video size={20} />
            <span>YouTube Video</span>
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="upload-form">
          {/* File Upload */}
          {uploadType === 'file' && (
            <div className="form-group">
              <label>Select File</label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.mp3"
                required
              />
            </div>
          )}

          {/* Link URL */}
          {uploadType === 'link' && (
            <div className="form-group">
              <label>Link URL</label>
              <input
                type="url"
                placeholder="https://example.com/resource"
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                required
              />
            </div>
          )}

          {/* YouTube URL */}
          {uploadType === 'youtube' && (
            <div className="form-group">
              <label>YouTube URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                required
              />
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="Content title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Content description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Training">Training</option>
              <option value="Resource">Resource</option>
              <option value="Documentation">Documentation</option>
            </select>
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label>Deadline (Optional)</label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          {/* Acknowledgment Required */}
          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.ackRequired}
                onChange={(e) => setFormData({ ...formData, ackRequired: e.target.checked })}
              />
              <span>Require Acknowledgment</span>
            </label>
          </div>

          {/* Group Selection */}
          <div className="form-group">
            <label>Assign to Groups *</label>
            <div className="group-selector">
              {groups.length === 0 ? (
                <p className="no-groups">No groups available</p>
              ) : (
                groups.map(group => (
                  <label key={group._id} className="group-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group._id)}
                      onChange={() => handleGroupToggle(group._id)}
                    />
                    <span>{group.name || group.groupName || 'Unnamed Group'}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || selectedGroups.length === 0}
          >
            {loading ? 'Uploading...' : 'Upload Content'}
          </button>
        </form>
      </div>

      {/* Uploaded Content Section */}
      <div className="content-list-section">
        <h2>Uploaded Content</h2>
        {loadingContent ? (
          <p className="loading-text">Loading content...</p>
        ) : contentList.length === 0 ? (
          <p className="empty-text">No content uploaded yet. Upload your first content above!</p>
        ) : (
          <div className="content-grid">
            {contentList.map((content) => (
              <ContentCard
                key={content._id}
                content={content}
                onClick={(c) => console.log('Content clicked:', c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
