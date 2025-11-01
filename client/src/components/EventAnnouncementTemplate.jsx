import React, { useState, useEffect } from 'react';
import { Flame, Target, Users, Award, Calendar, MapPin, X } from 'lucide-react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/EventAnnouncementTemplate.css';

const EventAnnouncementTemplate = ({ onClose, onTemplateSaved }) => {
  const [formData, setFormData] = useState({
    title: 'Event/Announcement Post',
    description: 'Design engaging event announcements and posts',
    eventTitle: 'Annual Company Conference 2025',
    eventDate: '2025-11-15',
    eventLocation: 'Grand Convention Center',
    eventDescription: 'Join us for our biggest event of the year! Network with industry leaders, attend inspiring workshops, and celebrate our collective achievements.',
    highlights: [
      { iconName: 'Flame', text: 'Keynote speakers' },
      { iconName: 'Target', text: 'Interactive workshops' },
      { iconName: 'Users', text: 'Networking sessions' },
      { iconName: 'Award', text: 'Awards ceremony' }
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

  // Icon mapping function
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Flame': Flame,
      'Target': Target,
      'Users': Users,
      'Award': Award
    };
    
    const colorMap = {
      'Flame': { bg: '#fef3c7', color: '#f59e0b' },
      'Target': { bg: '#fce7f3', color: '#ec4899' },
      'Users': { bg: '#dbeafe', color: '#2563eb' },
      'Award': { bg: '#d1fae5', color: '#059669' }
    };
    
    const Icon = iconMap[iconName] || Flame;
    const colors = colorMap[iconName] || { bg: '#f3f4f6', color: '#6b7280' };
    
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: colors.bg
      }}>
        <Icon size={20} color={colors.color} />
      </div>
    );
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
        contentType: 'template',
        category: 'Announcement',
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

  const handleCompleteTemplate = () => {
    if (!currentUser) {
      setSaveMessage('Please log in to complete template');
      return;
    }

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
      setSaveMessage('Only Admin and Supervisor can complete templates');
      return;
    }

    // Prepare template data for the content modal
    const templateDataForModal = {
      title: formData.title,
      description: formData.description,
      type: 'event-announcement',
      contentType: 'template',
      templateData: formData,
      assignedBy: currentUser.id,
      assignedByModel: userRole,
      // These will be filled in the content modal
      category: null,
      assignedTo_GroupID: null,
      assignedTo_depID: null,
      assignedTo_traineeID: null,
      deadline: null,
      ackRequired: false,
      quizData: null
    };

    console.log('🔄 Template prepared for completion:', templateDataForModal);
    
    // Close the template form
    onClose();
    
    // Pass the template data to open the content modal
    if (onTemplateSaved) {
      onTemplateSaved(templateDataForModal);
    }
  };

  return (
    <div className="template-form-overlay">
      <div className="event-container" style={{ overflowY: 'auto', maxHeight: '90vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button 
          className="close-btn" 
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
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
                <div className="meta-icon">
                  <Calendar size={18} color="#6366f1" />
                </div>
                <span className="meta-label">Date</span>
                <input 
                  type="date"
                  className="meta-input"
                  value={formData.eventDate}
                  onChange={(e) => handleContentChange('eventDate', e.target.value)}
                />
              </div>
              
              <div className="meta-item">
                <div className="meta-icon">
                  <MapPin size={18} color="#ec4899" />
                </div>
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
                    <div className="highlight-icon">
                      {getIconComponent(highlight.iconName)}
                    </div>
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
                <div className="audience-icon">
                  <Users size={24} color="#6366f1" />
                </div>
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

        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-md hover:scale-105"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
            onClick={handleCompleteTemplate}
            disabled={!currentUser || (userRole !== 'Admin' && userRole !== 'Supervisor')}
          >
            Complete Template
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