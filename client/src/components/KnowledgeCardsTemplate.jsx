import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import { Lightbulb, BarChart3, Zap, Target, TrendingUp, Wrench } from 'lucide-react';
import '../styles/KnowledgeCardsTemplate.css';

const KnowledgeCardsTemplate = ({ onClose, onTemplateSaved, isReadOnly = false, templateData: externalTemplateData = null }) => {
  const [templateData, setTemplateData] = useState(externalTemplateData || {
    title: 'Knowledge Cards/Quick Facts',
    description: 'Create quick reference cards with essential information',
    badgeText: 'Quick Reference Guide',
    subtitle: 'Essential information at your fingertips',
    facts: [
      {
        id: 1,
        iconName: 'Lightbulb',
        title: 'Quick Fact 1',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 2,
        iconName: 'BarChart3',
        title: 'Quick Fact 2',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 3,
        iconName: 'Zap',
        title: 'Quick Fact 3',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 4,
        iconName: 'Target',
        title: 'Quick Fact 4',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 5,
        iconName: 'TrendingUp',
        title: 'Quick Fact 5',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 6,
        iconName: 'Wrench',
        title: 'Quick Fact 6',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      }
    ]
  });

  // Update templateData when externalTemplateData changes
  useEffect(() => {
    if (externalTemplateData) {
      setTemplateData(externalTemplateData);
    }
  }, [externalTemplateData]);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  const handleContentChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFactChange = (factId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      facts: prev.facts.map(fact =>
        fact.id === factId ? { ...fact, [field]: value } : fact
      )
    }));
  };

  // Icon mapping function with colors
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Lightbulb': Lightbulb,
      'BarChart3': BarChart3,
      'Zap': Zap,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'Wrench': Wrench
    };
    
    const colorMap = {
      'Lightbulb': { bg: '#fef3c7', color: '#d97706' },
      'BarChart3': { bg: '#dbeafe', color: '#2563eb' },
      'Zap': { bg: '#fef3c7', color: '#f59e0b' },
      'Target': { bg: '#fce7f3', color: '#ec4899' },
      'TrendingUp': { bg: '#d1fae5', color: '#059669' },
      'Wrench': { bg: '#e0e7ff', color: '#6366f1' }
    };
    
    const Icon = iconMap[iconName] || Lightbulb;
    const colors = colorMap[iconName] || { bg: '#f3f4f6', color: '#6b7280' };
    
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: colors.bg
      }}>
        <Icon size={24} color={colors.color} />
      </div>
    );
  };

  const handleAddFact = () => {
    const newFactId = Math.max(...templateData.facts.map(f => f.id)) + 1;
    const newFact = {
      id: newFactId,
      iconName: 'Lightbulb',
      title: `Quick Fact ${newFactId}`,
      description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
    };

    setTemplateData(prev => ({
      ...prev,
      facts: [...prev.facts, newFact]
    }));
  };

  const handleRemoveFact = (factId) => {
    if (templateData.facts.length <= 1) {
      return; // Don't allow removing the last fact
    }

    setTemplateData(prev => ({
      ...prev,
      facts: prev.facts.filter(fact => fact.id !== factId)
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
        type: 'Knowledge Cards/Quick Facts',
        contentType: 'template',
        category: 'Training',
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
      type: 'knowledge-cards',
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
      <div className="knowledge-cards-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="header-section">
          <h1>
            {templateData.title}
          </h1>
          <p>
            {templateData.description}
          </p>
        </div>

        <div className="facts-section">
          <div className="facts-grid">
            {templateData.facts.map(fact => (
              <div key={fact.id} className="fact-card">
                {!isReadOnly && (
                  <button 
                    className="remove-fact-btn"
                    onClick={() => handleRemoveFact(fact.id)}
                    title="Remove fact"
                  >
                    ×
                  </button>
                )}
                <div className="fact-icon">
                  {getIconComponent(fact.iconName)}
                </div>
                <div 
                  className="fact-title"
                  contentEditable={!isReadOnly}
                  suppressContentEditableWarning={true}
                  onBlur={!isReadOnly ? (e) => handleFactChange(fact.id, 'title', e.target.textContent) : undefined}
                >
                  {fact.title}
                </div>
                <div 
                  className="fact-description"
                  contentEditable={!isReadOnly}
                  suppressContentEditableWarning={true}
                  onBlur={!isReadOnly ? (e) => handleFactChange(fact.id, 'description', e.target.textContent) : undefined}
                >
                  {fact.description}
                </div>
              </div>
            ))}
          </div>
          
          {!isReadOnly && (
            <div className="add-fact-section">
              <button className="add-fact-btn" onClick={handleAddFact}>
                <span className="plus-icon">+</span>
                Add Fact Card
              </button>
            </div>
          )}
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

export default KnowledgeCardsTemplate;