import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PredefinedTemplates from '../components/PredefinedTemplates.jsx';
import AddContentModal from '../components/AddContentModal';
import '../styles/TemplateManagement.css';

const AdminTemplateManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateData, setTemplateData] = useState(null);
  const [key, setKey] = useState(0); // Key to force re-render
  
  // Extract groupId from URL if we're in a group context
  const getGroupIdFromUrl = () => {
    const pathParts = location.pathname.split('/');
    const groupsIndex = pathParts.findIndex(part => part === 'groups');
    if (groupsIndex !== -1 && pathParts[groupsIndex + 1]) {
      return pathParts[groupsIndex + 1];
    }
    return null;
  };
  
  const currentGroupId = getGroupIdFromUrl();

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
    navigate('/admin/content');
  };

  return (
    <>
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
        groupId={currentGroupId}
      />
    </>
  );
};

export default AdminTemplateManagement;