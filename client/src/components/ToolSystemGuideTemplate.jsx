import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/ToolSystemGuideTemplate.css';

const ToolSystemGuideTemplate = ({ onClose, onTemplateSaved, templateData: initialTemplateData = null, isReadOnly = false }) => {
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
  const numberColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#84cc16', '#d946ef'];

  useEffect(() => {
    // Auto-resize textareas (title + description) to fit content on initial load
    const textareas = document.querySelectorAll('.step-description, .step-title');
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
    // Normalize whitespace to keep it on one line
    let newTitle = String(value).replace(/\s+/g, ' ').trim();
    
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
        contentType: 'template',
        category: 'Tool',
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
      title: templateData.title,
      description: templateData.description,
      type: 'tool-system-guide',
      contentType: 'template',
      templateData: templateData,
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
      <div className="tool-guide-container" style={{ overflowY: 'auto', maxHeight: '90vh', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button 
          className="close-btn" 
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
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
                  <div className="step-number" style={{ background: numberColors[index % numberColors.length] }}>{getStepNumber(index)}</div>
                  <input 
                    type="text"
                    className="step-title"
                    value={step.title}
                    onChange={(e) => handleStepTitleChange(step.id, e.target.value, index)}
                    placeholder="Enter step title"
                    size={Math.max((step.title || '').length, 10)}
                    style={{ width: 'auto', maxWidth: '100%' }}
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
                <span className="help-icon">
                  <svg width="20" height="20" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input 
                  type="text"
                  className="help-text"
                  value={templateData.helpEmail}
                  onChange={(e) => handleContentChange('helpEmail', e.target.value)}
                  placeholder="Enter email contact"
                />
              </div>
              
              <div className="help-item">
                <span className="help-icon">
                  <svg width="20" height="20" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                <input 
                  type="text"
                  className="help-text"
                  value={templateData.helpSlack}
                  onChange={(e) => handleContentChange('helpSlack', e.target.value)}
                  placeholder="Enter Slack channel"
                />
              </div>
              
              <div className="help-item">
                <span className="help-icon">
                  <svg width="20" height="20" fill="none" stroke="#059669" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
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

        {!isReadOnly && (
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
        )}

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