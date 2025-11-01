import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Link, LayoutTemplate, Users, Clock, CheckCircle, Bell, CalendarIcon, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { uploadContent, createLinkContent, createTemplateContent, saveContentFromTemplate, getTemplates, getDepartments, generateAI } from '../services/content';
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
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [numQuestionsToGenerate, setNumQuestionsToGenerate] = useState(5); // Number of questions for AI generation
  const [showQuestionCountDialog, setShowQuestionCountDialog] = useState(false); // Show chat-style dialog
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '', icon: '' }); // Custom alert state
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
  
  // Detect group context from URL if template data is provided but no groupId
  const getEffectiveGroupId = () => {
    if (groupId) return groupId;
    if (templateData && !groupId) {
      const pathParts = window.location.pathname.split('/');
      const groupsIndex = pathParts.findIndex(part => part === 'groups');
      if (groupsIndex !== -1 && pathParts[groupsIndex + 1]) {
        return pathParts[groupsIndex + 1];
      }
    }
    return null;
  };
  
  const effectiveGroupId = getEffectiveGroupId();

  // Reset to options screen when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowContentOptions(true);
      setCurrentStep(1);
    }
  }, [isOpen]);

  // Custom Alert Helper Function
  const showAlert = (title, message, icon = '⚠️') => {
    setCustomAlert({ show: true, title, message, icon });
  };

  const closeAlert = () => {
    setCustomAlert({ show: false, title: '', message: '', icon: '' });
  };

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
  const populateEditForm = async () => {
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
    
    // Fetch quiz questions from database
    let existingQuizzes = [];
    setLoadingQuizzes(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/content/${editContent._id}/quiz`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const quizzes = data.quizzes || [];
        console.log('📚 Fetched quizzes from database:', quizzes);
        
        // Convert database quiz format to form format
        if (quizzes.length > 0) {
          // Get the most recent quiz (first one, since they're sorted by createdAt desc)
          const latestQuiz = quizzes[0];
          existingQuizzes = latestQuiz.questions.map((q, idx) => {
            const correctIdx = q.options.findIndex(opt => String(opt).trim() === String(q.correctAnswer).trim());
            return {
              id: `${Date.now()}-${idx}`,
              question: q.questionText || '',
              options: q.options || ['', '', '', ''],
              correctAnswer: correctIdx >= 0 ? correctIdx : 0,
            };
          });
          console.log('✅ Converted quiz questions to form format:', existingQuizzes);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
    
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
      mcqs: existingQuizzes, // Load quizzes from database
    });
    setShowContentOptions(false);
    
    console.log('✅ Form populated with data:', {
      title: editContent.title,
      category: editContent.category,
      contentType: contentType,
      link: editContent.contentUrl,
      selectedDepartments: editContent.assignedTo_depID,
      mcqsCount: existingQuizzes.length
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
        // If groupId is provided (or detected from URL), only load that specific group and its trainees
        if (effectiveGroupId) {
          console.log('🎯 Loading specific group:', effectiveGroupId);
           try {
             const groupDetails = await getSupervisorGroupDetails(effectiveGroupId);
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
                 selectedGroups: [effectiveGroupId]
               }));
             }
           } catch (err) {
             console.error(`Error loading group ${effectiveGroupId}:`, err);
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

  // URL validation function - only allows YouTube and web page URLs, not file URLs
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      
      // Check for file extensions that shouldn't be allowed for Link/URL resource type
      const fileExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', 
                             '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif', '.mp4', 
                             '.mp3', '.avi', '.mov', '.exe', '.dmg'];
      
      const pathname = url.pathname.toLowerCase();
      const hasFileExtension = fileExtensions.some(ext => 
        pathname.endsWith(ext) || pathname.includes(`${ext}?`)
      );
      
      if (hasFileExtension) {
        return false; // Reject file URLs
      }
      
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
      // Check if it's a file URL
      const fileExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', 
                             '.zip', '.rar', '.jpg', '.jpeg', '.png', '.gif', '.mp4', 
                             '.mp3', '.avi', '.mov', '.exe', '.dmg'];
      const urlLower = url.toLowerCase();
      const hasFileExtension = fileExtensions.some(ext => 
        urlLower.endsWith(ext) || urlLower.includes(`${ext}?`)
      );
      
      if (hasFileExtension) {
        setUrlValidationError('File URLs are not supported. Please upload files using the "File" option or use YouTube URLs for videos.');
      } else {
        setUrlValidationError('Please enter a valid URL (e.g., https://example.com or https://youtube.com/watch?v=...)');
      }
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
        showAlert('Missing Required Fields', 'Please fill in all required fields before proceeding.', '📝');
        return;
      }
      if (contentType === 'file' && !formData.file && !editMode) {
        showAlert('File Required', 'Please upload a file to continue.', '📁');
        return;
      }
      if (contentType === 'link') {
        if (!formData.link) {
          showAlert('URL Required', 'Please enter a URL to continue.', '🔗');
          return;
        }
        if (!isValidUrl(formData.link)) {
          setUrlValidationError('Please enter a valid URL (e.g., https://example.com)');
          showAlert('Invalid URL', 'Please enter a valid URL (e.g., https://example.com)', '🔗');
          return;
        }
        if (urlValidationStatus === 'invalid') {
          showAlert('URL Not Accessible', 'This URL is not accessible or does not exist. Please check the URL and try again.', '❌');
          return;
        }
        if (urlValidationStatus === 'checking') {
          showAlert('Validating URL', 'Please wait while we validate the URL...', '⏳');
          return;
        }
        if (urlValidationStatus !== 'valid') {
          // If validation hasn't completed yet, trigger it now
          const isValid = await validateUrlExists(formData.link);
          if (!isValid) {
            showAlert('URL Not Accessible', 'This URL is not accessible or does not exist. Please check the URL and try again.', '❌');
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
        showAlert('Assignment Required', 'Please assign to at least one department, group, or trainee', '👥');
        return;
      }
    }

    // Validation for step 4 (MCQ step)
    if (currentStep === 4) {
      // Only validate if user has added questions
      if (formData.mcqs && formData.mcqs.length > 0) {
        const validation = validateQuestions();
        if (!validation.valid) {
          showAlert('Some Quiz Questions Are Incomplete', validation.errors.join('\n\n'), '⚠️');
          return;
        }
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
    console.log('🚀 Form data MCQs count:', formData.mcqs?.length || 0);
    console.log('🚀 Form data MCQs:', formData.mcqs);
    console.log('🚀 Full Form data:', formData);
    
    // Validate questions before publishing if they exist
    if (formData.mcqs && formData.mcqs.length > 0) {
      const validation = validateQuestions();
      if (!validation.valid) {
        showAlert('Some Quiz Questions Are Incomplete', 'Please fix the following issues with your quiz questions:\n\n' + validation.errors.join('\n\n'), '⚠️');
        return;
      }
    }
    
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
          // Only save quiz if there are questions
          const contentId = responseData.content?._id || editContent._id;
          if (formData.mcqs && formData.mcqs.length > 0 && contentId) {
            try { 
              await saveQuizForContent(contentId); 
            } catch (quizError) {
              console.error('Quiz save failed but content was updated:', quizError);
            }
          }
          showAlert('Success!', 'Content updated successfully!', '✅');
          setTimeout(() => {
            closeAlert();
            onContentAdded(responseData.content || responseData);
            onClose();
            resetForm();
          }, 1500);
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
          showAlert('Success!', 'Content published successfully!', '✅');
          setTimeout(async () => {
            closeAlert();
          // Only save quiz if there are questions
          const contentId = (response.content && response.content._id) || response._id;
          if (formData.mcqs && formData.mcqs.length > 0 && contentId) {
            try { 
              await saveQuizForContent(contentId); 
            } catch (quizError) {
              console.error('Quiz save failed but content was created:', quizError);
            }
          }
            if (onContentAdded) {
              onContentAdded(response.content || response);
            }
            onClose();
            resetForm();
          }, 1500);
        } else {
          throw new Error(response?.error || response?.message || 'Failed to publish content');
        }
      }

    } catch (error) {
      console.error('Error publishing content:', error);
      setError(error.message || 'Failed to publish content. Please try again.');
      showAlert('Publication Error', error.message || 'Failed to publish content. Please try again.', '❌');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentOptionSelect = (option) => {
    if (option === 'template') {
      // Navigate to templates page based on user role and group context
      onClose();
      if (effectiveGroupId) {
        // If we're in a group context, navigate to group-specific templates
        const templatesRoute = userRole === 'Supervisor' 
          ? `/supervisor/groups/${effectiveGroupId}/templates` 
          : `/admin/groups/${effectiveGroupId}/templates`;
        navigate(templatesRoute);
      } else {
        // If not in group context, navigate to general templates
        const templatesRoute = userRole === 'Supervisor' ? '/supervisor/templates' : '/admin/templates';
        navigate(templatesRoute);
      }
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

  // Add MCQ at specific index (below a question)
  const addMCQAtIndex = (afterIndex) => {
    const newMCQ = {
      id: Date.now().toString(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
    };
    const newMcqs = [...formData.mcqs];
    newMcqs.splice(afterIndex + 1, 0, newMCQ); // Insert after the specified index
    setFormData({ ...formData, mcqs: newMcqs });
  };

  const handleGenerateClick = () => {
    setShowQuestionCountDialog(true);
  };

  const confirmAndGenerate = async () => {
    setShowQuestionCountDialog(false);
    await generateMcqsWithAI();
  };

  const generateMcqsWithAI = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let result;
      if (contentType === 'file' && formData.file) {
        result = await generateAI({ task: 'quiz', file: formData.file, numQuestions: numQuestionsToGenerate });
      } else if (contentType === 'link' && formData.link) {
        result = await generateAI({ task: 'quiz', url: formData.link, numQuestions: numQuestionsToGenerate });
      } else {
        const baseText = `${formData.title}\n\n${formData.description || ''}`.trim();
        if (!baseText) {
          showAlert('Content Required', 'Please enter title or description, or upload a file to use AI.', '📝');
          setIsLoading(false);
          return;
        }
        result = await generateAI({ task: 'quiz', text: baseText, numQuestions: numQuestionsToGenerate });
      }
      // Handle both response formats: direct { questions: [...] } or wrapped { data: { questions: [...] } }
      const questions = result.questions || (result.data && result.data.questions) || [];
      console.log('🤖 AI Response - Raw questions:', questions);
      
      if (questions.length === 0) {
        showAlert('No Questions Generated', 'No questions were generated. Please try again or check your content.', '⚠️');
        setIsLoading(false);
        return;
      }
      
      const mapped = questions.map((q, idx) => {
        console.log(`🤖 Question ${idx + 1} from AI:`, {
          question: q.question?.substring(0, 50),
          correctAnswer: q.correctAnswer,
          correctAnswerType: typeof q.correctAnswer,
          correctAnswerText: q.correctAnswerText,
          options: q.options
        });
        
        return {
          id: `${Date.now()}-${idx}`,
          question: q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        };
      });
      console.log('✅ Mapped questions:', mapped);
      console.log('✅ Setting formData.mcqs to:', mapped.length, 'questions');
      setFormData(prev => {
        const updated = { ...prev, mcqs: mapped };
        console.log('✅ Updated formData:', updated);
        return updated;
      });
      alert(`Successfully generated ${mapped.length} questions!`);
    } catch (e) {
      console.error('❌ AI generation failed:', e);
      
      // Use the error message from backend (includes suggestion if provided)
      let errorMessage = e.message || 'Failed to generate quiz';
      let errorTitle = '';
      let errorDetails = '';
      let suggestions = '';
      
      // Detect specific error types and provide helpful messages
      if (errorMessage.toLowerCase().includes('transcript') || 
          errorMessage.toLowerCase().includes('caption') || 
          errorMessage.toLowerCase().includes('no element found') ||
          errorMessage.includes('CC button')) {
        errorTitle = '⚠️ YouTube Transcript Not Available';
        errorDetails = 'This video doesn\'t have captions or transcripts available.\n\n' +
                      'The CC (Closed Captions) button must be visible on YouTube for AI to generate questions.';
        suggestions = '\n\n✅ Solutions:\n' +
                     '• Choose a different video with captions enabled (check for CC button)\n' +
                     '• Upload the video content as a PDF or text file instead\n' +
                     '• Try a video with auto-generated captions (most YouTube videos have these)\n' +
                     '• If it\'s your video, enable captions in YouTube Studio';
      } else if (errorMessage.includes('too short')) {
        errorTitle = '📏 Content Too Short';
        errorDetails = errorMessage;
        suggestions = '\n\n✅ Try:\n' +
                     '• A longer video or document\n' +
                     '• Content with more detailed information';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
        errorTitle = '⏰ Rate Limited';
        errorDetails = 'YouTube is temporarily blocking transcript requests.';
        suggestions = '\n\n✅ Solutions:\n' +
                     '• Wait 30-60 minutes and try again\n' +
                     '• Upload content as a PDF file (works immediately!)\n' +
                     '• Try a different network/VPN';
      } else if (errorMessage.includes('Video unavailable') || errorMessage.includes('private')) {
        errorTitle = '🔒 Video Not Accessible';
        errorDetails = 'This video is unavailable, private, or restricted.';
        suggestions = '\n\n✅ Try:\n' +
                     '• A public, non-restricted video\n' +
                     '• Uploading content as a PDF instead';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        errorTitle = '⚠️ Connection Error';
        errorDetails = 'Cannot connect to the AI service.';
        suggestions = '\n\n✅ Check:\n' +
                     '• Python AI service is running (port 8001)\n' +
                     '• Console for startup errors\n' +
                     '• Try restarting the Python service';
      } else if (errorMessage.includes('Suggestion:')) {
        // Backend provided a suggestion
        errorTitle = '❌ Generation Failed';
        errorDetails = errorMessage;
        suggestions = '';
      } else {
        // Generic error
        errorTitle = '❌ Unexpected Error';
        errorDetails = errorMessage;
        suggestions = '\n\n💡 Tip: PDF files work most reliably for quiz generation!';
      }
      
      // Show custom alert instead of browser alert
      showAlert(errorTitle, `${errorDetails}${suggestions}`, errorTitle.includes('⚠️') || errorTitle.includes('❌') ? errorTitle.split(' ')[0] : '⚠️');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateQuestions = () => {
    if (!formData.mcqs || formData.mcqs.length === 0) {
      return { valid: true, errors: [] }; // No questions is OK (optional)
    }

    const errors = [];
    
    formData.mcqs.forEach((q, idx) => {
      const questionNum = idx + 1;
      
      // Check if question text is empty
      if (!q.question || q.question.trim() === '') {
        errors.push(`Question ${questionNum}: Question text is empty`);
      }
      
      // Check if at least 2 options are filled
      const filledOptions = q.options.filter((opt, optIdx) => opt && opt.trim() !== '');
      const filledOptionIndices = q.options.map((opt, idx) => (opt && opt.trim() !== '') ? idx : null).filter(idx => idx !== null);
      
      if (filledOptions.length < 2) {
        errors.push(`Question ${questionNum}: At least 2 answer options are required`);
      }
      
      // Check if correct answer is selected and is one of the filled options
      if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 0) {
        if (q.options[q.correctAnswer] === undefined || !q.options[q.correctAnswer] || !q.options[q.correctAnswer].trim()) {
          errors.push(`Question ${questionNum}: The selected correct answer (Option ${q.correctAnswer + 1}) is empty`);
        } else if (!filledOptionIndices.includes(q.correctAnswer)) {
          errors.push(`Question ${questionNum}: The correct answer must be one of the filled options`);
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const saveQuizForContent = async (contentId) => {
    try {
      console.log('💾 saveQuizForContent called with contentId:', contentId);
      console.log('💾 formData.mcqs at save time:', formData.mcqs);
      console.log('💾 formData.mcqs is array?', Array.isArray(formData.mcqs));
      console.log('💾 formData.mcqs length:', formData.mcqs?.length);
      
      // Validate questions before sending
      const validation = validateQuestions();
      if (!validation.valid) {
        console.error('❌ Quiz validation failed:', validation.errors);
        showAlert('Some Quiz Questions Are Incomplete', validation.errors.join('\n\n'), '⚠️');
        throw new Error('Invalid quiz questions');
      }
      
      const questions = Array.isArray(formData.mcqs) ? formData.mcqs.map((q, idx) => {
        const mapped = {
          question: q.question,
          options: q.options,
          correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        };
        console.log(`💾 Question ${idx + 1} being sent:`, {
          question: mapped.question?.substring(0, 50) || '(empty)',
          options: mapped.options,
          correctAnswer: mapped.correctAnswer,
          correctAnswerText: mapped.options[mapped.correctAnswer]
        });
        return mapped;
      }) : [];
      
      console.log('💾 Mapped questions for save:', questions);
      console.log('💾 Mapped questions count:', questions.length);
      
      if (!contentId || questions.length === 0) {
        console.log('⚠️ Skipping quiz save - no content ID or no questions', { 
          contentId, 
          questionsCount: questions.length,
          hasContentId: !!contentId,
          originalMcqs: formData.mcqs 
        });
        return;
      }

      console.log('💾 Saving quiz for content:', contentId, 'Questions:', questions.length);
      
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      if (!token) {
        console.warn('⚠️ No auth token present; cannot save quiz');
        return;
      }

      const fd = new FormData();
      fd.append('isAiGenerated', 'true');
      fd.append('questions', JSON.stringify(questions));
      
      console.log('📤 Sending quiz data to:', `${API_BASE}/api/content/${contentId}/quiz`);
      console.log('📤 Questions payload:', JSON.stringify(questions, null, 2));

      const response = await fetch(`${API_BASE}/api/content/${contentId}/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });

      const responseData = await response.json();
      
      if (response.ok) {
        console.log('✅ Quiz saved successfully:', responseData);
        if (responseData.action === 'updated') {
          console.log('📝 Quiz was updated (not created new)');
        } else if (responseData.action === 'created') {
          console.log('➕ New quiz was created');
        }
      } else {
        console.error('❌ Failed to save quiz:', response.status, responseData);
        throw new Error(responseData.error || 'Failed to save quiz to database');
      }
    } catch (e) {
      console.error('❌ Exception while saving quiz:', e);
      // Don't throw - we don't want to block content creation if quiz save fails
    }
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
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        showContentOptions 
          ? "max-w-5xl w-[92vw] max-h-[80vh]" 
          : "max-w-6xl w-[95vw] max-h-[95vh]"
      }`}>
        <div 
          className="overflow-y-auto h-full p-8 hide-scrollbar" 
          style={{ 
            maxHeight: showContentOptions ? '80vh' : '95vh'
          }}
        >
        <DialogHeader className="!px-0 !pb-4 pt-0 relative">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100 z-10"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <DialogTitle className="text-3xl font-bold pr-10">
            {editMode ? 'Edit Content' : 'Add New Content'}
          </DialogTitle>
          <p className="text-gray-600 text-lg mt-2">
            {showContentOptions 
              ? (editMode ? "Choose how you want to modify this content." : "Choose how you want to add content to the system.")
              : (editMode ? "Follow the steps to update and reassign this content." : "Follow the steps to add and assign new learning content.")
            }
          </p>
        </DialogHeader>

        {/* Content Options Selection */}
        {showContentOptions && (
          <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Upload File Option */}
              <div 
                className="flex flex-col items-center px-12 py-8 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
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
                className="flex flex-col items-center px-12 py-8 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
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
                className="flex flex-col items-center px-12 py-8 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
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
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10 mt-6 w-full">
          <div className="flex items-center w-full max-w-4xl">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
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
                      className={`text-sm text-center font-medium hidden sm:block whitespace-nowrap ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-all ${
                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                  formData.title ? 'bg-blue-50' : 'bg-white'
                }`}
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                  formData.description ? 'bg-blue-50' : 'bg-white'
                }`}
                  />
                </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-base font-medium text-gray-700">Category *</label>
                  <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                  formData.category ? 'bg-blue-50' : 'bg-white'
                }`}
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
                  } ${
                    formData.link ? 'bg-blue-50' : 'bg-white'
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
                            const newSelectedGroups = formData.selectedGroups.includes(group._id)
                              ? formData.selectedGroups.filter(id => id !== group._id)
                              : [...formData.selectedGroups, group._id];
                            
                            // Clear trainee selections when groups change
                            setFormData({
                              ...formData,
                              selectedGroups: newSelectedGroups,
                              selectedTrainees: []
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
                  <label className="block text-base font-medium text-gray-700">
                    Or assign to specific Trainees
                    {(groupId || (templateData && effectiveGroupId)) ? (
                      <span className="text-sm text-gray-500 ml-2">
                        (showing trainees from this group only)
                      </span>
                    ) : formData.selectedGroups.length > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        (showing trainees from selected groups only)
                      </span>
                    )}
                  </label>
                  {(() => {
                    // Filter trainees based on selected groups
                    // If groupId is provided (or detected from URL), we already have only trainees from that group
                    const filteredTrainees = (groupId || (templateData && effectiveGroupId))
                      ? availableTrainees // When groupId is provided or detected, all availableTrainees are already from that group
                      : formData.selectedGroups.length > 0 
                        ? availableTrainees.filter(trainee => 
                            formData.selectedGroups.some(groupId => {
                              const group = availableGroups.find(g => g._id === groupId);
                              return group && trainee.groupName === group.groupName;
                            })
                          )
                        : availableTrainees;
                    
                    return filteredTrainees.length === 0 ? (
                      <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <p className="text-gray-500">
                          {(groupId || (templateData && effectiveGroupId))
                            ? "No trainees found in this group"
                            : formData.selectedGroups.length > 0 
                              ? "No trainees found in selected groups" 
                              : "No trainees found"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredTrainees.map((trainee) => (
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
                    );
                  })()}
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
              <div className="flex items-center gap-3">
                {/* Generate with AI Button - Cyan to Purple Gradient */}
                <button
                  onClick={handleGenerateClick}
                  disabled={isLoading}
                  className={`
                    relative overflow-hidden px-5 py-2.5 rounded-full font-semibold text-sm
                    text-white transition-all duration-300 flex items-center gap-2
                    shadow-md hover:shadow-lg
                    ${isLoading 
                      ? 'cursor-wait opacity-90' 
                      : 'hover:scale-105 active:scale-100'
                    }
                  `}
                  style={{
                    background: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse font-semibold">
                        Generating...
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Magic Wand Icon */}
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4L22 2zm-8.66 10.78l2.44-2.44c.2-.2.2-.51 0-.71l-2.37-2.37c-.2-.2-.51-.2-.71 0l-2.44 2.44-5.66-5.66c-.59-.59-1.54-.59-2.12 0L1.17 5.36c-.59.58-.59 1.53 0 2.12l5.66 5.66-2.44 2.44c-.2.2-.2.51 0 .71l2.37 2.37c.2.2.51.2.71 0l2.44-2.44 5.66 5.66c.59.59 1.54.59 2.12 0l1.31-1.31c.59-.59.59-1.54 0-2.12l-5.66-5.67z"/>
                      </svg>
                      <span className="font-semibold">
                        Generate
                      </span>
                    </>
                  )}
                </button>
                
                <Button 
                  onClick={addMCQ} 
                  size="sm" 
                  variant="outline"
                  className="group hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                  Add Question
                </Button>
              </div>
            </div>

            {/* AI Generation Loading Message */}
            {isLoading && (
              <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-lg p-8">
                <div className="flex flex-col items-center gap-6">
                  {/* Animated AI Icon with Gradient */}
                  <div className="relative">
                    <div 
                      className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)'
                      }}
                    >
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4L22 2zm-8.66 10.78l2.44-2.44c.2-.2.2-.51 0-.71l-2.37-2.37c-.2-.2-.51-.2-.71 0l-2.44 2.44-5.66-5.66c-.59-.59-1.54-.59-2.12 0L1.17 5.36c-.59.58-.59 1.53 0 2.12l5.66 5.66-2.44 2.44c-.2.2-.2.51 0 .71l2.37 2.37c.2.2.51.2.71 0l2.44-2.44 5.66 5.66c.59.59 1.54.59 2.12 0l1.31-1.31c.59-.59.59-1.54 0-2.12l-5.66-5.67z"/>
                      </svg>
                    </div>
                    {/* Spinning ring with gradient colors */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"></div>
                  </div>
                  
                  {/* Loading Text */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Quiz Questions...</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      AI is analyzing your content and creating personalized questions. This may take a moment.
                    </p>
                  </div>
                  
                  {/* Progress Dots with Gradient Colors */}
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  
                  {/* Tip */}
                  <div 
                    className="border-l-4 rounded-lg p-4 w-full"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderColor: '#3B82F6'
                    }}
                  >
                    <p className="text-sm text-gray-700 text-center">
                      <span className="font-semibold">💡 Tip:</span> AI generation works best with detailed, well-structured content!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadingQuizzes && (
              <div className="text-center py-12 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-blue-700 text-lg font-medium">Loading existing quiz questions...</p>
              </div>
            )}

            {!loadingQuizzes && formData.mcqs.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 text-lg">No questions added yet</p>
                <Button onClick={addMCQ} variant="outline" className="mt-4">
                  Add Your First Question
                </Button>
              </div>
            )}

            {!loadingQuizzes && formData.mcqs.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">
                  ✅ {formData.mcqs.length} question{formData.mcqs.length > 1 ? 's' : ''} loaded
                  {editMode && ' from database'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {!loadingQuizzes && formData.mcqs.map((mcq, index) => (
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base ${
                      mcq.question ? 'bg-blue-50' : 'bg-white'
                    }`}
                  />
                  <div className="space-y-3">
                    <label className="block text-base font-medium text-gray-700">
                      Answer Options
                    </label>
                    {mcq.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          mcq.correctAnswer === optIndex 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${mcq.id}`}
                            checked={mcq.correctAnswer === optIndex}
                            onChange={() => updateMCQ(mcq.id, { correctAnswer: optIndex })}
                            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          <span className={`text-sm font-medium ${
                            mcq.correctAnswer === optIndex ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {mcq.correctAnswer === optIndex ? '✓ Correct' : `Option ${optIndex + 1}`}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...mcq.options];
                            newOptions[optIndex] = e.target.value;
                            updateMCQ(mcq.id, { options: newOptions });
                          }}
                          placeholder={`Enter option ${optIndex + 1}`}
                          className={`flex-1 px-3 py-2 border-0 focus:outline-none focus:ring-0 ${
                            mcq.correctAnswer === optIndex ? 'font-medium text-green-900' : 'text-gray-900'
                          } ${
                            option ? (mcq.correctAnswer === optIndex ? 'bg-green-100' : 'bg-blue-50') : 'bg-transparent'
                          }`}
                        />
                      </div>
                    ))}
                    {mcq.correctAnswer !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <CheckCircle className="w-4 h-4" />
                        <span>Correct answer: Option {mcq.correctAnswer + 1} - {mcq.options[mcq.correctAnswer] || '(empty)'}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Add Question Below Button */}
                  <div className="flex justify-center pt-2 border-t border-gray-200">
                    <button
                      onClick={() => addMCQAtIndex(index)}
                      className="group flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
                      title="Add question below"
                    >
                      <svg 
                        className="w-4 h-4 text-gray-700 transition-transform duration-200 group-hover:scale-110" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="text-sm font-normal text-gray-700">
                        Add question below
                      </span>
                    </button>
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
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={handleBack} 
              className="px-8 py-2.5 text-base font-medium"
            >
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button 
              onClick={handleNext}
              className="px-8 py-2.5 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handlePublish}
              disabled={isLoading}
              className="px-8 py-2.5 text-base font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isLoading ? (editMode ? 'Updating...' : 'Publishing...') : (editMode ? 'Update' : 'Publish')}
            </Button>
          )}
        </div>
                  </>
                )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Chat-Style Question Count Dialog */}
    {showQuestionCountDialog && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowQuestionCountDialog(false)}>
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header with Gradient - Clean & Modern */}
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4L22 2zm-8.66 10.78l2.44-2.44c.2-.2.2-.51 0-.71l-2.37-2.37c-.2-.2-.51-.2-.71 0l-2.44 2.44-5.66-5.66c-.59-.59-1.54-.59-2.12 0L1.17 5.36c-.59.58-.59 1.53 0 2.12l5.66 5.66-2.44 2.44c-.2.2-.2.51 0 .71l2.37 2.37c.2.2.51.2.71 0l2.44-2.44 5.66 5.66c.59.59 1.54.59 2.12 0l1.31-1.31c.59-.59.59-1.54 0-2.12l-5.66-5.67z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">AI Quiz Generator</h3>
                <div className="flex items-center gap-1 text-white/90 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <span>Ready to generate</span>
                </div>
              </div>
              <button
                onClick={() => setShowQuestionCountDialog(false)}
                className="text-white hover:text-white/80 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="bg-gray-50 p-6 space-y-4 overflow-y-auto">
            {/* AI Message */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    Hi there! 👋 How many quiz questions would you like me to generate from your content?
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 ml-2">
                  <span className="text-[11px] text-gray-400">Just now</span>
                </div>
              </div>
            </div>

            {/* User Response Area */}
            <div className="flex gap-3 justify-end">
              <div className="flex-1 max-w-sm">
                <div className="bg-blue-500 rounded-2xl rounded-tr-none px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-white font-medium text-sm whitespace-nowrap">
                      I want
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={numQuestionsToGenerate}
                      onChange={(e) => setNumQuestionsToGenerate(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                      className="w-14 h-9 px-2 text-center text-lg font-bold bg-white text-blue-600 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none shadow-sm transition-all"
                      autoFocus
                    />
                    <span className="text-white font-medium text-sm whitespace-nowrap">
                      question{numQuestionsToGenerate !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 mr-2 justify-end">
                  <span className="text-[11px] text-gray-400">You</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Info Tip */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">Tip:</span> You can generate 1-10 questions. More questions = more comprehensive assessment!
              </p>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowQuestionCountDialog(false)}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndGenerate}
                className="relative overflow-hidden px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
                style={{
                  background: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2 8.6 4.5 10 7 7.5 5.6zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14l2.5 1.4zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4L22 2zm-8.66 10.78l2.44-2.44c.2-.2.2-.51 0-.71l-2.37-2.37c-.2-.2-.51-.2-.71 0l-2.44 2.44-5.66-5.66c-.59-.59-1.54-.59-2.12 0L1.17 5.36c-.59.58-.59 1.53 0 2.12l5.66 5.66-2.44 2.44c-.2.2-.2.51 0 .71l2.37 2.37c.2.2.51.2.71 0l2.44-2.44 5.66 5.66c.59.59 1.54.59 2.12 0l1.31-1.31c.59-.59.59-1.54 0-2.12l-5.66-5.67z"/>
                </svg>
                Generate Now
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Custom Alert Modal */}
    {customAlert.show && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4" 
        onClick={closeAlert}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200" 
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '32px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header with Icon and Title */}
          <div className="flex items-center mb-4">
            <div 
              className="flex items-center justify-center flex-shrink-0 mr-3"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#fee2e2'
              }}
            >
              <svg 
                style={{ width: '24px', height: '24px', color: '#dc2626' }} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h2 
              style={{
                margin: 0,
                fontWeight: '700',
                color: '#111827',
                fontSize: '18px',
                lineHeight: '1.5'
              }}
            >
              {customAlert.title}
            </h2>
          </div>

          {/* Message Body */}
          <p 
            className="whitespace-pre-line"
            style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}
          >
            {customAlert.message}
          </p>

          {/* Footer with OK Button */}
          <div className="flex justify-end">
            <button
              onClick={closeAlert}
              className="px-6 py-2 rounded-lg font-medium text-sm text-white transition-all duration-150"
              style={{
                background: '#3b82f6',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

  </>
  );
};

export default AddContentModal;