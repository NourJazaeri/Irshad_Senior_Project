import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Eye, Calendar, FileText, Tag, HelpCircle, Lightbulb, BarChart3, Zap, Target, TrendingUp, Wrench, Trophy, Flame, Users, Award, MapPin, MessageCircle, Link, Clock, AlertCircle, ExternalLink, Download } from 'lucide-react';

import KnowledgeCardsTemplate from '../components/KnowledgeCardsTemplate.jsx';
import RecognitionTemplate from '../components/RecognitionTemplate.jsx';
import EventAnnouncementTemplate from '../components/EventAnnouncementTemplate.jsx';
import TaskRemindersBoardTemplate from '../components/TaskRemindersBoardTemplate.jsx';
import WelcomeIntroTemplate from '../components/WelcomeIntroTemplate.jsx';
import ToolSystemGuideTemplate from '../components/ToolSystemGuideTemplate.jsx';

const ContentView = ({ contentId, onBack, onProgressUpdate, inlineMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use contentId prop if provided (inline mode), otherwise use URL param
  const actualContentId = contentId || id;
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [acknowledgeLoading, setAcknowledgeLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  const [taskUpdateLoading, setTaskUpdateLoading] = useState(false);
  
  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  
  // Alert modal state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Detect user context
  const isSupervisor = window.location.pathname.includes('/supervisor');
  const isTrainee = window.location.pathname.includes('/trainee');

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      if (!actualContentId) return;
      
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        // Use different endpoint for trainees vs admins/supervisors
        const endpoint = isTrainee 
          ? `${API_BASE}/api/content/trainee/view/${actualContentId}`
          : `${API_BASE}/api/content/${actualContentId}`;
        
        console.log('🔍 ContentView Debug:', {
          isTrainee,
          contentId: actualContentId,
          endpoint,
          pathname: window.location.pathname,
          inlineMode
        });
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Content data received:', data);
          setContent(data && data.content ? data.content : data);
          
          // For trainees, also fetch progress data and mark as viewed
          if (isTrainee && data) {
            const progressData = data.progress || data.content?.progress;
            setUserProgress(progressData);
            
            // Mark content as viewed (sets status to "in progress" if not started)
            try {
              const viewResponse = await fetch(`${API_BASE}/api/content/trainee/view/${actualContentId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (viewResponse.ok) {
                const viewData = await viewResponse.json();
                console.log('✅ Content marked as viewed, updated progress:', viewData.progress);
                setUserProgress(viewData.progress);
                
                // Notify parent component to refresh data
                if (onProgressUpdate) {
                  onProgressUpdate();
                }
              }
            } catch (viewError) {
              console.error('Error marking content as viewed:', viewError);
            }
          }
        } else {
          const errorData = await response.text();
          console.error('❌ Failed to fetch content:', response.status, errorData);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (actualContentId) {
      fetchContent();
    }
  }, [actualContentId]);

  // Progress tracking functions for trainees
  const handleAcknowledge = async () => {
    if (!isTrainee) {
      console.log('Not a trainee, cannot acknowledge');
      return;
    }

    if (!content?.ackRequired) {
      console.log('Acknowledgment not required for this content');
      return;
    }
    
    console.log('Acknowledging content with ID:', actualContentId);
    setAcknowledgeLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      console.log('Making acknowledge request to:', `${API_BASE}/api/content/trainee/progress/${actualContentId}`);
      
      const response = await fetch(`${API_BASE}/api/content/trainee/progress/${actualContentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acknowledged: true
        })
      });

      console.log('Acknowledge response status:', response.status);
      console.log('Acknowledge response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Acknowledge response data:', data);
        setUserProgress(data.progress);
        console.log('Content acknowledged successfully:', data);
        
        // Notify parent component to refresh data
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to acknowledge content:', response.status, errorData);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (error) {
      console.error('Error acknowledging content:', error);
    } finally {
      setAcknowledgeLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!isTrainee) {
      console.log('Not a trainee, cannot complete');
      return;
    }

    // Check if already completed
    if (userProgress?.status === 'completed') {
      return;
    }

    // Check if acknowledgment is required but not done
    if (content?.ackRequired && !userProgress?.acknowledged) {
      setAlertMessage('You must acknowledge this content before marking it as complete.');
      setShowAlert(true);
      return;
    }

    // Check if quiz is assigned but not taken
    const hasQuiz = content?.quiz && content.quiz.questions && content.quiz.questions.length > 0;
    const quizTaken = userProgress?.score !== null && userProgress?.score !== undefined;
    if (hasQuiz && !quizTaken) {
      setAlertMessage('You must take the quiz before marking this content as complete.');
      setShowAlert(true);
      return;
    }

    // Check if both acknowledgment and quiz are required
    const needsAck = content?.ackRequired && !userProgress?.acknowledged;
    const needsQuiz = hasQuiz && !quizTaken;
    if (needsAck && needsQuiz) {
      setAlertMessage('You must acknowledge this content and take the quiz before marking it as complete.');
      setShowAlert(true);
      return;
    }

    console.log('Completing content with ID:', actualContentId);
    setCompleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/trainee/progress/${actualContentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
        
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to complete content' }));
        console.error('Failed to complete content:', response.status, errorData);
        
        // Show error message to user
        if (errorData.requiresAcknowledgment || errorData.error?.includes('acknowledge')) {
          setAlertMessage(errorData.error || 'You must acknowledge this content before marking it as complete.');
          setShowAlert(true);
        } else if (errorData.requiresQuiz || errorData.error?.includes('quiz')) {
          setAlertMessage(errorData.error || 'You must take the quiz before marking this content as complete.');
          setShowAlert(true);
        } else {
          setAlertMessage(errorData.error || 'Failed to complete content. Please try again.');
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error('Error completing content:', error);
      setAlertMessage('An error occurred while completing the content. Please try again.');
      setShowAlert(true);
    } finally {
      setCompleteLoading(false);
    }
  };

  // Handle taking quiz
  const handleTakeQuiz = () => {
    if (!isTrainee) {
      console.log('Not a trainee, cannot take quiz');
      return;
    }
    
    // Check if quiz exists
    if (!content?.quiz || !content.quiz.questions || content.quiz.questions.length === 0) {
      alert('No quiz available for this content');
      return;
    }
    
    // Check if quiz was already taken (one attempt only)
    // Quiz is taken if score is not null (even if 0)
    if (content?.quizTaken === true) {
      alert(`You have already taken this quiz and scored ${content?.quizScore}%. Only one attempt is allowed.`);
      return;
    }
    
    console.log('Starting quiz for content ID:', actualContentId);
    setShowQuiz(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (quizSubmitted) return; // Don't allow changes after submission
    
    // Store the option index as a string to avoid issues with duplicate option texts
    // We'll convert it back to text when submitting
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    const totalQuestions = content.quiz.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    
    if (answeredCount < totalQuestions) {
      alert(`Please answer all questions (${answeredCount}/${totalQuestions} answered)`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      // Send option indices (not text) for comparison
      // This ensures that even if two options have the same text, they're compared by position
      const answersAsIndices = {};
      Object.keys(selectedAnswers).forEach(questionIndex => {
        const optionIndex = selectedAnswers[questionIndex];
        // Store as number (index) not text
        answersAsIndices[questionIndex] = parseInt(optionIndex);
      });
      
      const response = await fetch(`${API_BASE}/api/content/trainee/content/${actualContentId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: answersAsIndices })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Quiz submitted:', data);
        setQuizResults(data);
        setQuizSubmitted(true);
        
        // Update content to mark quiz as taken
        setContent(prev => ({
          ...prev,
          quizTaken: true,
          quizScore: data.score
        }));
        
        // Update progress to reflect quiz completion
        setUserProgress(prev => ({
          ...prev,
          score: data.score
        }));
        
        // Notify parent to refresh
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      } else {
        const error = await response.json();
        
        // Handle already taken quiz
        if (error.alreadyTaken) {
          alert(`You have already taken this quiz and scored ${error.score}%. Only one attempt is allowed.`);
          setShowQuiz(false);
          
          // Update local state to reflect quiz was taken
          setContent(prev => ({
            ...prev,
            quizTaken: true,
            quizScore: error.score
          }));
          
          setUserProgress(prev => ({
            ...prev,
            score: error.score
          }));
        } else {
          alert('Failed to submit quiz: ' + (error.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    }
  };

  // Navigate between questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < content.quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < content?.quiz?.questions?.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
    setQuizSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizResults(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get status for deadline
  const getDeadlineStatus = () => {
    if (!content?.deadline) return null;
    
    const dueDate = new Date(content.deadline);
    const currentDate = new Date();
    const daysDiff = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return { text: 'Overdue', color: 'text-red-600' };
    } else if (daysDiff <= 3) {
      return { text: 'Due Soon', color: 'text-yellow-600' };
    }
    return null;
  };

  // Normalize a possibly relative URL to an absolute one pointing to API_BASE
  const toAbsoluteUrl = (url) => {
    if (!url) return url;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    } catch {
      return url;
    }
  };

  // Handle task/step completion toggle
  // Handle task/step completion toggle
  const handleTaskCompletion = async (itemId, newCompletionStatus, itemType = 'tasks') => {
    if (!content || taskUpdateLoading) return;

    setTaskUpdateLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

      let updatedTemplateData;

      if (itemType === 'tasks') {
        // Handle tasks for Task Reminders Board
        const currentTask = content.templateData.tasks?.find(task => task.id === itemId);
        if (!currentTask) return;

        const completionStatus = newCompletionStatus !== undefined ? newCompletionStatus : !currentTask.completed;

        const updatedTasks = content.templateData.tasks.map(task => {
          if (task.id === itemId) {
            return { ...task, completed: completionStatus };
          }
          return task;
        });

        updatedTemplateData = {
          ...content.templateData,
          tasks: updatedTasks
        };
      } else if (itemType === 'steps') {
        // Handle steps for Tool/System Guide
        const updatedSteps = content.templateData.steps?.map((step, stepIndex) => {
          // Use step.id if available, otherwise use index comparison
          const stepIdentifier = step.id !== undefined ? step.id : stepIndex;
          
          if (stepIdentifier === itemId) {
            return { ...step, completed: newCompletionStatus };
          }
          return step;
        });

        updatedTemplateData = {
          ...content.templateData,
          steps: updatedSteps
        };
      }

      // Update the actual Content document using the existing progress endpoint
      const response = await fetch(`${API_BASE}/api/content/trainee/progress/${actualContentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateData: updatedTemplateData
        })
      });

      if (response.ok) {
        // Update local content state for immediate UI feedback
        setContent(prev => ({
          ...prev,
          templateData: updatedTemplateData
        }));

        console.log(`✅ ${itemType === 'tasks' ? 'Task' : 'Step'} completion status updated successfully in Content database`);
      } else {
        const errorData = await response.json();
        console.error(`❌ Failed to update ${itemType === 'tasks' ? 'task' : 'step'} completion status:`, errorData);
      }
    } catch (error) {
      console.error(`Error updating ${itemType === 'tasks' ? 'task' : 'step'} completion:`, error);
    } finally {
      setTaskUpdateLoading(false);
    }
  };

  // Helper functions for Knowledge Cards icons
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Lightbulb': Lightbulb,
      'BarChart3': BarChart3,
      'Zap': Zap,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'Wrench': Wrench
    };
    
    const IconComponent = iconMap[iconName] || Lightbulb;
    return <IconComponent size={24} />;
  };

  const getIconBgColor = (iconName) => {
    const colorMap = {
      'Lightbulb': '#fef3c7',
      'BarChart3': '#dbeafe',
      'Zap': '#fef3c7',
      'Target': '#fce7f3',
      'TrendingUp': '#d1fae5',
      'Wrench': '#e0e7ff'
    };
    return colorMap[iconName] || '#fef3c7';
  };

  const getIconColor = (iconName) => {
    const colorMap = {
      'Lightbulb': '#d97706',
      'BarChart3': '#2563eb',
      'Zap': '#f59e0b',
      'Target': '#ec4899',
      'TrendingUp': '#059669',
      'Wrench': '#6366f1'
    };
    return colorMap[iconName] || '#d97706';
  };

  // Helper functions for Event Announcement icons
  const getEventIconComponent = (iconName) => {
    const iconMap = {
      'Flame': Flame,
      'Target': Target,
      'Users': Users,
      'Award': Award
    };
    
    const IconComponent = iconMap[iconName] || Flame;
    return <IconComponent size={20} />;
  };

  const getEventIconBgColor = (iconName) => {
    const colorMap = {
      'Flame': '#fef3c7',
      'Target': '#fce7f3',
      'Users': '#dbeafe',
      'Award': '#d1fae5'
    };
    return colorMap[iconName] || '#f3f4f6';
  };

  const getEventIconColor = (iconName) => {
    const colorMap = {
      'Flame': '#f59e0b',
      'Target': '#ec4899',
      'Users': '#2563eb',
      'Award': '#059669'
    };
    return colorMap[iconName] || '#6b7280';
  };

  // Render template content - see attached file for complete implementation
  const renderTemplateContent = (templateData) => {
    if (!templateData) return <p className="text-muted-foreground">No template data available</p>;

    console.log('🎯 Template Debug:', {
      templateData,
      keys: Object.keys(templateData),
      type: templateData.type,
      title: templateData.title,
      templateType: templateData.templateType,
      contentType: content?.type
    });

    // First check explicit template type
    let templateType = templateData.type;
    
    // If no explicit type, try to infer from content.type or templateData structure
    if (!templateType) {
      templateType = content?.type;
    }
    
    // Handle various naming conventions
    if (templateType === 'Knowledge Cards/Quick Facts' || 
        (templateData.facts && Array.isArray(templateData.facts))) {
      templateType = 'knowledge-cards';
    } else if (templateType === 'Recognition' || 
               templateType === 'Recognition & Achievement Highlights' ||
               templateData.awardType || 
               templateData.employeeName || 
               templateData.achievementTitle) {
      templateType = 'recognition';
    } else if (templateType === 'Event Announcement' || 
               templateType === 'Event/Announcement Post' ||
               templateData.eventTitle || 
               templateData.eventDate || 
               templateData.eventLocation ||
               (templateData.highlights && Array.isArray(templateData.highlights))) {
      templateType = 'event-announcement';
    } else if (templateType === 'Tool/System Guide' || 
               templateType === 'Tool & System Guide' ||
               templateData.toolName || 
               templateData.guideTitle ||
               (templateData.steps && Array.isArray(templateData.steps))) {
      templateType = 'tool-system-guide';
    } else if (templateType === 'Task Reminders Board' || 
               templateType === 'Weekly Task Reminders' ||
               templateData.boardTitle || 
               (templateData.tasks && Array.isArray(templateData.tasks))) {
      templateType = 'task-reminders-board';
    } else if (templateType === 'Welcome/Intro' || 
               templateType === 'Welcome & Introduction Message' ||
               templateData.welcomeHeader || 
               templateData.greeting || 
               templateData.mainMessage ||
               (templateData.highlightItems && Array.isArray(templateData.highlightItems))) {
      templateType = 'welcome-intro';
    }

    console.log('🎯 Final template type:', templateType);

    // For non-trainee users (admin/supervisor), use the original template components
    if (!isTrainee) {
      const handleClose = () => {
        navigate(-1); // Go back to previous page
      };
      
      switch(templateType) {
        case 'knowledge-cards':
          return <KnowledgeCardsTemplate onClose={handleClose} onTemplateSaved={() => {}} isReadOnly={true} templateData={templateData} />;
        case 'recognition':
          return <RecognitionTemplate onClose={handleClose} onTemplateSaved={() => {}} formData={templateData} isReadOnly={true} />;
        case 'event-announcement':
          return <EventAnnouncementTemplate onClose={handleClose} onTemplateSaved={() => {}} formData={templateData} isReadOnly={true} />;
        case 'tool-system-guide':
          return <ToolSystemGuideTemplate onClose={handleClose} onTemplateSaved={() => {}} templateData={templateData} isReadOnly={true} />;
        case 'task-reminders-board':
          return <TaskRemindersBoardTemplate onClose={handleClose} onTemplateSaved={() => {}} templateData={templateData} isReadOnly={true} />;
        case 'welcome-intro':
          return <WelcomeIntroTemplate onClose={handleClose} onTemplateSaved={() => {}} templateData={templateData} isReadOnly={true} />;
        default:
          return <p className="text-muted-foreground">Unknown template type: {templateType}</p>;
      }
    }

    // For trainee users, render inline with full styling
    switch(templateType) {
      case 'knowledge-cards':
        return (
          <div className="inline-template-content">
            <div className="knowledge-cards-inline p-6">
              <div className="header-section mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {templateData.title || 'Knowledge Cards/Quick Facts'}
                </h2>
                <p className="text-gray-600">
                  {templateData.description || 'Create quick reference cards with essential information'}
                </p>
              </div>
              <div className="facts-section">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(templateData.facts || []).map(fact => (
                    <div key={fact.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-center w-16 h-16 rounded-lg mb-4 mx-auto" 
                           style={{ 
                             backgroundColor: getIconBgColor(fact.iconName),
                             color: getIconColor(fact.iconName)
                           }}>
                        {getIconComponent(fact.iconName)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 text-center mb-3">
                        {fact.title}
                      </h3>
                      <p className="text-gray-600 text-sm text-center leading-relaxed">
                        {fact.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'recognition':
        return (
          <div className="inline-template-content">
            <div className="recognition-inline p-6">
              <div className="recognition-header mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {templateData.title || 'Recognition & Achievement Highlights'}
                </h2>
                <p className="text-gray-600">
                  {templateData.description || 'Celebrate team achievements and recognize outstanding contributions'}
                </p>
              </div>

              <div className="award-banner bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-6 border border-yellow-200">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Trophy size={32} className="text-yellow-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">
                      {templateData.awardType || 'Employee of the Month'}
                    </h3>
                    <p className="text-gray-600">
                      {templateData.awardDate ? new Date(templateData.awardDate + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'October 2025'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="employee-card bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="employee-info flex items-start gap-4 mb-6">
                  <div className="employee-avatar">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      👤
                    </div>
                  </div>
                  <div className="employee-details flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {templateData.employeeName || 'Sarah Johnson'}
                    </h3>
                    <p className="text-gray-600">
                      {templateData.employeeRole || 'Senior Software Engineer'}
                    </p>
                  </div>
                </div>

                <div className="achievement-section space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {templateData.achievementTitle || 'Outstanding Achievement'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {templateData.achievementDescription || 
                        `Sarah has consistently delivered exceptional work, leading the successful launch of three major features this quarter. Her dedication, innovative problem-solving, and collaborative spirit have been instrumental to our team's success.`}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2">Key Accomplishments:</h5>
                    <div className="text-gray-700 whitespace-pre-line">
                      {templateData.keyAccomplishments || 
                        `Key accomplishments:
• Led migration to new architecture
• Improved system performance by 40%
• Mentored junior developers`}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <p className="text-gray-700 italic">
                      {templateData.congratulationsMessage || 
                        `Congratulations, Sarah! Your hard work and dedication inspire us all. Thank you for your outstanding contributions to our team! 🎉`}
                    </p>
                    <div className="mt-3 text-right">
                      <span className="text-gray-600 font-medium">
                        — {templateData.signatureTeam || 'The Leadership Team'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'event-announcement':
        return (
          <div className="inline-template-content">
            <div className="event-announcement-inline p-6">
              <div className="event-card bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="event-card-inner">
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    {templateData.eventTitle || 'Annual Company Conference 2025'}
                  </h3>
                  
                  <div className="event-meta flex gap-8 mb-6">
                    <div className="meta-item flex items-center gap-3">
                      <div className="meta-icon p-2 bg-indigo-100 rounded-lg">
                        <Calendar size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 font-medium">Date</span>
                        <div className="font-semibold text-gray-900 text-lg">
                          {templateData.eventDate ? 
                            new Date(templateData.eventDate).toLocaleDateString('en-US', { 
                              month: 'numeric', 
                              day: 'numeric', 
                              year: 'numeric' 
                            }) : 
                            '11/15/2025'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="meta-item flex items-center gap-3">
                      <div className="meta-icon p-2 bg-pink-100 rounded-lg">
                        <MapPin size={20} className="text-pink-600" />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 font-medium">Location</span>
                        <div className="font-semibold text-gray-900 text-lg">
                          {templateData.eventLocation || 'Grand Convention Center'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="event-details-section">
                    <h4 className="text-sm font-bold text-gray-600 mb-4 tracking-widest uppercase">
                      EVENT DETAILS
                    </h4>
                    
                    <p className="text-gray-700 leading-relaxed mb-8 text-base">
                      {templateData.eventDescription || 
                        'Join us for our biggest event of the year! Network with industry leaders, attend inspiring workshops, and celebrate our collective achievements.'}
                    </p>

                    <div className="event-highlights space-y-4 mb-8">
                      {(templateData.highlights || [
                        { iconName: 'Flame', text: 'Keynote speakers' },
                        { iconName: 'Target', text: 'Interactive workshops' },
                        { iconName: 'Users', text: 'Networking sessions' },
                        { iconName: 'Award', text: 'Awards ceremony' }
                      ]).map((highlight, index) => (
                        <div key={index} className="highlight-item flex items-center gap-4">
                          <div className="highlight-icon flex items-center justify-center w-10 h-10 rounded-lg"
                               style={{ 
                                 backgroundColor: getEventIconBgColor(highlight.iconName),
                                 color: getEventIconColor(highlight.iconName)
                               }}>
                            {getEventIconComponent(highlight.iconName)}
                          </div>
                          <span className="highlight-text text-gray-700 text-base">
                            {highlight.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="audience-section flex items-center gap-4">
                      <div className="audience-icon p-2 bg-indigo-100 rounded-lg">
                        <Users size={24} className="text-indigo-600" />
                      </div>
                      <span className="text-gray-700 text-base">
                        {templateData.audienceInfo || 'Open to all employees'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'task-reminders-board':
        return (
          <div className="inline-template-content">
            <div className="task-reminders-inline p-6">
              <div className="task-board-content bg-white border-2 border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="board-header p-6 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {templateData.title || 'Weekly Task Reminders'}
                  </h2>
                  <p className="text-gray-600">
                    {templateData.subtitle || 'Click on any card to edit description'}
                  </p>
                </div>

                <div className="tasks-section p-6">
                  <div className="tasks-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(templateData.tasks || [
                      {
                        id: 1,
                        title: 'Complete quarterly review',
                        description: 'Prepare presentation and gather team feedback',
                        priority: 'HIGH',
                        date: '2025-11-01',
                        priorityColor: '#FF6B6B',
                        completed: false
                      },
                      {
                        id: 2,
                        title: 'Update training materials',
                        description: 'Review and revise onboarding documentation',
                        priority: 'MEDIUM',
                        date: '2025-11-05',
                        priorityColor: '#FFD93D',
                        completed: false
                      },
                      {
                        id: 3,
                        title: 'Team building event planning',
                        description: 'Organize monthly team activity and send invites',
                        priority: 'LOW',
                        date: '2025-11-10',
                        priorityColor: '#6BCF7F',
                        completed: false
                      }
                    ]).map((task) => {
                      const isCompleted = task.completed || false;
                      
                      return (
                      <div key={task.id} className={`task-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${isCompleted ? 'opacity-60' : ''}`}>
                        <div className="task-card-header flex justify-between items-start mb-3">
                          <div 
                            className="priority-badge px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: task.priorityColor }}
                          >
                            {task.priority}
                          </div>
                          <div className="task-checkbox">
                            <input 
                              type="checkbox" 
                              checked={isCompleted}
                              onChange={(e) => handleTaskCompletion(task.id, e.target.checked, 'tasks')}
                              disabled={taskUpdateLoading}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                            />
                          </div>
                        </div>

                        <div className="task-content mb-4 flex-grow">
                          <h3 className={`task-title font-semibold text-gray-900 mb-2 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h3>
                          
                          <p className={`task-description text-sm text-gray-600 leading-relaxed ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            {task.description}
                          </p>
                        </div>

                        <div className="task-footer mt-auto">
                          <div className={`task-date flex items-center gap-2 text-sm text-gray-500 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                            <Calendar size={16} className="text-indigo-600" />
                            <span>
                              {task.date ? 
                                new Date(task.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                }) : 
                                'No date'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'welcome-intro':
        return (
          <div className="inline-template-content">
            <div className="welcome-intro-inline p-6">
              <div className="welcome-card bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="welcome-card-header text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {templateData.welcomeHeader || 'Welcome to Our Team!'}
                  </h2>
                  <div className="w-16 h-1 bg-purple-500 rounded-full mx-auto"></div>
                </div>

                <div className="welcome-content space-y-4">
                  <div className="greeting text-base text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                    {templateData.greeting || 'Dear Team,'}
                  </div>

                  <div className="main-message text-gray-700 leading-relaxed bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line">
                    {templateData.mainMessage || 
                      `We're thrilled to have you join us! This is the beginning of an exciting journey together, and we can't wait to see all the amazing things we'll accomplish as a team.

Your unique skills and perspective will be invaluable as we work towards our shared goals. We believe in fostering a collaborative`}
                  </div>

                  <div className="highlight-section bg-blue-50 p-4 rounded border border-blue-200 space-y-3">
                    {(templateData.highlightItems || [
                      { id: 1, icon: 'calendar', text: 'First team meeting: Monday at 10 AM' },
                      { id: 2, icon: 'chat', text: 'Questions? Email us at team@company.com' },
                      { id: 3, icon: 'link', text: 'Access your onboarding portal: company.com/onboard' }
                    ]).map(item => (
                      <div key={item.id} className="highlight-item flex items-center gap-3">
                        <div className="highlight-icon">
                          {item.icon === 'calendar' ? (
                            <Calendar size={18} className="text-indigo-600" />
                          ) : item.icon === 'chat' ? (
                            <MessageCircle size={18} className="text-indigo-600" />
                          ) : (
                            <Link size={18} className="text-gray-600" />
                          )}
                        </div>
                        <span className="highlight-text text-gray-700 text-sm">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="closing-message text-gray-700 leading-relaxed bg-gray-50 p-3 rounded border border-gray-200">
                    {templateData.closingMessage || 'Welcome aboard! We\'re excited to have you as part of our team.'}
                  </div>

                  <div className="signature-section bg-white p-4 rounded border border-gray-200">
                    <div className="signature text-gray-700 mb-2">
                      {templateData.signature || 'Best regards,'}
                    </div>
                    
                    <div className="signature-details flex justify-between items-center">
                      <div className="signature-name font-semibold text-gray-900">
                        {templateData.signatureName || 'The Leadership Team'}
                      </div>
                      <div className="signature-date text-gray-500 text-sm flex items-center gap-2">
                        <span>
                          {templateData.date ? 
                            templateData.date.replace(/-/g, '/').replace(/(\d{4})\/(\d{2})\/(\d{2})/, '$2/$3/$1') :
                            'mm/dd/yyyy'
                          }
                        </span>
                        <Calendar size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tool-system-guide':
        return (
          <div className="inline-template-content">
            <div className="tool-guide-container max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="tool-guide-header text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{templateData.guideTitle || 'Tool/System Guide'}</h1>
                <p className="text-gray-600">Create step-by-step guides for tools and systems</p>
              </div>

              <div className="guide-content">
                <div className="guide-title-section mb-8">
                  <div className="guide-main-title-display text-2xl font-bold text-gray-900 mb-4">
                    {templateData.guideTitle || 'Project Management Tool Guide'}
                  </div>
                  <div className="guide-subtitle-display text-gray-600 leading-relaxed">
                    {templateData.guideSubtitle || 'Learn how to use our project management system to track tasks, collaborate with your team, and deliver projects on time.'}
                  </div>
                </div>

                <div className="steps-section space-y-4 mb-8">
                  {(templateData.steps || []).map((step, index) => {
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    const stepNumber = index + 1;
                    const stepIdentifier = step.id !== undefined ? step.id : index;
                    
                    return (
                      <div key={step.id || index} className={`step-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${step.completed ? 'opacity-75' : ''}`}>
                        <div className="step-header flex items-center gap-4 mb-3">
                          <div 
                            className="step-number w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: colors[index % colors.length] }}
                          >
                            {stepNumber}
                          </div>
                          <div className={`step-title-display text-lg font-semibold text-gray-900 ${step.completed ? 'line-through text-gray-500' : ''}`}>
                            {step.title || `Step ${stepNumber}: Getting Started`}
                          </div>
                        </div>
                        
                        <div className={`step-description-display text-gray-700 leading-relaxed mb-4 ml-12 ${step.completed ? 'line-through text-gray-500' : ''}`}>
                          {step.description || 'Detailed instructions for this step. Include specific actions, tips, and any important notes.'}
                        </div>
                        
                        <div className="step-checkbox ml-12">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                            <input 
                              type="checkbox"
                              id={`step-${stepIdentifier}`}
                              checked={step.completed || false}
                              onChange={(e) => {
                                if (isTrainee) {
                                  handleTaskCompletion(stepIdentifier, e.target.checked, 'steps');
                                }
                              }}
                              disabled={!isTrainee}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">Mark as completed</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(templateData.steps?.length < 5) && (
                    <div className="add-step-section text-center">
                      <button className="add-step-btn inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed" disabled>
                        <span className="plus-icon">+</span>
                        Add Step
                      </button>
                    </div>
                  )}
                </div>

                <div className="help-section bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="help-title-display text-lg font-semibold text-gray-900 mb-4">
                    {templateData.needHelpTitle || 'Need Help?'}
                  </div>
                  
                  <div className="help-items space-y-3">
                    <div className="help-item flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                      <span className="help-icon flex-shrink-0">
                        <svg width="20" height="20" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div className="help-text-display text-gray-700">
                        {templateData.helpEmail || 'Email: support@company.com'}
                      </div>
                    </div>
                    
                    <div className="help-item flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                      <span className="help-icon flex-shrink-0">
                        <svg width="20" height="20" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </span>
                      <div className="help-text-display text-gray-700">
                        {templateData.helpSlack || 'Slack: #help-desk'}
                      </div>
                    </div>
                    
                    <div className="help-item flex items-center gap-3 p-3 bg-white rounded border border-gray-200">
                      <span className="help-icon flex-shrink-0">
                        <svg width="20" height="20" fill="none" stroke="#059669" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </span>
                      <div className="help-text-display text-gray-700">
                        {templateData.helpDocs || 'Documentation: docs.company.com'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <p className="text-muted-foreground">Unknown template type: {templateType}</p>;
    }
  };

  const renderContent = () => {
    if (!content) return null;

    // Check if this is template content
    if (content.contentType === 'template' && content.templateData) {
      return renderTemplateContent(content.templateData);
    }

    // Debug logging
    console.log('Content type debug:', {
      type: content.type,
      contentType: content.contentType,
      contentUrl: content.contentUrl,
      url: content.url,
      linkUrl: content.linkUrl,
      fileUrl: content.fileUrl,
      title: content.title,
      allKeys: Object.keys(content)
    });
    
    console.log('🔍 IMAGE DETECTION DEBUG:');
    console.log('🔍 Content object:', content);
    console.log('🔍 Content type from DB:', content.contentType);
    console.log('🔍 Content URL:', content.contentUrl);

    // Infer type from URL when missing
    const inferTypeFromUrl = (url) => {
      if (!url) return 'unknown';
      const lower = url.toLowerCase();
      console.log('Inferring type from URL:', url, '->', lower);
      
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        console.log('Detected YouTube URL');
        return 'youtube';
      }
      
      const extMatch = lower.match(/\.([^.?]+)(?:\?|$)/);
      const ext = extMatch ? extMatch[1] : '';
      console.log('File extension detected:', ext);
      
      if (['pdf'].includes(ext)) {
        console.log('Detected PDF');
        return 'pdf';
      }
      if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) {
        console.log('Detected image from extension:', ext);
        return 'image';
      }
      
      // Additional image detection - check for image-related patterns in URL
      if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') || 
          lower.includes('img') || lower.includes('gallery') || lower.includes('media')) {
        console.log('Detected image from URL pattern');
        return 'image';
      }
      if (['mp4','avi','mov','wmv','flv','webm','mkv'].includes(ext)) {
        console.log('Detected video');
        return 'video';
      }
      if (lower.startsWith('http')) {
        console.log('Detected link');
        return 'link';
      }
      
      console.log('Could not determine type, returning unknown');
      return 'unknown';
    };

    // Get the URL from various possible field names
    const contentUrl = content.contentUrl || content.url || content.linkUrl || content.fileUrl;
    console.log('Content URL found:', contentUrl);

    // Use the best-available type with enhanced image detection
    const inferredType = inferTypeFromUrl(contentUrl);
    
    // Enhanced image detection - check multiple conditions
    const isImageByExtension = (url) => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].some(ext => lower.includes(`.${ext}`));
    };
    
    const isImageByContentType = (type) => {
      return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'image'].includes(type?.toLowerCase());
    };
    
    // Prioritize image detection - if it looks like an image, treat it as image
    let actualType = content.type || content.contentType || inferredType || 'unknown';
    
    if (isImageByExtension(contentUrl) || isImageByContentType(content.contentType)) {
      actualType = 'image';
      console.log('🖼️ FORCED IMAGE TYPE - URL or contentType indicates image');
    }
    
    console.log('🔍 TYPE DETECTION RESULTS:');
    console.log('🔍 Content type from DB:', content.contentType);
    console.log('🔍 Inferred type from URL:', inferredType);
    console.log('🔍 Is image by extension:', isImageByExtension(contentUrl));
    console.log('🔍 Is image by contentType:', isImageByContentType(content.contentType));
    console.log('🔍 Final actual type:', actualType);
    console.log('🔍 Will render as:', actualType === 'image' ? 'IMAGE INLINE' : 'OTHER TYPE');

    // Always work with an absolute URL for rendering
    const resourceUrl = toAbsoluteUrl(contentUrl);

    console.log('🔍 FINAL TYPE DECISION:', actualType);

    switch (actualType) {
      case 'youtube':
        console.log('🎥 Rendering YouTube content:', {
          type: content.type,
          youtubeVideoId: content.youtubeVideoId,
          contentUrl: resourceUrl,
          title: content.title,
          videoIdLength: content.youtubeVideoId?.length,
          isYouTubeUrl: resourceUrl?.includes('youtube.com') || resourceUrl?.includes('youtu.be')
        });
        
        // Extract video ID from URL if not present in content
        const extractVideoId = (url) => {
          if (!url) return null;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        
        const videoId = content.youtubeVideoId || extractVideoId(resourceUrl);
        console.log('Video ID found:', videoId);
        
        // Check if we have a valid YouTube video ID
        if (videoId && videoId.length === 11) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-full h-[600px] aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=0&controls=1`}
                  title={content.title}
                  className="w-full h-full rounded-lg shadow-2xl"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  onError={(e) => {
                    console.error('YouTube iframe error:', e);
                  }}
                />
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-center p-8">
              <div className="text-red-500 text-lg mb-4">⚠️ Invalid YouTube Video ID</div>
              <p className="text-muted-foreground mb-4">
                The video ID "{videoId}" is not valid. 
                YouTube video IDs should be 11 characters long.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Original URL: {resourceUrl}</p>
                <Button
                  variant="outline"
                  onClick={() => window.open(resourceUrl, '_blank')}
                  className="text-xs"
                >
                  Open Original URL
                </Button>
              </div>
            </div>
          );
        }

      case 'pdf':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-[850px]">
              <iframe
                src={resourceUrl}
                title={content.title}
                className="w-full h-full rounded-lg shadow-2xl"
                frameBorder="0"
                onError={(e) => {
                  console.error('PDF iframe error:', e);
                }}
              />
            </div>
          </div>
        );

      case 'image':
        console.log('🖼️ Rendering image:', {
          resourceUrl,
          title: content.title,
          contentType: content.contentType,
          actualType
        });
        
        return (
          <div className="w-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-center">
              <div className="relative group">
                <img
                  src={resourceUrl}
                  alt={content.title}
                  className="max-w-full h-auto object-contain rounded-lg shadow-2xl"
                  style={{ maxHeight: '80vh' }}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  title={content.title}
                />
                {/* Fallback for failed images */}
                <div className="hidden items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-gray-600">Image failed to load</p>
                    <button 
                      onClick={() => window.open(resourceUrl, '_blank')}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-[600px]">
              <video
                src={resourceUrl}
                title={content.title}
                className="w-full h-full rounded-lg shadow-2xl"
                controls
                onError={(e) => {
                  console.error('Video load error:', e);
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        );

      case 'link':
        // Check if this is actually a YouTube URL that was misclassified
        const isYouTubeUrl = resourceUrl && (resourceUrl.includes('youtube.com') || resourceUrl.includes('youtu.be'));
        
        if (isYouTubeUrl) {
          // Extract video ID from YouTube URL
          const extractVideoId = (url) => {
            if (!url) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
          };
          
          const videoId = extractVideoId(resourceUrl);
          console.log('🎥 Detected YouTube URL in link case, video ID:', videoId);
          
          if (videoId) {
            return (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-full h-full max-w-6xl max-h-[80vh] aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0&autoplay=0&controls=1`}
                    title={content.title}
                    className="w-full h-full rounded-lg shadow-2xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    onError={(e) => {
                      console.error('YouTube iframe error:', e);
                    }}
                  />
                </div>
              </div>
            );
          }
        }
        
        // Regular link display - Use iframe to view directly at reduced height
        return (
          <div className="w-full h-[350px]">
            <iframe
              src={resourceUrl}
              title={content.title}
              className="w-full h-full border-0 rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={(e) => {
                console.error('Link iframe error:', e);
              }}
            />
          </div>
        );

      default:
        // For unknown types, show fallback options
        const getFileExtension = (url) => {
          if (!url) return 'unknown';
          const match = url.match(/\.([^.?]+)(?:\?|$)/);
          return match ? match[1].toLowerCase() : 'unknown';
        };
        
        const fileExtension = getFileExtension(resourceUrl);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
        const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(fileExtension);
        const isDocument = ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(fileExtension);
        
        // If it's clearly an image, render it as image directly
        if (isImage) {
          console.log('🖼️ FALLBACK: Rendering as image despite unknown type');
          return (
            <div className="w-full flex flex-col items-center justify-center">
              <div className="w-full max-w-6xl flex items-center justify-center">
                <div className="relative group">
                  <img
                    src={resourceUrl}
                    alt={content.title}
                    className="max-w-full h-auto object-contain rounded-lg shadow-2xl cursor-pointer transition-transform duration-200 hover:scale-105"
                    style={{ maxHeight: '80vh' }}
                    onError={(e) => {
                      console.error('Image load error:', e);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onClick={() => {
                      window.open(resourceUrl, '_blank');
                    }}
                    title="Click to view full-screen"
                  />
                  {/* Fallback for failed images */}
                  <div className="hidden items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-gray-600">Image failed to load</p>
                      <button 
                        onClick={() => window.open(resourceUrl, '_blank')}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">{content.title}</h3>
            
            {content.description && (
              <p className="text-lg text-muted-foreground mb-6">{content.description}</p>
            )}
            
            <div className="mb-6">
              <p className="text-lg text-muted-foreground mb-4">
                Content type: <strong className="text-primary">{actualType}</strong> 
                {fileExtension !== 'unknown' && ` (${fileExtension})`}
              </p>
              
              {isImage && (
                <div className="text-green-600 text-lg mb-4">
                  <p className="mb-2">This appears to be an image file.</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        // Force render as image by updating the content type
                        const img = new Image();
                        img.src = resourceUrl;
                        img.onload = () => {
                          // Replace the current content with image display
                          const container = document.querySelector('.fullscreen-content-viewer');
                          if (container) {
                            const imageContainer = document.createElement('div');
                            imageContainer.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center">
                                <div class="w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
                                  <img src="${resourceUrl}" alt="${content.title}" 
                                       class="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer"
                                       onclick="window.open('${resourceUrl}', '_blank')"
                                       title="Click to view full-screen" />
                                </div>
                              </div>
                            `;
                            const contentDisplay = container.querySelector('.flex-1');
                            if (contentDisplay) {
                              contentDisplay.innerHTML = '';
                              contentDisplay.appendChild(imageContainer);
                            }
                          }
                        };
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
                    >
                      View as Image
                    </button>
                    <button
                      onClick={() => window.open(resourceUrl, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Open in New Tab
                    </button>
                  </div>
                </div>
              )}
              
              {isVideo && (
                <p className="text-blue-600 text-lg mb-4">
                  This appears to be a video file. Try playing it directly.
                </p>
              )}
              
              {isDocument && (
                <p className="text-purple-600 text-lg mb-4">
                  This appears to be a document. Try opening it directly.
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={() => window.open(resourceUrl, '_blank')}
                className="bg-primary hover:bg-primary-hover text-lg px-6 py-3 mr-4"
              >
                Open in New Tab
              </Button>
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = resourceUrl;
                  link.download = content.title + (fileExtension !== 'unknown' ? `.${fileExtension}` : '');
                  link.click();
                }}
                variant="outline"
                className="text-lg px-6 py-3"
              >
                Download File
              </Button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    const backRoute = isTrainee ? '/trainee' : isSupervisor ? '/supervisor/content' : '/admin/content';
    
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-6">The content you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(backRoute)} className="bg-primary hover:bg-primary-hover">
            {isTrainee ? 'Back to Dashboard' : 'Back to Content Library'}
          </Button>
        </div>
      </div>
    );
  }

  // Trainee view with progress tracking
  if (isTrainee) {
    // Show quiz page if quiz is active
    if (showQuiz && content?.quiz?.questions) {
      return (
        <>
          <div className="w-full px-6 pb-6">
            {/* Header */}
            <div className="bg-white border border-gray-200 px-6 py-4 mb-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={closeQuiz}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Content
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quiz: {content?.title}
                </h1>
                <div className="w-24"></div> {/* Spacer for centering */}
              </div>
            </div>

            {/* Quiz Content */}
            {!quizSubmitted ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-4xl mx-auto">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1} of {content.quiz.questions.length}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {Object.keys(selectedAnswers).length} / {content.quiz.questions.length} answered
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / content.quiz.questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-lg font-medium text-gray-900 mb-6">
                    {content.quiz.questions[currentQuestionIndex].questionText}
                  </p>

                  <div className="space-y-3">
                    {content.quiz.questions[currentQuestionIndex].options?.map((optionText, index) => {
                      const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                      // Compare by index directly to handle duplicate option texts correctly
                      const selectedOptionIndex = selectedAnswers[currentQuestionIndex];
                      const isSelected = selectedOptionIndex === index;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="font-medium text-gray-700">{optionLetter}.</span>
                            <span className="text-gray-900">{optionText}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      currentQuestionIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>

                  {currentQuestionIndex === content.quiz.questions.length - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(selectedAnswers).length !== content.quiz.questions.length}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        Object.keys(selectedAnswers).length === content.quiz.questions.length
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Quiz Results */
              <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {quizResults?.passed ? 'Congratulations!' : 'Quiz Completed'}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Your Score: <span className="text-2xl font-bold text-blue-600">{quizResults?.score}%</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    You got {quizResults?.correctCount} out of {quizResults?.totalQuestions} questions correct
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4">Review Your Answers:</h3>
                  {quizResults?.results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        result.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          result.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {result.isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-2">
                            Question {index + 1}: {result.questionText}
                          </p>
                          <p className="text-sm">
                            <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              Your answer: {result.userAnswer}
                            </span>
                            {!result.isCorrect && (
                              <span className="text-green-700 block mt-1">
                                Correct answer: {result.correctAnswer}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={closeQuiz}
                  className="w-full py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Back to Content
                </button>
              </div>
            )}
          </div>

          {/* Alert Modal */}
          {showAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Alert</h3>
                </div>
                <p className="text-gray-700 mb-6">{alertMessage}</p>
                <button
                  onClick={() => setShowAlert(false)}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    // Show content page with action buttons
    return (
      <>
      <div className="w-full px-6 pb-6">
        {/* Breadcrumb */}
        <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <span 
            style={{ color: '#6b7280', cursor: 'pointer' }} 
            onClick={() => {
              if (inlineMode && onBack) {
                onBack();
              } else {
                navigate('/trainee');
              }
            }}
          >
            All Content
          </span>
          <span style={{ margin: '0 8px', color: '#6b7280' }}>&gt;</span>
          <span style={{ color: '#111827', fontWeight: '700' }}>
            {content?.title || 'Content'}
          </span>
        </div>

        {/* Content Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm enhanced-card fade-in-up delay-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {content?.title || 'Loading...'}
              </h1>
              <div className="flex items-center gap-4">
                {/* Category Tag */}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {content?.category || content?.contentType || 'Training'}
                </span>
                {/* Deadline */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-gray-900">
                    {content?.deadline ? formatDate(content?.deadline) : 'No deadline'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed break-words">
              {content?.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Content Display */}
        <div className="mb-6">
          {/* Content Actions */}
          {(() => {
            const contentUrl = content?.contentUrl || content?.url || content?.linkUrl || content?.fileUrl;
            if (!contentUrl) return null;
            
            const toAbsoluteUrl = (url) => {
              if (!url) return '';
              if (url.startsWith('http://') || url.startsWith('https://')) return url;
              if (url.startsWith('/')) return url;
              return url;
            };
            
            const resourceUrl = toAbsoluteUrl(contentUrl);
            const actualType = content?.contentType || content?.type || 'link';
            const isDownloadable = ['pdf', 'image', 'doc', 'docx', 'png', 'jpg', 'jpeg'].includes(actualType?.toLowerCase()) || 
                                  resourceUrl.match(/\.(pdf|doc|docx|png|jpg|jpeg|gif|bmp|webp)$/i);
            
            if (!isDownloadable && actualType !== 'link') return null;
            
            const getFileExtension = (url) => {
              if (!url) return '';
              const match = url.match(/\.([^.?]+)(?:\?|$)/);
              return match ? match[1].toLowerCase() : '';
            };
            
            const fileExtension = getFileExtension(resourceUrl);
            const fileName = content?.title + (fileExtension ? `.${fileExtension}` : '');
            
            return (
              <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
                <button
                  onClick={() => window.open(resourceUrl, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700 btn-enhanced-primary"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </button>
                {isDownloadable && (
                  <button
                    onClick={async () => {
                      try {
                        // Fetch the file as a blob to force download
                        const response = await fetch(resourceUrl);
                        const blob = await response.blob();
                        
                        // Create a blob URL
                        const blobUrl = window.URL.createObjectURL(blob);
                        
                        // Create a temporary link and trigger download
                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = fileName;
                        document.body.appendChild(link);
                        link.click();
                        
                        // Clean up
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);
                      } catch (error) {
                        console.error('Download failed:', error);
                        // Fallback: try direct download
                        const link = document.createElement('a');
                        link.href = resourceUrl;
                        link.download = fileName;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700 btn-enhanced-primary"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            );
          })()}
          
          {/* Content Display */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm enhanced-card fade-in-up delay-1">
              <div className={`${
                content?.contentType === 'template' || content?.type === 'template' 
                  ? 'p-0'
                  : (content?.contentType === 'image' || content?.type === 'image')
                    ? 'p-4'
                    : (content?.contentType === 'pdf' || content?.type === 'pdf')
                      ? 'p-6'
                      : (content?.contentType === 'link' || content?.type === 'link')
                        ? 'p-4'
                        : 'p-4'
              }`}>
                <div className="w-full" style={{ 
                  minHeight: (content?.contentType === 'pdf' || content?.type === 'pdf') ? '600px' : 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: (content?.contentType === 'image' || content?.type === 'image') ? 'center' : 'flex-start'
                }}>
                  {renderContent()}
                </div>
              </div>
            </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-8">
          {/* Acknowledge Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center flex-1 enhanced-card fade-in-up delay-2">
            <div className="flex flex-col items-center h-full">
              <div className="p-3 bg-green-100 rounded-lg mb-3">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Acknowledge</h3>
              <p className="text-gray-600 text-xs mb-3 flex-grow">
                {content?.ackRequired 
                  ? "Confirm you've reviewed this content"
                  : "Acknowledgment not required for this content"
                }
              </p>
              <button
                onClick={handleAcknowledge}
                disabled={acknowledgeLoading || userProgress?.acknowledged || !content?.ackRequired}
                className={`w-full py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  !content?.ackRequired
                    ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                    : userProgress?.acknowledged
                      ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                      : acknowledgeLoading
                        ? 'bg-green-400 text-white cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {!content?.ackRequired ? (
                  'Acknowledgment Not Required'
                ) : acknowledgeLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : userProgress?.acknowledged ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Acknowledged ✓
                  </div>
                ) : (
                  'Acknowledge Content'
                )}
              </button>
            </div>
          </div>

          {/* Complete Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center flex-1 enhanced-card fade-in-up delay-3">
            <div className="flex flex-col items-center h-full">
              <div className="p-3 bg-blue-100 rounded-lg mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Complete</h3>
              <p className="text-gray-600 text-xs mb-3 flex-grow">
                Finish and close this content
              </p>
              <button
                onClick={handleComplete}
                disabled={completeLoading || userProgress?.status === 'completed'}
                className={`w-full py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  userProgress?.status === 'completed'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 cursor-not-allowed'
                    : (content?.ackRequired && !userProgress?.acknowledged) ||
                      (content?.quiz && content.quiz.questions && content.quiz.questions.length > 0 && 
                       (userProgress?.score === null || userProgress?.score === undefined))
                      ? 'bg-gray-300 text-gray-500 border border-gray-200 cursor-not-allowed'
                      : completeLoading
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={
                  userProgress?.status === 'completed'
                    ? 'Content is already completed'
                    : (() => {
                        const needsAck = content?.ackRequired && !userProgress?.acknowledged;
                        const needsQuiz = content?.quiz && content.quiz.questions && content.quiz.questions.length > 0 && 
                                        (userProgress?.score === null || userProgress?.score === undefined);
                        
                        if (needsAck && needsQuiz) {
                          return 'You must acknowledge this content and take the quiz before marking it as complete.';
                        } else if (needsAck) {
                          return 'You must acknowledge this content before marking it as complete.';
                        } else if (needsQuiz) {
                          return 'You must take the quiz before marking this content as complete.';
                        }
                        return undefined;
                      })()
                }
              >
                {completeLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : userProgress?.status === 'completed' ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    Completed ✓
                  </div>
                ) : (
                  'Mark as Complete'
                )}
              </button>
            </div>
          </div>

          {/* Quiz Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center flex-1 enhanced-card fade-in-up delay-4">
            <div className="flex flex-col items-center h-full">
              <div className="p-3 bg-red-100 rounded-lg mb-3">
                <HelpCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">Take the Quiz</h3>
              <p className="text-gray-600 text-xs mb-3 flex-grow">
                {(() => {
                  const hasQuiz = content?.quiz && content?.quiz.questions && content?.quiz.questions.length > 0;
                  const quizTaken = content?.quizTaken || (userProgress?.score !== undefined && userProgress?.score !== null && userProgress?.score !== 0);
                  
                  if (!hasQuiz) {
                    return "No quiz available for this content";
                  }
                  
                  if (quizTaken) {
                    return `Quiz completed - Score: ${content?.quizScore || userProgress?.score}%`;
                  }
                  
                  return "Test your knowledge of this content";
                })()}
              </p>
              <button
                onClick={handleTakeQuiz}
                disabled={!content?.quiz || !content?.quiz.questions || content?.quiz.questions.length === 0 || content?.quizTaken || (userProgress?.score !== undefined && userProgress?.score !== null && userProgress?.score !== 0)}
                className={`w-full py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                  (!content?.quiz || !content?.quiz.questions || content?.quiz.questions.length === 0)
                    ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                    : (content?.quizTaken || (userProgress?.score !== undefined && userProgress?.score !== null && userProgress?.score !== 0))
                    ? 'bg-red-50 text-red-700 border border-red-200 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {(() => {
                  const hasQuiz = content?.quiz && content?.quiz.questions && content?.quiz.questions.length > 0;
                  const quizTaken = content?.quizTaken || (userProgress?.score !== undefined && userProgress?.score !== null && userProgress?.score !== 0);
                  
                  if (!hasQuiz) {
                    return 'No Quiz Available';
                  }
                  
                  if (quizTaken) {
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        Quiz Completed ✓
                      </div>
                    );
                  }
                  
                  return 'Start Quiz';
                })()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Alert</h3>
            </div>
            <p className="text-gray-700 mb-6">{alertMessage}</p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
      </>
    );
  }

  // Admin/Supervisor view (simpler layout)
  return (
    <div className="h-screen w-full flex flex-col" style={{ margin: '-1.5rem', padding: 0, overflow: 'hidden' }}>
      <div className="flex flex-col h-full" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {content && (
          <div className="w-full px-8 py-6 bg-card border-b border-border flex-shrink-0">
            <h1 className="text-4xl font-bold text-foreground text-center">
              {content.title}
            </h1>
          </div>
        )}
        
        <div className={`flex-1 w-full ${content?.contentType === 'template' ? 'overflow-y-auto p-8' : 'flex items-center justify-center overflow-hidden'}`} style={{ minHeight: 0 }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ContentView;
