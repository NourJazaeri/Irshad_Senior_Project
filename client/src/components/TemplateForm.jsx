import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/TemplateForm.css';

const TemplateForm = ({ template, onClose, onTemplateSaved }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(template.templateData);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFieldLabel = (field) => {
    // Convert camelCase to readable labels
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Url$/, 'URL');
  };

  const getFieldPlaceholder = (field) => {
    return template.placeholders?.[field] || `Enter ${getFieldLabel(field).toLowerCase()}`;
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
      // Prepare template data to pass to the content form
      const templateData = {
        title: formData.title || template.title,
        description: formData.description || template.description,
        type: template.type,
        contentType: 'template',
        templateData: formData,
        assignedBy: currentUser.id,
        assignedByModel: userRole,
        // These will be filled in the content form
        category: null,
        assignedTo_GroupID: null,
        assignedTo_depID: null,
        assignedTo_traineeID: null,
        deadline: null,
        ackRequired: false,
        quizData: null
      };

      console.log('🔄 Template data prepared:', templateData);
      
      // Close the template form
      onClose();
      
      // Pass the template data to the parent component to open the content modal
      if (onTemplateSaved) {
        onTemplateSaved(templateData);
      }
      
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Error preparing template for completion');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field, value) => {
    // Skip rendering certain fields
    if (field === 'type') return null;

    switch (field) {
      case 'title':
        return (
          <div key={field} className="form-field">
            <label htmlFor={field}>{getFieldLabel(field)}</label>
            <input
              type="text"
              id={field}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={getFieldPlaceholder(field)}
              className="form-input"
            />
          </div>
        );

      case 'description':
      case 'overview':
      case 'tasks':
      case 'steps':
      case 'achievement':
        return (
          <div key={field} className="form-field">
            <label htmlFor={field}>{getFieldLabel(field)}</label>
            <textarea
              id={field}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={getFieldPlaceholder(field)}
              className="form-textarea"
              rows={4}
            />
          </div>
        );

      case 'deadline':
      case 'eventDate':
      case 'startDate':
        return (
          <div key={field} className="form-field">
            <label htmlFor={field}>{getFieldLabel(field)}</label>
            <input
              type="date"
              id={field}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="form-input"
            />
          </div>
        );

      case 'ackRequired':
        return (
          <div key={field} className="form-field form-checkbox">
            <label htmlFor={field} className="checkbox-label">
              <input
                type="checkbox"
                id={field}
                checked={value}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                className="form-checkbox-input"
              />
              <span>Required</span>
            </label>
          </div>
        );

      default:
        return (
          <div key={field} className="form-field">
            <label htmlFor={field}>{getFieldLabel(field)}</label>
            <input
              type="text"
              id={field}
              value={value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={getFieldPlaceholder(field)}
              className="form-input"
            />
          </div>
        );
    }
  };

  return (
    <div className="template-form-overlay">
      <div className="template-form-container">
        <div className="template-form-header">
          <h2>{template.title}</h2>
          <p className="template-description">{template.description}</p>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="template-form-content">
          <form className="template-form">
            {Object.entries(formData).map(([field, value]) => 
              renderField(field, value)
            )}
          </form>

          <div className="form-actions">
            <button 
              type="button" 
              className="save-content-btn" 
              onClick={handleCompleteTemplate}
              disabled={!currentUser || (userRole !== 'Admin' && userRole !== 'Supervisor')}
            >
              Complete Template
            </button>
            <button type="button" className="clear-btn" onClick={() => setFormData(template.templateData)}>
              Clear All
            </button>
          </div>
          
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('successfully') ? 'success' : 'error'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;