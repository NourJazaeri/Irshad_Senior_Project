import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/RecognitionTemplate.css';

const RecognitionTemplate = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: 'Recognition & Achievement Highlights',
    description: 'Celebrate team achievements and recognize outstanding contributions',
    awardType: 'Employee of the Month',
    awardDate: '2025-10',
    employeeName: 'Sarah Johnson',
    employeeRole: 'Senior Software Engineer',
    achievementTitle: 'Outstanding Achievement',
    achievementDescription: `Sarah has consistently delivered exceptional work, leading the successful launch of three major features this quarter. Her dedication, innovative problem-solving, and collaborative spirit have been instrumental to our team's success.`,
    keyAccomplishments: `Key accomplishments:
• Led migration to new architecture
• Improved system performance by 40%
• Mentored junior developers`,
    congratulationsMessage: `Congratulations, Sarah! Your hard work and dedication inspire us all. Thank you for your outstanding contributions to our team! 🎉`,
    signatureTeam: 'The Leadership Team'
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  useEffect(() => {
    // Auto-resize textareas to fit content on initial load
    const textareas = document.querySelectorAll('.achievement-description, .key-accomplishments, .congratulations-message');
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
        type: 'Recognition & Achievement Highlights',
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
      <div className="recognition-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="recognition-header">
          <h1>{formData.title}</h1>
          <p>{formData.description}</p>
        </div>

        <div className="award-banner">
          <div className="trophy-icon">🏆</div>
          <input 
            type="text"
            className="award-title"
            value={formData.awardType}
            onChange={(e) => handleContentChange('awardType', e.target.value)}
            placeholder="Enter award type"
          />
          <input 
            type="month"
            className="award-date"
            value={formData.awardDate}
            onChange={(e) => handleContentChange('awardDate', e.target.value)}
          />
        </div>

        <div className="employee-card">
          <div className="employee-info">
            <div className="employee-avatar">
              <div className="avatar-icon">👤</div>
            </div>
            <div className="employee-details">
              <input 
                type="text"
                className="employee-name"
                value={formData.employeeName}
                onChange={(e) => handleContentChange('employeeName', e.target.value)}
                placeholder="Enter employee name"
              />
              <input 
                type="text"
                className="employee-role"
                value={formData.employeeRole}
                onChange={(e) => handleContentChange('employeeRole', e.target.value)}
                placeholder="Enter job title"
              />
            </div>
          </div>

          <div className="achievement-section">
            <input 
              type="text"
              className="achievement-title"
              value={formData.achievementTitle}
              onChange={(e) => handleContentChange('achievementTitle', e.target.value)}
              placeholder="Enter achievement title"
            />
            
            <textarea 
              className="achievement-description"
              value={formData.achievementDescription}
              onChange={(e) => {
                handleContentChange('achievementDescription', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Enter achievement description"
              rows={4}
            />

            <textarea 
              className="key-accomplishments"
              value={formData.keyAccomplishments}
              onChange={(e) => {
                handleContentChange('keyAccomplishments', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Enter key accomplishments"
              rows={3}
            />

            <textarea 
              className="congratulations-message"
              value={formData.congratulationsMessage}
              onChange={(e) => {
                handleContentChange('congratulationsMessage', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Enter congratulations message"
              rows={3}
            />

            <div className="signature">
              <span>— </span>
              <input 
                type="text"
                className="signature-team"
                value={formData.signatureTeam}
                onChange={(e) => handleContentChange('signatureTeam', e.target.value)}
                placeholder="Enter team/person name"
              />
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

export default RecognitionTemplate;