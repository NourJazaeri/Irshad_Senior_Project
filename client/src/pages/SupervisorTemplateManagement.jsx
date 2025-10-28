import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PredefinedTemplates from '../components/PredefinedTemplates.jsx';
import AddContentModal from '../components/AddContentModal';
import '../styles/TemplateManagement.css';

const SupervisorTemplateManagement = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [key, setKey] = useState(0); // Key to force re-render

  const handleTemplateSaved = (templateData) => {
    console.log('🔄 Template saved, opening content modal with data:', templateData);
    setTemplateData(templateData);
    setIsModalOpen(true);
    // Force re-render to close template form
    setKey(prev => prev + 1);
  };

  const handleContentAdded = (content) => {
    console.log('✅ Content added successfully:', content);
    setIsModalOpen(false);
    setTemplateData(null);
    // Optionally navigate to content management page
    navigate('/supervisor/content');
  };

  return (
    <div className="template-management">
      <PredefinedTemplates key={key} onTemplateSaved={handleTemplateSaved} />
      
      {/* Content Modal for completing template */}
      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTemplateData(null);
        }}
        onContentAdded={handleContentAdded}
        templateData={templateData}
      />
    </div>
  );
};

export default SupervisorTemplateManagement;