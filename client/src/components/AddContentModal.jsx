import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, LayoutTemplate, Users, Clock, CheckCircle, Bell, CalendarIcon, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { uploadContent, createLinkContent, createTemplateContent, saveContentFromTemplate, getTemplates, getDepartments } from '../services/content';
import { getSupervisorGroups, getSupervisorGroupDetails } from '../services/api';
import '../styles/content-modal.css';
import '../styles/content-modal-enhanced.css';

// Content types
const CONTENT_TYPES = {
  FILE: 'file',
  LINK: 'link', 
  TEMPLATE: 'template'
};

const STEPS = {
  UPLOAD: 1,
  ASSIGN: 2,
  DEADLINE: 3,
  MCQ: 4,
  PUBLISH: 5
};

const categories = [
    'Policy',
    'Procedure',
    'Handbook',
  'Training',
    'Form',
    'Tool',
    'Announcement',
  'Compliance',
  'Resource',
  'Guidelines',
  'General',
];

const mockDepartments = [
  { id: '1', name: 'Human Resources', memberCount: 12 },
  { id: '2', name: 'Engineering', memberCount: 25 },
  { id: '3', name: 'Marketing', memberCount: 8 },
  { id: '4', name: 'Sales', memberCount: 15 },
  { id: '5', name: 'Finance', memberCount: 6 },
];

