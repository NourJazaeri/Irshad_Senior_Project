import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/WelcomeIntroTemplate.css';

const WelcomeIntroTemplate = ({ onClose, onTemplateSaved }) => {
  const [templateData, setTemplateData] = useState({
    title: 'Welcome & Introduction Message',
    description: 'Create warm welcome messages for new team members or announcements',
    welcomeHeader: 'Welcome to Our Team!',
    greeting: 'Dear Team,',
    mainMessage: `We're thrilled to have you join us! This is the beginning of an exciting journey together, and we can't wait to see all the amazing things we'll accomplish as a team.

Your unique skills and perspective will be invaluable as we work towards our shared goals. We believe in fostering a collaborative`,
    highlightItems: [
      { id: 1, icon: 'calendar', text: 'First team meeting: Monday at 10 AM' },
      { id: 2, icon: 'chat', text: 'Questions? Email us at team@company.com' },
      { id: 3, icon: 'link', text: 'Access your onboarding portal: company.com/onboard' }
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

  const handleCompleteTemplate = () => {
    if (!currentUser) {
      setSaveMessage('Please log in to complete template');
      return;
    }

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
      setSaveMessage('Only Admin and Supervisor can complete templates');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const templateDataForModal = {
        type: 'welcome-intro',
        title: templateData.title,
        description: templateData.description,
        templateData: templateData
      };

      if (onTemplateSaved) {
        onTemplateSaved(templateDataForModal);
      }
    } catch (error) {
      console.error('Complete template error:', error);
      setSaveMessage('Error completing template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="welcome-intro-container">
      <div className="welcome-intro-modal" style={{ overflowY: 'auto', maxHeight: '90vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button 
          className="close-btn" 
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
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
                  <span className="highlight-icon" aria-hidden="true">
                    {item.icon === 'calendar' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="5" width="18" height="16" rx="3" stroke="#6366f1" strokeWidth="1.8"/>
                        <line x1="3" y1="9" x2="21" y2="9" stroke="#6366f1" strokeWidth="1.8"/>
                        <rect x="7" y="2" width="2" height="4" rx="1" fill="#6366f1"/>
                        <rect x="15" y="2" width="2" height="4" rx="1" fill="#6366f1"/>
                      </svg>
                    ) : item.icon === 'chat' ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6a4 4 0 014-4h8a4 4 0 014 4v6a4 4 0 01-4 4H9l-5 4v-4.5A4.5 4.5 0 014 12V6z" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.2"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14l-1.5 1.5a4 4 0 11-5.657-5.657L6.5 7.186" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M14 10l1.5-1.5a4 4 0 115.657 5.657L17.5 16.814" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
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

        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-md hover:scale-105"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
            onClick={handleCompleteTemplate}
            disabled={saving}
          >
            {saving ? 'Completing...' : 'Complete Template'}
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