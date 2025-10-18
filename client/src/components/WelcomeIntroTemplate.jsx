import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/WelcomeIntroTemplate.css';

const WelcomeIntroTemplate = ({ onClose }) => {
  const [templateData, setTemplateData] = useState({
    title: 'Welcome & Introduction Message',
    description: 'Create warm welcome messages for new team members or announcements',
    welcomeHeader: 'Welcome to Our Team!',
    greeting: 'Dear Team,',
    mainMessage: `We're thrilled to have you join us! This is the beginning of an exciting journey together, and we can't wait to see all the amazing things we'll accomplish as a team.

Your unique skills and perspective will be invaluable as we work towards our shared goals. We believe in fostering a collaborative`,
    highlightItems: [
      {
        id: 1,
        icon: '📅',
        text: 'First team meeting: Monday at 10 AM'
      },
      {
        id: 2,
        icon: '💬',
        text: 'Questions? Email us at team@company.com'
      },
      {
        id: 3,
        icon: '🔗',
        text: 'Access your onboarding portal: company.com/onboard'
      }
    ],
    closingMessage: 'Welcome aboard! We\'re excited to have you as part of our team.',
    signature: 'Best regards,',
    signatureName: 'The Leadership Team',
    date: '10/18/2025'
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  // Auto-resize textarea function
  useEffect(() => {
    const autoResize = (textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    const textareas = document.querySelectorAll('.auto-resize');
    textareas.forEach(textarea => {
      autoResize(textarea);
      textarea.addEventListener('input', () => autoResize(textarea));
    });

    return () => {
      textareas.forEach(textarea => {
        textarea.removeEventListener('input', () => autoResize(textarea));
      });
    };
  }, []);

  const handleContentChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHighlightChange = (itemId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      highlightItems: prev.highlightItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
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
        title: templateData.title,
        description: templateData.description,
        type: 'Welcome & Introduction Message',
        templateData: templateData,
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
      setSaveMessage('Failed to save content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="welcome-intro-container">
      <div className="welcome-intro-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="welcome-intro-header">
          <h1>Welcome & Introduction Message</h1>
          <p>Create warm welcome messages for new team members or announcements</p>
        </div>

        <div className="welcome-card">
          <div className="welcome-card-header">
            <input
              type="text"
              className="welcome-header-input"
              value={templateData.welcomeHeader}
              onChange={(e) => handleContentChange('welcomeHeader', e.target.value)}
              placeholder="Enter welcome header"
            />
            <div className="purple-underline"></div>
          </div>

          <div className="welcome-content">
            <input
              type="text"
              className="greeting-input"
              value={templateData.greeting}
              onChange={(e) => handleContentChange('greeting', e.target.value)}
              placeholder="Enter greeting"
            />

            <textarea
              className="main-message auto-resize"
              value={templateData.mainMessage}
              onChange={(e) => handleContentChange('mainMessage', e.target.value)}
              placeholder="Enter main welcome message"
            />

            <div className="highlight-section">
              {templateData.highlightItems.map(item => (
                <div key={item.id} className="highlight-item">
                  <input
                    type="text"
                    className="highlight-icon"
                    value={item.icon}
                    onChange={(e) => handleHighlightChange(item.id, 'icon', e.target.value)}
                    placeholder="📝"
                  />
                  <input
                    type="text"
                    className="highlight-text"
                    value={item.text}
                    onChange={(e) => handleHighlightChange(item.id, 'text', e.target.value)}
                    placeholder="Enter highlight text"
                  />
                </div>
              ))}
            </div>

            <textarea
              className="closing-message auto-resize"
              value={templateData.closingMessage}
              onChange={(e) => handleContentChange('closingMessage', e.target.value)}
              placeholder="Enter closing message"
            />

            <div className="signature-section">
              <input
                type="text"
                className="signature-input"
                value={templateData.signature}
                onChange={(e) => handleContentChange('signature', e.target.value)}
                placeholder="Enter signature"
              />
              
              <div className="signature-details">
                <input
                  type="text"
                  className="signature-name"
                  value={templateData.signatureName}
                  onChange={(e) => handleContentChange('signatureName', e.target.value)}
                  placeholder="Enter name/title"
                />
                <input
                  type="date"
                  className="signature-date"
                  value={templateData.date}
                  onChange={(e) => handleContentChange('date', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={handleSaveContent}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeIntroTemplate;