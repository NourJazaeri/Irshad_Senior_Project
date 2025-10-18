import React, { useState } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/KnowledgeCardsTemplate.css';

const KnowledgeCardsTemplate = ({ onClose }) => {
  const [templateData, setTemplateData] = useState({
    title: 'Knowledge Cards/Quick Facts',
    description: 'Create quick reference cards with essential information',
    badgeText: 'Quick Reference Guide',
    subtitle: 'Essential information at your fingertips',
    facts: [
      {
        id: 1,
        icon: '💡',
        title: 'Quick Fact 1',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 2,
        icon: '📊',
        title: 'Quick Fact 2',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 3,
        icon: '⚡',
        title: 'Quick Fact 3',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 4,
        icon: '🎯',
        title: 'Quick Fact 4',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 5,
        icon: '📈',
        title: 'Quick Fact 5',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      },
      {
        id: 6,
        icon: '🔧',
        title: 'Quick Fact 6',
        description: 'Important information or quick fact that team members should know. Keep it concise and actionable.'
      }
    ]
  });

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

  const handleAddFact = () => {
    const newFactId = Math.max(...templateData.facts.map(f => f.id)) + 1;
    const newFact = {
      id: newFactId,
      icon: '💡',
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
      <div className="knowledge-cards-container">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="header-section">
          <h1>
            {templateData.title}
          </h1>
          <p>
            {templateData.description}
          </p>
          
          <div className="quick-reference-badge">
            {templateData.badgeText}
          </div>
          <p className="subtitle">
            {templateData.subtitle}
          </p>
        </div>

        <div className="facts-section">
          <div className="facts-grid">
            {templateData.facts.map(fact => (
              <div key={fact.id} className="fact-card">
                <button 
                  className="remove-fact-btn"
                  onClick={() => handleRemoveFact(fact.id)}
                  title="Remove fact"
                >
                  ×
                </button>
                <div 
                  className="fact-icon"
                  contentEditable 
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFactChange(fact.id, 'icon', e.target.textContent)}
                >
                  {fact.icon}
                </div>
                <div 
                  className="fact-title"
                  contentEditable 
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFactChange(fact.id, 'title', e.target.textContent)}
                >
                  {fact.title}
                </div>
                <div 
                  className="fact-description"
                  contentEditable 
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFactChange(fact.id, 'description', e.target.textContent)}
                >
                  {fact.description}
                </div>
              </div>
            ))}
          </div>
          
          <div className="add-fact-section">
            <button className="add-fact-btn" onClick={handleAddFact}>
              <span className="plus-icon">+</span>
              Add Fact Card
            </button>
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

export default KnowledgeCardsTemplate;