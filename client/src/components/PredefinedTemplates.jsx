import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TemplateForm from './TemplateForm.jsx';
import KnowledgeCardsTemplate from './KnowledgeCardsTemplate.jsx';
import RecognitionTemplate from './RecognitionTemplate.jsx';
import EventAnnouncementTemplate from './EventAnnouncementTemplate.jsx';
import ToolSystemGuideTemplate from './ToolSystemGuideTemplate.jsx';
import TaskRemindersBoardTemplate from './TaskRemindersBoardTemplate.jsx';
import WelcomeIntroTemplate from './WelcomeIntroTemplate.jsx';
import '../styles/template-library.css';

// Simplified template metadata - actual content is in individual components
const TEMPLATE_DATA = [
  {
    id: 1,
    title: 'Knowledge Cards/Quick Facts',
    description: 'Create quick reference cards with essential information',
    category: 'TEMPLATE',
    categoryColor: '#8B5CF6'
  },
  {
    id: 2,
    title: 'Recognition & Achievement Highlights',
    description: 'Showcase employee achievements and recognition',
    category: 'RECOGNITION',
    categoryColor: '#EC4899'
  },
  {
    id: 3,
    title: 'Event/Announcement Post',
    description: 'Design engaging event announcements and posts',
    category: 'ANNOUNCEMENT',
    categoryColor: '#F97316'
  },
  {
    id: 4,
    title: 'Tool/System Guide',
    description: 'Create step-by-step guides for tools and systems',
    category: 'TRAINING',
    categoryColor: '#10B981'
  },
  {
    id: 5,
    title: 'Task Reminders Board',
    description: 'Organize and track team tasks and deadlines',
    category: 'TASK MANAGEMENT',
    categoryColor: '#06B6D4'
  },
  {
    id: 6,
    title: 'Welcome & Introduction Message',
    description: 'Create welcoming messages for new team members',
    category: 'COMMUNICATION',
    categoryColor: '#8B5CF6'
  }
];

const PredefinedTemplates = ({ onTemplateSelect, onClose, onTemplateSaved }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  
  // Detect if we're in a group context
  const isInGroupContext = () => {
    const pathParts = location.pathname.split('/');
    const groupsIndex = pathParts.findIndex(part => part === 'groups');
    return groupsIndex !== -1 && pathParts[groupsIndex + 1];
  };
  
  const inGroupContext = isInGroupContext();

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateForm(true);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCloseForm = () => {
    setShowTemplateForm(false);
    setSelectedTemplate(null);
  };

  if (showTemplateForm && selectedTemplate) {
    // Use custom component for Knowledge Cards template
    if (selectedTemplate.id === 1) { // Knowledge Cards/Quick Facts
      return (
        <KnowledgeCardsTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use custom component for Recognition & Achievement Highlights
    if (selectedTemplate.id === 2) { // Recognition & Achievement Highlights
      return (
        <RecognitionTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use custom component for Event/Announcement Post
    if (selectedTemplate.id === 3) { // Event/Announcement Post
      return (
        <EventAnnouncementTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use custom component for Tool/System Guide
    if (selectedTemplate.id === 4) { // Tool/System Guide
      return (
        <ToolSystemGuideTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use custom component for Task Reminders Board
    if (selectedTemplate.id === 5) { // Task Reminders Board
      return (
        <TaskRemindersBoardTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use custom component for Welcome & Introduction Message
    if (selectedTemplate.id === 6) { // Welcome & Introduction Message
      return (
        <WelcomeIntroTemplate 
          onClose={handleCloseForm}
          onTemplateSaved={onTemplateSaved}
        />
      );
    }
    
    // Use regular form for other templates
    return (
      <TemplateForm 
        template={selectedTemplate}
        onClose={handleCloseForm}
        onTemplateSaved={onTemplateSaved}
      />
    );
  }

  return (
    <div className="template-library">
      {/* Template Grid Container */}
      <main className="container mx-auto" style={{ margin: '0', padding: '20px 12px', maxWidth: '1800px' }}>
        <div style={{ background: '#f9fafc', padding: '32px', borderRadius: '12px' }}>
          {/* Breadcrumb - only show if not in group context */}
          {!inGroupContext && (
            <div className="mb-6" style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
              <span 
                style={{ color: '#6b7280', cursor: 'pointer' }}
                onClick={() => {
                  const isSupervisor = window.location.pathname.includes('/supervisor');
                  const backRoute = isSupervisor ? '/supervisor/content' : '/admin/content';
                  navigate(backRoute);
                }}
              >
                Content Library
              </span>
              <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
              <span style={{ color: '#111827', fontWeight: '700' }}>
                Template Library
              </span>
            </div>
          )}

          <div className="template-grid">
        {TEMPLATE_DATA.map((template) => (
          <div key={template.id} className="template-card">
            <div className="template-card-content">
              {/* Top section with gradient background - Icon only */}
              <div className="template-top-section">
                <div className="template-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
              </div>
              
              {/* Bottom section with white background - All text content */}
              <div className="template-bottom-section">
                <div className="template-content">
                  <div 
                    className="template-category-tag"
                    style={{ backgroundColor: template.categoryColor }}
                  >
                    {template.category}
                  </div>
                  <h3 className="template-title">{template.title}</h3>
                  <p className="template-description">{template.description}</p>
                  
                  <button 
                    className="template-use-btn"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PredefinedTemplates;