const AddContentModal = ({ isOpen, onClose, onContentAdded, editMode = false, editContent = null, templateData = null, groupId = null, traineeId = null }) => {
  const navigate = useNavigate();
  const [showContentOptions, setShowContentOptions] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [contentType, setContentType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableTrainees, setAvailableTrainees] = useState([]);
  const [userRole, setUserRole] = useState('Admin');
  const [urlValidationError, setUrlValidationError] = useState('');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [urlValidationStatus, setUrlValidationStatus] = useState(null); // 'valid', 'invalid', 'checking'
  const [showFileReplaceConfirm, setShowFileReplaceConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    contentType: '',
    file: null,
    link: '',
    selectedDepartments: [],
    selectedGroups: [],
    selectedTrainees: [],
    deadline: undefined,
    ackRequired: false,
    mcqs: [],
  });

  // Function to get steps based on user role
  const getSteps = () => [
    { number: 1, label: 'Upload/Select Content', icon: Upload },
    { number: 2, label: userRole === 'Supervisor' ? 'Assign to Groups' : 'Assign Departments', icon: Users },
    { number: 3, label: 'Set Deadline', icon: Clock },
    { number: 4, label: 'Add MCQs', icon: CheckCircle },
    { number: 5, label: 'Publish', icon: Bell },
  ];
  
  const steps = getSteps();

  // Load templates and departments when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 MODAL OPENED - editMode:', editMode, 'editContent:', editContent, 'templateData:', templateData, 'groupId:', groupId, 'traineeId:', traineeId);
      loadInitialData();
      
      // If traineeId is provided, pre-select it
      if (traineeId) {
        setFormData(prev => ({
          ...prev,
          selectedTrainees: [traineeId]
        }));
      }
      
      // If in edit mode, populate form with existing content data
      if (editMode && editContent) {
        populateEditForm();
      }
      
      // If template data is provided, pre-fill the form
      if (templateData) {
        populateTemplateForm();
      }
    }
  }, [isOpen, editMode, editContent, templateData, groupId, traineeId]);

  // Populate form with existing content data for editing
  const populateEditForm = () => {
    if (!editContent) {
      console.log('⚠️ No editContent provided');
      return;
    }
    
    console.log('🔄 Populating edit form with content:', editContent);
    console.log('🔄 Edit mode:', editMode);
    console.log('🔄 Content ID:', editContent._id);
    
    // Determine content type based on existing content
    let contentType = 'file'; // default
    
    // Check the actual content type first
    if (editContent.contentType === 'link') {
      contentType = 'link';
    } else if (editContent.contentType === 'template') {
      contentType = 'template';
    } else if (editContent.contentType && ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'csv'].includes(editContent.contentType)) {
      contentType = 'file'; // Use 'file' for form logic, but we'll handle the specific type in the update
    } else if (editContent.contentType === 'file') {
      contentType = 'file';
    } else if (editContent.templateData) {
      contentType = 'template';
    } else if (editContent.contentUrl && !editContent.contentUrl.includes('supabase') && !editContent.contentUrl.includes('youtube.com') && !editContent.contentUrl.includes('youtu.be')) {
      // Only treat as link if it's not a file URL (supabase) and not a YouTube URL
      contentType = 'link';
    }
    
    console.log('📝 Detected content type:', contentType);
    console.log('📝 EditContent details:', {
      contentType: editContent.contentType,
      contentUrl: editContent.contentUrl,
      templateData: editContent.templateData
    });
    
    setContentType(contentType);
    setFormData({
      title: editContent.title || '',
      description: editContent.description || '',
      category: editContent.category || '',
      contentType: contentType,
      file: null, // Don't pre-populate file
        link: (editContent.contentType === 'link' || editContent.contentType === 'template') ? (editContent.contentUrl || editContent.link || '') : '',
      selectedDepartments: editContent.assignedTo_depID || [],
      selectedGroups: editContent.assignedTo_GroupID ? [editContent.assignedTo_GroupID] : [],
      selectedTrainees: editContent.assignedTo_traineeID ? [editContent.assignedTo_traineeID] : [],
      deadline: editContent.deadline ? new Date(editContent.deadline) : undefined,
      ackRequired: editContent.ackRequired || false,
      mcqs: editContent.mcqs || [],
    });
    setShowContentOptions(false);
    
    console.log('✅ Form populated with data:', {
      title: editContent.title,
      category: editContent.category,
      contentType: contentType,
      link: editContent.contentUrl,
      selectedDepartments: editContent.assignedTo_depID
    });
  };

  // Populate form with template data
  const populateTemplateForm = () => {
    if (!templateData) {
      console.log('⚠️ No templateData provided');
      return;
    }

    console.log('📝 Populating form with template data:', templateData);
    
    setFormData({
      title: templateData.title || '',
      description: templateData.description || '',
      category: templateData.category || '',
      contentType: templateData.contentType || 'template',
      file: null,
      link: templateData.contentUrl || '',
      selectedDepartments: templateData.assignedTo_depID || [],
      selectedGroups: templateData.assignedTo_GroupID ? [templateData.assignedTo_GroupID] : [],
      selectedTrainees: templateData.assignedTo_traineeID ? [templateData.assignedTo_traineeID] : [],
      deadline: templateData.deadline ? new Date(templateData.deadline) : undefined,
      ackRequired: templateData.ackRequired || false,
      mcqs: templateData.quizData || [],
      templateData: templateData.templateData || {}
    });
    
    setContentType('template');
    setShowContentOptions(false);
    setCurrentStep(1); // Start from the beginning (Upload/Select Content step)
    
    console.log('✅ Form populated with template data:', {
      title: templateData.title,
      category: templateData.category,
      contentType: 'template'
    });
  };

  const loadInitialData = async () => {
    try {
      console.log('🔄 Loading initial data...');
      
      // Get current user role from localStorage
      const currentUserStr = localStorage.getItem('currentUser');
      let currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      if (!currentUser || !currentUser.role) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = { role: payload.role };
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        }
      }
      const role = currentUser?.role || 'Admin';
      setUserRole(role);
      
      console.log('👤 User role:', role);
      
             if (role === 'Supervisor') {
         // If groupId is provided, only load that specific group and its trainees
         if (groupId) {
           console.log('🎯 Loading specific group:', groupId);
           try {
             const groupDetails = await getSupervisorGroupDetails(groupId);
             if (groupDetails && groupDetails.group) {
               // Set only this group as available
               setAvailableGroups([{
                 _id: groupDetails.group._id,
                 groupName: groupDetails.group.groupName,
                 traineesCount: groupDetails.group.membersCount || 0
               }]);
               console.log('✅ Specific group loaded:', groupDetails.group.groupName);
               
               // Set only trainees from this group
               if (groupDetails.members) {
                 const trainees = groupDetails.members.map(trainee => ({
                   ...trainee,
                   groupId: groupDetails.group._id,
                   groupName: groupDetails.group.groupName
                 }));
                 setAvailableTrainees(trainees);
                 console.log('✅ Trainees loaded for specific group:', trainees.length);
               }
               
               // Pre-select the group
               setFormData(prev => ({
                 ...prev,
                 selectedGroups: [groupId]
               }));
             }
           } catch (err) {
             console.error(`Error loading group ${groupId}:`, err);
             setError('Failed to load group details');
           }
         } else {
           // Load all groups for supervisor
           const groupsResponse = await getSupervisorGroups();
           console.log('👥 Groups response:', groupsResponse);
           
           if (groupsResponse && groupsResponse.items) {
             setAvailableGroups(groupsResponse.items);
             console.log('✅ Groups loaded:', groupsResponse.items.length);
             
             // For each group, fetch trainees
             const allTrainees = [];
             for (const group of groupsResponse.items) {
               try {
                 const groupDetails = await getSupervisorGroupDetails(group._id);
                 if (groupDetails && groupDetails.members) {
                   const traineesWithGroupId = groupDetails.members.map(trainee => ({
                     ...trainee,
                     groupId: group._id,
                     groupName: group.groupName
                   }));
                   allTrainees.push(...traineesWithGroupId);
                 }
               } catch (err) {
                 console.error(`Error loading trainees for group ${group._id}:`, err);
               }
             }
             setAvailableTrainees(allTrainees);
             console.log('✅ Trainees loaded:', allTrainees.length);
           }
         }
         
         // Also load templates
         const templatesResponse = await getTemplates();
         if (templatesResponse.ok) {
           setAvailableTemplates(templatesResponse.templates);
         }
       } else {
        // Load departments for admin
        const [templatesResponse, departmentsResponse] = await Promise.all([
          getTemplates(),
          getDepartments()
        ]);
        
        console.log('📋 Templates response:', templatesResponse);
        console.log('🏢 Departments response:', departmentsResponse);
        
        if (templatesResponse.ok) {
          setAvailableTemplates(templatesResponse.templates);
          console.log('✅ Templates loaded:', templatesResponse.templates.length);
        }
        
        if (departmentsResponse.ok) {
          setAvailableDepartments(departmentsResponse.departments);
          console.log('✅ Departments loaded:', departmentsResponse.departments.length);
        } else {
          console.error('❌ Failed to load departments:', departmentsResponse);
          setError('Failed to load departments');
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load initial data');
    }
  };

  // URL validation function
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Function to validate if URL actually exists and is accessible
  const validateUrlExists = async (url) => {
    if (!url || !isValidUrl(url)) {
      return false;
    }

    try {
      setIsValidatingUrl(true);
      setUrlValidationStatus('checking');
      
      // Use a CORS proxy or direct fetch with proper headers
      const response = await fetch(url, {
        method: 'HEAD', // Only check if resource exists, don't download
        mode: 'no-cors', // This allows cross-origin requests but limits response access
        cache: 'no-cache'
      });
      
      // With no-cors mode, we can't access response.status, but if it doesn't throw, it likely exists
      setUrlValidationStatus('valid');
      setUrlValidationError('');
      return true;
    } catch (error) {
      console.log('URL validation error:', error);
      
      // For YouTube URLs, try a different approach
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        try {
          const videoId = extractYouTubeVideoId(url);
          if (videoId) {
            // For YouTube, we'll assume it's valid if we can extract a proper video ID
            // The actual video existence will be checked when the user tries to view it
            setUrlValidationStatus('valid');
            setUrlValidationError('');
            return true;
          }
        } catch (youtubeError) {
          console.log('YouTube validation error:', youtubeError);
        }
      }
      
      setUrlValidationStatus('invalid');
      setUrlValidationError('This URL is not accessible or does not exist');
      return false;
    } finally {
      setIsValidatingUrl(false);
    }
  };

  // Extract YouTube video ID (same as server-side function)
  const extractYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle URL input change with real-time validation
  const handleLinkChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, link: url });
    
    // Clear validation error when user starts typing
    if (urlValidationError) {
      setUrlValidationError('');
    }
    setUrlValidationStatus(null);
    
    // Validate URL format first
    if (url && !isValidUrl(url)) {
      setUrlValidationError('Please enter a valid URL (e.g., https://example.com)');
      setUrlValidationStatus('invalid');
    } else if (url && isValidUrl(url)) {
      // For YouTube URLs, validate immediately since we can check the video ID format
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(url);
        if (videoId) {
          setUrlValidationStatus('valid');
          setUrlValidationError('');
        } else {
          setUrlValidationStatus('invalid');
          setUrlValidationError('Invalid YouTube URL format');
        }
      } else {
        // For other URLs, validate if they exist (with debounce)
        const timeoutId = setTimeout(() => {
          validateUrlExists(url);
        }, 1000); // Wait 1 second after user stops typing
        
        return () => clearTimeout(timeoutId);
      }
    }
  };

  const handleNext = async () => {
    // Validation for step 1
    if (currentStep === 1) {
      if (!formData.title || !formData.category) {
        alert('Please fill in all required fields');
        return;
      }
      if (contentType === 'file' && !formData.file && !editMode) {
        alert('Please upload a file');
        return;
      }
      if (contentType === 'link') {
        if (!formData.link) {
          alert('Please enter a URL');
          return;
        }
        if (!isValidUrl(formData.link)) {
          setUrlValidationError('Please enter a valid URL (e.g., https://example.com)');
          alert('Please enter a valid URL (e.g., https://example.com)');
          return;
        }
        if (urlValidationStatus === 'invalid') {
          alert('This URL is not accessible or does not exist. Please check the URL and try again.');
          return;
        }
        if (urlValidationStatus === 'checking') {
          alert('Please wait while we validate the URL...');
          return;
        }
        if (urlValidationStatus !== 'valid') {
          // If validation hasn't completed yet, trigger it now
          const isValid = await validateUrlExists(formData.link);
          if (!isValid) {
            alert('This URL is not accessible or does not exist. Please check the URL and try again.');
            return;
          }
        }
      }
    }

    // Validation for step 2
    if (currentStep === 2) {
      if (
        formData.selectedDepartments.length === 0 &&
        formData.selectedGroups.length === 0 &&
        formData.selectedTrainees.length === 0
      ) {
        alert('Please assign to at least one department, group, or trainee');
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    console.log('🚀 HANDLE PUBLISH STARTED');
    console.log('🚀 Edit mode:', editMode);
    console.log('🚀 Content type:', contentType);
    console.log('🚀 Form data file:', formData.file);
    console.log('🚀 Form data:', formData);
    
    setIsLoading(true);
    setError(null);

    try {
      const contentData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        deadline: formData.deadline?.toISOString(),
        ackRequired: formData.ackRequired,
        assignedTo_depID: formData.selectedDepartments,
        assignedTo_GroupID: formData.selectedGroups.length > 0 ? formData.selectedGroups[0] : null,
        assignedTo_traineeID: formData.selectedTrainees.length > 0 ? formData.selectedTrainees[0] : null,
      };

      let response;

      if (editMode) {
        // Handle content update
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        if (formData.file) {
          // Update with new file
          console.log('🔄 FILE UPLOAD PATH - Updating with new file');
          console.log('🔄 FILE UPLOAD - ContentType value:', contentType);
          console.log('🔄 FILE UPLOAD - FormData contentType:', formData.contentType);
          console.log('🔄 FILE UPLOAD - EditContent contentType:', editContent.contentType);
          
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.file);
          uploadFormData.append('title', formData.title);
          uploadFormData.append('description', formData.description);
          uploadFormData.append('category', formData.category);
          if (formData.deadline) {
            uploadFormData.append('deadline', formData.deadline.toISOString());
          }
          uploadFormData.append('ackRequired', formData.ackRequired);
          uploadFormData.append('assignedTo_depID', JSON.stringify(formData.selectedDepartments));
          if (formData.selectedGroups.length > 0) {
            uploadFormData.append('assignedTo_GroupID', JSON.stringify(formData.selectedGroups));
          }
          if (formData.selectedTrainees.length > 0) {
            uploadFormData.append('assignedTo_traineeID', JSON.stringify(formData.selectedTrainees));
          }

          response = await fetch(`${API_BASE}/api/content/${editContent._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: uploadFormData
          });
        } else {
          // Update without file change
          console.log('🔄 NO FILE PATH - Updating without file change');
          console.log('🔄 NO FILE - ContentType value:', contentType);
          console.log('🔄 NO FILE - FormData contentType:', formData.contentType);
          console.log('🔄 NO FILE - EditContent contentType:', editContent.contentType);
          
          const updateData = {
            ...contentData,
            // Only send contentType for link and template updates, not for file updates
            ...(contentType === 'link' && { contentType: 'link' }),
            ...(contentType === 'template' && { contentType: 'template' }),
            linkUrl: contentType === 'link' ? formData.link : undefined,
          };

          // For link content, also update the contentUrl
          if (contentType === 'link' && formData.link) {
            updateData.contentUrl = formData.link;
          }

          // Don't override contentType - let the server handle the specific file type
          // The server will determine the specific content type (pdf, doc, etc.) based on the file

          console.log('🔄 Updating content with data:', updateData);
          console.log('🔄 Content ID:', editContent._id);
          console.log('🔄 API URL:', `${API_BASE}/api/content/${editContent._id}`);
          console.log('🔄 ContentType value:', contentType);
          console.log('🔄 ContentType !== file check:', contentType !== 'file');
          console.log('🔄 FormData contentType:', formData.contentType);
          console.log('🔄 EditContent contentType:', editContent.contentType);

          response = await fetch(`${API_BASE}/api/content/${editContent._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });
        }

        let responseData;
        try {
          responseData = await response.json();
          console.log('📡 Update response:', responseData);
          console.log('📡 Response status:', response.status);
          console.log('📡 Response ok:', response.ok);
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError);
          console.error('❌ Raw response:', response);
          throw new Error('Invalid response from server');
        }
        
        if (response.ok) {
          console.log('✅ Update successful - Response content:', responseData.content);
          console.log('✅ Updated content type:', responseData.content?.contentType);
          console.log('✅ Updated content URL:', responseData.content?.contentUrl);
          
          alert('Content updated successfully!');
          if (onContentAdded) {
            onContentAdded(responseData.content || responseData);
          }
          onClose();
          resetForm();
        } else {
          console.error('❌ Update failed:', responseData);
          console.error('❌ Response status:', response.status);
          console.error('❌ Response statusText:', response.statusText);
          throw new Error(responseData.message || responseData.error || 'Failed to update content');
        }
      } else {
        // Handle new content creation
        if (contentType === 'file') {
          // Handle file upload
          if (!formData.file) {
            throw new Error('Please upload a file');
          }

          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.file);
          uploadFormData.append('title', formData.title);
          uploadFormData.append('description', formData.description);
          uploadFormData.append('category', formData.category);
          if (formData.deadline) {
            uploadFormData.append('deadline', formData.deadline.toISOString());
          }
          uploadFormData.append('ackRequired', formData.ackRequired);
          uploadFormData.append('assignedTo_depID', JSON.stringify(formData.selectedDepartments));
          if (formData.selectedGroups.length > 0) {
            uploadFormData.append('assignedTo_GroupID', JSON.stringify(formData.selectedGroups));
          }
          if (formData.selectedTrainees.length > 0) {
            uploadFormData.append('assignedTo_traineeID', JSON.stringify(formData.selectedTrainees));
          }

          response = await uploadContent(uploadFormData);

        } else if (contentType === 'link') {
          // Handle link content
          if (!formData.link) {
            throw new Error('Please enter a URL');
          }

          response = await createLinkContent({
            ...contentData,
            linkUrl: formData.link
          });

        } else if (contentType === 'template') {
          // Handle template content
          // Get current user info for assignment tracking
          let currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          
          // Fallback: try to get user data from token if user object is empty
          if (!currentUser.id) {
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUser = {
                  id: payload.id || payload.userId,
                  role: payload.role
                };
                console.log('🔍 Retrieved user from token:', currentUser);
              } catch (error) {
                console.error('❌ Error parsing token:', error);
              }
            }
          }
          
          const userRole = currentUser.role || 'Admin'; // Default to Admin if not found
          
          console.log('🔍 Current user data:', currentUser);
          console.log('🔍 User role:', userRole);
          console.log('🔍 User ID:', currentUser.id);
          
          // Validate user data
          if (!currentUser.id) {
            console.error('❌ No user ID found in localStorage');
            throw new Error('User not authenticated. Please log in again.');
          }
          
          if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
            console.error('❌ Invalid user role:', userRole);
            throw new Error('Invalid user role. Only Admin and Supervisor can create content.');
          }

          // Ensure all required fields are included
          const templateContentData = {
            title: formData.title,
            description: formData.description,
            type: 'TEMPLATE',
            contentType: 'template',
            category: formData.category,
            templateData: formData.templateData || {
              // Fallback template data if none provided
              type: 'custom',
              title: formData.title,
              description: formData.description
            },
            deadline: formData.deadline?.toISOString(),
            ackRequired: formData.ackRequired,
            assignedBy: currentUser.id,
            assignedByModel: userRole,
            assignedTo_depID: formData.selectedDepartments,
            assignedTo_GroupID: formData.selectedGroups.length > 0 ? formData.selectedGroups[0] : null,
            assignedTo_traineeID: formData.selectedTrainees.length > 0 ? formData.selectedTrainees[0] : null,
          };

          console.log('🔄 Sending template content data:', templateContentData);
          console.log('🔄 Form data templateData:', formData.templateData);
          console.log('🔄 Form data keys:', Object.keys(formData));
          console.log('🔄 Current user from localStorage:', currentUser);
          console.log('🔄 User role from localStorage:', userRole);
          console.log('🔄 AssignedBy value:', templateContentData.assignedBy);
          console.log('🔄 AssignedByModel value:', templateContentData.assignedByModel);

          // Validate required fields
          const validationErrors = [];
          if (!templateContentData.title) validationErrors.push('title');
          if (!templateContentData.type) validationErrors.push('type');
          if (!templateContentData.templateData || Object.keys(templateContentData.templateData).length === 0) validationErrors.push('templateData');
          if (!templateContentData.assignedBy) validationErrors.push('assignedBy');
          if (!templateContentData.assignedByModel) validationErrors.push('assignedByModel');
          
          if (validationErrors.length > 0) {
            console.error('❌ Missing required fields:', {
              title: !!templateContentData.title,
              type: !!templateContentData.type,
              templateData: !!templateContentData.templateData,
              assignedBy: !!templateContentData.assignedBy,
              assignedByModel: !!templateContentData.assignedByModel,
              missingFields: validationErrors
            });
            throw new Error(`Missing required fields: ${validationErrors.join(', ')}`);
          }

          response = await saveContentFromTemplate(templateContentData);
        }

        if (response && (response.ok || response.success || response.message === 'Content saved successfully')) {
          alert('Content published successfully!');
          if (onContentAdded) {
            onContentAdded(response.content || response);
          }
          onClose();
          resetForm();
        } else {
          throw new Error(response?.error || response?.message || 'Failed to publish content');
        }
      }

    } catch (error) {
      console.error('Error publishing content:', error);
      setError(error.message || 'Failed to publish content. Please try again.');
      alert(`Error: ${error.message || 'Failed to publish content. Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentOptionSelect = (option) => {
    if (option === 'template') {
      // Navigate to templates page based on user role and close modal
      onClose();
      const templatesRoute = userRole === 'Supervisor' ? '/supervisor/templates' : '/admin/templates';
      navigate(templatesRoute);
      return;
    }
    
    setContentType(option);
    setFormData({ ...formData, contentType: option });
    setShowContentOptions(false);
    setCurrentStep(1);
  };

  const resetForm = () => {
    setShowContentOptions(true);
    setCurrentStep(1);
    setContentType(null);
    setIsLoading(false);
    setError(null);
    setUrlValidationError('');
    setIsValidatingUrl(false);
    setUrlValidationStatus(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      contentType: '',
      file: null,
      link: '',
      selectedDepartments: [],
      selectedGroups: [],
      selectedTrainees: [],
      deadline: undefined,
      ackRequired: false,
      mcqs: [],
    });
  };

  const toggleDepartment = (deptId) => {
    setFormData({
      ...formData,
      selectedDepartments: formData.selectedDepartments.includes(deptId)
        ? formData.selectedDepartments.filter((id) => id !== deptId)
        : [...formData.selectedDepartments, deptId],
    });
  };

  const toggleAllDepartments = () => {
    if (formData.selectedDepartments.length === availableDepartments.length) {
      // If all are selected, deselect all
      setFormData({
        ...formData,
        selectedDepartments: [],
      });
    } else {
      // If not all are selected, select all
      setFormData({
        ...formData,
        selectedDepartments: availableDepartments.map(dept => dept._id),
      });
    }
  };

  const addMCQ = () => {
    const newMCQ = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    setFormData({ ...formData, mcqs: [...formData.mcqs, newMCQ] });
  };

  const updateMCQ = (id, updates) => {
    setFormData({
          ...formData,
      mcqs: formData.mcqs.map((mcq) =>
        mcq.id === id ? { ...mcq, ...updates } : mcq
      ),
    });
  };

  const deleteMCQ = (id) => {
    setFormData({
      ...formData,
      mcqs: formData.mcqs.filter((mcq) => mcq.id !== id),
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`overflow-y-auto ${
        showContentOptions 
          ? "max-w-4xl w-[90vw] max-h-[80vh] p-8" 
          : "max-w-6xl w-[95vw] max-h-[95vh] p-8"
      }`}>
        <DialogHeader>
          <DialogTitle className="text-3xl">
            {editMode ? 'Edit Content' : 'Add New Content'}
          </DialogTitle>
          <p className="text-gray-600 text-lg">
            {showContentOptions 
              ? (editMode ? "Choose how you want to modify this content." : "Choose how you want to add content to the system.")
              : (editMode ? "Follow the steps to update and reassign this content." : "Follow the steps to add and assign new learning content.")
            }
          </p>
        </DialogHeader>

        {/* Content Options Selection */}
        {showContentOptions && (
          <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Upload File Option */}
              <div 
                className="flex flex-col items-center p-10 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleContentOptionSelect('file')}
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-10 h-10 text-blue-600" />
                          </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upload File</h3>
                <p className="text-gray-600 text-center leading-relaxed text-lg">
                  Upload images or documents directly to the system
                </p>
                  </div>

              {/* Link Resource Option */}
              <div 
                className="flex flex-col items-center p-10 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleContentOptionSelect('link')}
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Link className="w-10 h-10 text-blue-600" />
                    </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Link Resource</h3>
                <p className="text-gray-600 text-center leading-relaxed text-lg">
                  Add an external link to a video, article, or website
                </p>
                    </div>
                    
              {/* Use Template Option */}
              <div 
                className="flex flex-col items-center p-10 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                onClick={() => handleContentOptionSelect('template')}
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <LayoutTemplate className="w-10 h-10 text-blue-600" />
                                  </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Use Template</h3>
                <p className="text-gray-600 text-center leading-relaxed text-lg">
                  Start from a ready-to-use content template
                </p>
                                  </div>
                                </div>
                          </div>
                        )}

        {/* Multi-step Form */}
        {!showContentOptions && (
          <>
            {/* Back to Options Button */}
            <div className="flex justify-start mb-6">
              <Button 
                variant="outline" 
                onClick={() => setShowContentOptions(true)}
                className="flex items-center gap-2 px-4 py-2"
              >
                ← Back to Options
              </Button>
                    </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 mt-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            
        return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-lg' :
                      isCompleted ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <StepIcon className="w-6 h-6" />
                    </div>
                  <span
                    className={`text-sm text-center font-medium hidden sm:block ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                        </span>
                    </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-all ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
                    </div>
  );
          })}
                    </div>

        {/* Step 1: Upload/Select Content */}
                {currentStep === 1 && (
          <div className="space-y-6">
            {/* Edit Mode Indicator */}
            {editMode && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Editing Mode</span>
                </div>
                <p className="text-sm text-blue-700">
                  Current content type: <strong>{contentType}</strong>
                  {contentType === 'file' && editContent?.contentUrl && (
                    <span className="ml-2">| Use the file upload below to replace the current file</span>
                  )}
                  {contentType === 'link' && editContent?.contentUrl && (
                    <span className="ml-2">| Update the link URL below</span>
                  )}
                </p>
                {/* Debug info */}
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                  <strong>Debug Info:</strong><br/>
                  Original contentType: {editContent?.contentType}<br/>
                  Detected contentType: {contentType}<br/>
                  Has contentUrl: {editContent?.contentUrl ? 'Yes' : 'No'}<br/>
                  ContentUrl includes supabase: {editContent?.contentUrl?.includes('supabase') ? 'Yes' : 'No'}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="block text-base font-medium text-gray-700">Content Title *</label>
                  <input
                    id="title"
                type="text"
                    value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Introduction to Cloud Security"
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-base font-medium text-gray-700">Description</label>
                  <textarea
                    id="description"
                    value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A comprehensive guide to understanding fundamental cloud security principles and best practices."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-base font-medium text-gray-700">Category *</label>
                  <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>


            {contentType === 'file' && (
              <div className="space-y-2">
                {console.log('🎯 RENDERING FILE UPLOAD SECTION - contentType:', contentType, 'editMode:', editMode)}
                <label htmlFor="file" className="block text-base font-medium text-gray-700">
                  {editMode ? 'Upload New File (Optional)' : 'Upload File *'}
                </label>
                
                {/* Edit mode info */}
                {editMode && editContent?.contentUrl && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>🔄 Replace Current File</strong> Upload a new file below to replace the existing file, or leave empty to keep the current file.
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    id="file"
                    type="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
                    required={!editMode}
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 text-lg">
                      {editMode ? 'Click to upload a new file and replace the existing one' : 'Drag and drop files here, or click to upload'}
                    </p>
                    {formData.file && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-base text-green-800 font-medium">
                          ✅ Selected: {formData.file.name}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {editMode ? 'This new file will replace the existing file when you update the content.' : 'Ready to upload with the content.'}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {contentType === 'link' && (
              <div className="space-y-2">
                <label htmlFor="link" className="block text-base font-medium text-gray-700">
                  {editMode ? 'Update Resource URL' : 'Resource URL *'}
                </label>
                <input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={handleLinkChange}
                  placeholder="https://example.com/resource"
                  className={`w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-base ${
                    urlValidationError 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {urlValidationError && (
                  <p className="text-sm text-red-600 mt-1">{urlValidationError}</p>
                )}
                {isValidatingUrl && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 mt-1">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Validating URL...</span>
                  </div>
                )}
                {urlValidationStatus === 'valid' && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <span>✓</span>
                    <span>
                      {formData.link && (formData.link.includes('youtube.com') || formData.link.includes('youtu.be'))
                        ? 'Valid YouTube URL format'
                        : 'URL is valid and accessible'
                      }
                    </span>
                  </p>
                )}
                {urlValidationStatus === 'invalid' && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <span>✗</span>
                    <span>
                      {formData.link && (formData.link.includes('youtube.com') || formData.link.includes('youtu.be'))
                        ? 'Invalid YouTube URL format'
                        : 'URL is not accessible or does not exist'
                      }
                    </span>
                  </p>
                )}
                {formData.link && isValidUrl(formData.link) && !urlValidationStatus && !isValidatingUrl && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600">✓ Valid URL format</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => validateUrlExists(formData.link)}
                      disabled={isValidatingUrl}
                      className="text-xs"
                    >
                      {isValidatingUrl ? 'Validating...' : 'Test URL'}
                    </Button>
                  </div>
                )}
              </div>
            )}

                          </div>
        )}

        {/* Step 2: Assign Departments (Admin) or Groups/Trainees (Supervisor) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {userRole === 'Supervisor' ? (
              /* Supervisor View: Groups and Trainees */
              <div className="space-y-6">
                {/* Groups Section */}
                <div className="space-y-4">
                  <label className="block text-base font-medium text-gray-700">Assign to Groups</label>
                  {availableGroups.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No groups found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableGroups.map((group) => (
                        <div
                          key={group._id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.selectedGroups.includes(group._id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              selectedGroups: formData.selectedGroups.includes(group._id)
                                ? formData.selectedGroups.filter(id => id !== group._id)
                                : [...formData.selectedGroups, group._id]
                            });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedGroups.includes(group._id)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{group.groupName}</p>
                            <p className="text-sm text-gray-500">{group.traineesCount || 0} trainees</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trainees Section */}
                <div className="space-y-4">
                  <label className="block text-base font-medium text-gray-700">Or assign to specific Trainees</label>
                  {availableTrainees.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No trainees found</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableTrainees.map((trainee) => (
                        <div
                          key={trainee.traineeId}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.selectedTrainees.includes(trainee.traineeId)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              selectedTrainees: formData.selectedTrainees.includes(trainee.traineeId)
                                ? formData.selectedTrainees.filter(id => id !== trainee.traineeId)
                                : [...formData.selectedTrainees, trainee.traineeId]
                            });
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedTrainees.includes(trainee.traineeId)}
                            onChange={() => {}}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{trainee.name}</p>
                            <p className="text-sm text-gray-500">{trainee.email} • {trainee.groupName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected: {formData.selectedGroups.length} group(s), {formData.selectedTrainees.length} trainee(s)
                  </p>
                  {formData.selectedGroups.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <strong>Assigned to:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {formData.selectedGroups.map(groupId => {
                          const group = availableGroups.find(g => g._id === groupId);
                          return group ? <li key={groupId}>{group.groupName}</li> : null;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Admin View: Departments */
              <div className="space-y-4">
                <label className="block text-base font-medium text-gray-700">Assign to Departments</label>
                
                {availableDepartments.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-lg">No departments found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {error ? 'Error loading departments' : 'No departments are assigned to this admin'}
                    </p>
                    {error && (
                      <button 
                        onClick={loadInitialData}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        formData.selectedDepartments.length === availableDepartments.length
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={toggleAllDepartments}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedDepartments.length === availableDepartments.length}
                        onChange={toggleAllDepartments}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-base">All Departments</p>
                        <p className="text-sm text-gray-500">Select all departments at once</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableDepartments.map((dept) => (
                        <div
                          key={dept._id}
                          className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.selectedDepartments.includes(dept._id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => toggleDepartment(dept._id)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedDepartments.includes(dept._id)}
                            onChange={() => toggleDepartment(dept._id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-base">{dept.departmentName}</p>
                            <p className="text-sm text-gray-500">{dept.numOfMembers} members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Selected: {formData.selectedDepartments.length} department(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Set Deadline */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="deadline" className="block text-base font-medium text-gray-700">Deadline (Optional)</label>
                
                {/* Enhanced Date/Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label htmlFor="deadline-date" className="block text-sm font-medium text-gray-600">Date</label>
                    <input
                      id="deadline-date"
                      type="date"
                      value={formData.deadline ? formData.deadline.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          const selectedDate = new Date(e.target.value);
                          const currentTime = formData.deadline || new Date();
                          const newDateTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), currentTime.getHours(), currentTime.getMinutes());
                          setFormData({ ...formData, deadline: newDateTime });
                        } else {
                          setFormData({ ...formData, deadline: undefined });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="space-y-2">
                    <label htmlFor="deadline-time" className="block text-sm font-medium text-gray-600">Time</label>
                    <input
                      id="deadline-time"
                      type="time"
                      value={formData.deadline ? formData.deadline.toTimeString().slice(0, 5) : ''}
                      onChange={(e) => {
                        if (e.target.value && formData.deadline) {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDateTime = new Date(formData.deadline);
                          newDateTime.setHours(parseInt(hours), parseInt(minutes));
                          setFormData({ ...formData, deadline: newDateTime });
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">Quick Options</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(17, 0, 0, 0); // 5:00 PM
                        setFormData({ ...formData, deadline: tomorrow });
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Tomorrow 5:00 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        nextWeek.setHours(17, 0, 0, 0); // 5:00 PM
                        setFormData({ ...formData, deadline: nextWeek });
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Next Week
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        nextMonth.setHours(17, 0, 0, 0); // 5:00 PM
                        setFormData({ ...formData, deadline: nextMonth });
                      }}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Next Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deadline: undefined })}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Set a deadline for trainees to complete this content
                </p>
              </div>

              {/* Acknowledgment Requirement */}
              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">Acknowledgment Requirement</label>
                <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="ackRequired"
                    checked={formData.ackRequired}
                    onChange={(e) => setFormData({ ...formData, ackRequired: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="ackRequired" className="text-base font-medium text-gray-900 cursor-pointer">
                      Require Acknowledgment
                    </label>
                    <p className="text-sm text-gray-500">
                      Trainees must acknowledge they have reviewed and understood this content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.deadline && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <p className="text-base font-medium text-blue-900">Deadline Set</p>
                  </div>
                  <p className="text-lg font-semibold text-blue-800">
                    {formData.deadline.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-blue-700">
                    at {formData.deadline.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              )}

              {formData.ackRequired && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-base font-medium text-green-900">Acknowledgement</p>
                  </div>
                  <p className="text-sm text-green-700">
                    Trainees must confirm they have reviewed this content
                  </p>
                </div>
              )}
            </div>

            {!formData.deadline && !formData.ackRequired && (
              <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 text-lg">No deadline or acknowledgment set</p>
                <p className="text-gray-500 text-sm mt-1">
                  This content will be available indefinitely without completion requirements
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Add MCQs */}
                {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-base font-medium text-gray-700">Multiple Choice Questions (Optional)</label>
                <p className="text-base text-gray-600">
                  Add quiz questions to test trainee understanding
                </p>
                    </div>
              <Button onClick={addMCQ} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            {formData.mcqs.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 text-lg">No questions added yet</p>
                <Button onClick={addMCQ} variant="outline" className="mt-4">
                  Add Your First Question
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {formData.mcqs.map((mcq, index) => (
                <div key={mcq.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <label className="block text-base font-medium text-gray-700">Question {index + 1}</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMCQ(mcq.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    </div>
                      <input
                        type="text"
                    value={mcq.question}
                    onChange={(e) => updateMCQ(mcq.id, { question: e.target.value })}
                    placeholder="Enter your question"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  <div className="space-y-2">
                    <label className="block text-base font-medium text-gray-700">Answer Options</label>
                    {mcq.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                          <input
                          type="radio"
                          name={`correct-${mcq.id}`}
                          checked={mcq.correctAnswer === optIndex}
                          onChange={() => updateMCQ(mcq.id, { correctAnswer: optIndex })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                          <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...mcq.options];
                            newOptions[optIndex] = e.target.value;
                            updateMCQ(mcq.id, { options: newOptions });
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                            </div>
                    ))}
                          </div>
                            </div>
                            ))}
                      </div>
                        </div>
        )}

        {/* Step 5: Publish */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-blue-600" />
                                </div>
              <h3 className="text-2xl font-semibold mb-2 text-gray-900">Ready to Publish</h3>
              <p className="text-gray-600 text-lg">
                Review your content details before publishing
              </p>
                              </div>

            <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
              <div>
                <p className="text-base text-gray-600">Title</p>
                <p className="font-medium text-lg text-gray-900">{formData.title}</p>
              </div>
              <div>
                <p className="text-base text-gray-600">Category</p>
                <p className="font-medium text-lg text-gray-900">{formData.category}</p>
              </div>
              <div>
                <p className="text-base text-gray-600">Content Type</p>
                <p className="font-medium text-lg text-gray-900 capitalize">{contentType}</p>
              </div>
              <div>
                <p className="text-base text-gray-600">Assigned To</p>
                {userRole === 'Supervisor' ? (
                  <div className="space-y-2">
                    {formData.selectedGroups.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Groups:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedGroups.map(groupId => {
                            const group = availableGroups.find(g => g._id === groupId);
                            return group ? (
                              <span key={groupId} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                {group.groupName}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {formData.selectedTrainees.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Trainees:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedTrainees.map(traineeId => {
                            const trainee = availableTrainees.find(t => t.traineeId === traineeId);
                            return trainee ? (
                              <span key={traineeId} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {trainee.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    {formData.selectedGroups.length === 0 && formData.selectedTrainees.length === 0 && (
                      <p className="font-medium text-lg text-gray-900">None</p>
                    )}
                  </div>
                ) : (
                  <>
                    {formData.selectedDepartments.length === availableDepartments.length && availableDepartments.length > 0 ? (
                      <p className="font-medium text-lg text-gray-900">All Departments</p>
                    ) : formData.selectedDepartments.length > 0 ? (
                      <p className="font-medium text-lg text-gray-900">
                        {availableDepartments
                          .filter((d) => formData.selectedDepartments.includes(d._id))
                          .map((d) => d.departmentName)
                          .join(', ')}
                      </p>
                    ) : (
                      <p className="font-medium text-lg text-gray-900">None</p>
                    )}
                  </>
                )}
              </div>
              {formData.deadline && (
                <div>
                  <p className="text-base text-gray-600">Deadline</p>
                  <p className="font-medium text-lg text-gray-900">
                    {formData.deadline.toLocaleDateString()} at {formData.deadline.toLocaleTimeString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-base text-gray-600">Acknowledgement</p>
                <p className="font-medium text-lg text-gray-900">
                  {formData.ackRequired ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-base text-gray-600">Quiz Questions</p>
                <p className="font-medium text-lg text-gray-900">{formData.mcqs.length} question(s)</p>
              </div>
            </div>
                    </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button 
              onClick={handleNext}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handlePublish}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isLoading ? (editMode ? 'Updating...' : 'Publishing...') : (editMode ? 'Update' : 'Publish')}
            </Button>
                        )}
                    </div>
                  </>
                )}
      </DialogContent>
    </Dialog>
  );
};

export default AddContentModal;