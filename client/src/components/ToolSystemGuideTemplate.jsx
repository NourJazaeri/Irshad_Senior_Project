import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/ToolSystemGuideTemplate.css';

const ToolSystemGuideTemplate = ({ onClose }) => {
  const [templateData, setTemplateData] = useState({
    title: 'Tool/System Guide',
    description: 'Create step-by-step guides for tools and systems',
    guideTitle: 'Project Management Tool Guide',
    guideSubtitle: 'Learn how to use our project management system to track tasks, collaborate with your team, and deliver projects on time.',
    steps: [
      {
        id: 1,
        title: 'Step 1: Getting Started',
        description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
        completed: false
      },
      {
        id: 2,
        title: 'Step 2: Getting Started',
        description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
        completed: false
      },
      {
        id: 3,
        title: 'Step 3: Getting Started',
        description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
        completed: false
      },
      {
        id: 4,
        title: 'Step 4: Getting Started',
        description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
        completed: false
      },
      {
        id: 5,
        title: 'Step 5: Getting Started',
        description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
        completed: false
      }
    ],
    needHelpTitle: 'Need Help?',
    helpEmail: 'Email: support@company.com',
    helpSlack: 'Slack: #help-desk',
    helpDocs: 'Documentation: docs.company.com'
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  useEffect(() => {
    // Auto-resize textareas to fit content on initial load
    const textareas = document.querySelectorAll('.step-description');
    textareas.forEach(textarea => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }, []);

  const handleContentChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (stepId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  const handleStepTitleChange = (stepId, value, stepIndex) => {
    // Ensure the title always starts with the correct step number
    const stepNumber = stepIndex + 1;
    let newTitle = value;
    
    // If the title doesn't start with the correct step number, fix it
    if (!newTitle.startsWith(`Step ${stepNumber}:`)) {
      // Remove any existing "Step X:" prefix and add the correct one
      newTitle = newTitle.replace(/^Step \d+:\s*/, '');
      newTitle = `Step ${stepNumber}: ${newTitle}`;
    }

    setTemplateData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, title: newTitle } : step
      )
    }));
  };

  const handleAddStep = () => {
    const newStepId = Math.max(...templateData.steps.map(s => s.id)) + 1;
    const stepNumber = templateData.steps.length + 1;
    const newStep = {
      id: newStepId,
      title: `Step ${stepNumber}: New Step`,
      description: 'Detailed instructions for this step. Include specific actions, tips, and any important notes.',
      completed: false
    };

    setTemplateData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleRemoveStep = (stepId) => {
    if (templateData.steps.length <= 1) {
      return; // Don't allow removing the last step
    }

    setTemplateData(prev => {
      const updatedSteps = prev.steps.filter(step => step.id !== stepId);
      // Update step titles to reflect new numbering
      const renumberedSteps = updatedSteps.map((step, index) => ({
        ...step,
        title: step.title.replace(/^Step \d+:/, `Step ${index + 1}:`)
      }));
      
      return {
        ...prev,
        steps: renumberedSteps
      };
    });
  };

  // Function to renumber steps after add/remove
  const getStepNumber = (stepIndex) => {
    return stepIndex + 1;
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
        type: 'Tool/System Guide',
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
      setSaveMessage('Error saving content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-form-overlay">
      <div className="tool-guide-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="tool-guide-header">
          <h1>{templateData.title}</h1>
          <p>{templateData.description}</p>
        </div>

        <div className="guide-content">
          <div className="guide-title-section">
            <input 
              type="text"
              className="guide-main-title"
              value={templateData.guideTitle}
              onChange={(e) => handleContentChange('guideTitle', e.target.value)}
              placeholder="Enter guide title"
            />
            <textarea 
              className="guide-subtitle"
              value={templateData.guideSubtitle}
              onChange={(e) => {
                handleContentChange('guideSubtitle', e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Enter guide description"
              rows={2}
            />
          </div>

          <div className="steps-section">
            {templateData.steps.map((step, index) => (
              <div key={step.id} className="step-item">
                <div className="step-header">
                  <div className="step-number">{getStepNumber(index)}</div>
                  <input 
                    type="text"
                    className="step-title"
                    value={step.title}
                    onChange={(e) => handleStepTitleChange(step.id, e.target.value, index)}
                    placeholder="Enter step title"
                  />
                  <button 
                    className="remove-step-btn"
                    onClick={() => handleRemoveStep(step.id)}
                    title="Remove step"
                  >
                    ×
                  </button>
                </div>
                
                <textarea 
                  className="step-description"
                  value={step.description}
                  onChange={(e) => {
                    handleStepChange(step.id, 'description', e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="Enter step instructions"
                  rows={2}
                />
                
                <div className="step-checkbox">
                  <input 
                    type="checkbox"
                    id={`step-${step.id}`}
                    checked={step.completed}
                    onChange={(e) => handleStepChange(step.id, 'completed', e.target.checked)}
                  />
                  <label htmlFor={`step-${step.id}`}>Mark as completed</label>
                </div>
              </div>
            ))}
            
            <div className="add-step-section">
              <button className="add-step-btn" onClick={handleAddStep}>
                <span className="plus-icon">+</span>
                Add Step
              </button>
            </div>
          </div>

          <div className="help-section">
            <input 
              type="text"
              className="help-title"
              value={templateData.needHelpTitle}
              onChange={(e) => handleContentChange('needHelpTitle', e.target.value)}
              placeholder="Enter help section title"
            />
            
            <div className="help-items">
              <div className="help-item">
                <span className="help-icon">📧</span>
                <input 
                  type="text"
                  className="help-text"
                  value={templateData.helpEmail}
                  onChange={(e) => handleContentChange('helpEmail', e.target.value)}
                  placeholder="Enter email contact"
                />
              </div>
              
              <div className="help-item">
                <span className="help-icon">💬</span>
                <input 
                  type="text"
                  className="help-text"
                  value={templateData.helpSlack}
                  onChange={(e) => handleContentChange('helpSlack', e.target.value)}
                  placeholder="Enter Slack channel"
                />
              </div>
              
              <div className="help-item">
                <span className="help-icon">📖</span>
                <input 
                  type="text"
                  className="help-text"
                  value={templateData.helpDocs}
                  onChange={(e) => handleContentChange('helpDocs', e.target.value)}
                  placeholder="Enter documentation link"
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

export default ToolSystemGuideTemplate;