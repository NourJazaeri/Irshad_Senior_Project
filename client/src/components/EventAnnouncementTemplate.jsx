import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/EventAnnouncementTemplate.css';

const EventAnnouncementTemplate = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: 'Event/Announcement Post',
    description: 'Design engaging event announcements and posts',
    eventTitle: 'Annual Company Conference 2025',
    eventDate: '2025-11-15',
    eventLocation: 'Grand Convention Center',
    eventDescription: 'Join us for our biggest event of the year! Network with industry leaders, attend inspiring workshops, and celebrate our collective achievements.',
    highlights: [
      { icon: '🔥', text: 'Keynote speakers' },
      { icon: '🎯', text: 'Interactive workshops' },
      { icon: '🤝', text: 'Networking sessions' },
      { icon: '🎉', text: 'Awards ceremony' }
    ],
    audienceInfo: 'Open to all employees'
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  useEffect(() => {
    // Auto-resize textareas to fit content on initial load
    const textareas = document.querySelectorAll('.event-description');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, []);

  const handleContentChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHighlightChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.map((highlight, i) => 
        i === index ? { ...highlight, [field]: value } : highlight
      )
    }));
  };

  const handleSaveContent = async () => {
    if (!currentUser) {
      setSaveMessage('Please log in to save content');
      return;
    }

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
      setSaveMessage('Only Admin and Supervisor can save content');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const contentData = {
        title: formData.title,
        description: formData.description,
        type: 'Event/Announcement Post',
        templateData: formData,
        assignedBy: currentUser.id,
        assignedByModel: userRole,
        deadline: null,
        ackRequired: false,
        assignedTo_GroupID: null,
        assignedTo_depID: null,
        assignedTo_traineeID: null
      };

      const result = await saveContent(contentData);

      if (result.success) {
        setSaveMessage('Content saved successfully!');
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(result.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-form-overlay">
      <div className="event-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="event-header">
          <h1>{formData.title}</h1>
          <p>{formData.description}</p>
        </div>

        <div className="event-card">
          <div className="event-card-inner">
            <input 
              type="text"
              className="event-title"
              value={formData.eventTitle}
              onChange={(e) => handleContentChange('eventTitle', e.target.value)}
              placeholder="Enter event title"
            />
            
            <div className="event-meta">
              <div className="meta-item">
                <span className="meta-icon">📅</span>
                <span className="meta-label">Date</span>
                <input 
                  type="date"
                  className="meta-input"
                  value={formData.eventDate}
                  onChange={(e) => handleContentChange('eventDate', e.target.value)}
                />
              </div>
              
              <div className="meta-item">
                <span className="meta-icon">📍</span>
                <span className="meta-label">Location</span>
                <input 
                  type="text"
                  className="meta-input location-input"
                  value={formData.eventLocation}
                  onChange={(e) => handleContentChange('eventLocation', e.target.value)}
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="event-details-section">
              <h3>EVENT DETAILS</h3>
              
              <textarea 
                className="event-description"
                value={formData.eventDescription}
                onChange={(e) => {
                  handleContentChange('eventDescription', e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Enter event description"
                rows={3}
              />

              <div className="event-highlights">
                {formData.highlights.map((highlight, index) => (
                  <div key={index} className="highlight-item">
                    <input 
                      type="text"
                      className="highlight-icon"
                      value={highlight.icon}
                      onChange={(e) => handleHighlightChange(index, 'icon', e.target.value)}
                      placeholder="🔥"
                    />
                    <input 
                      type="text"
                      className="highlight-text"
                      value={highlight.text}
                      onChange={(e) => handleHighlightChange(index, 'text', e.target.value)}
                      placeholder="Enter highlight"
                    />
                  </div>
                ))}
              </div>

              <div className="audience-section">
                <span className="audience-icon">👥</span>
                <input 
                  type="text"
                  className="audience-text"
                  value={formData.audienceInfo}
                  onChange={(e) => handleContentChange('audienceInfo', e.target.value)}
                  placeholder="Enter audience information"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={handleSaveContent}
            disabled={saving || !currentUser || (userRole !== 'Admin' && userRole !== 'Supervisor')}
          >
            {saving ? 'Saving...' : 'Submit'}
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAnnouncementTemplate;