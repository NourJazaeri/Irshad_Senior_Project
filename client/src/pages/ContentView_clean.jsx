import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Eye, Calendar, FileText, Tag, HelpCircle } from 'lucide-react';

// Temporarily comment out template imports to debug
// import KnowledgeCardsTemplate from '../components/KnowledgeCardsTemplate.jsx';
// import RecognitionTemplate from '../components/RecognitionTemplate.jsx';
// import EventAnnouncementTemplate from '../components/EventAnnouncementTemplate.jsx';
// import ToolSystemGuideTemplate from '../components/ToolSystemGuideTemplate.jsx';
// import TaskRemindersBoardTemplate from '../components/TaskRemindersBoardTemplate.jsx';
// import WelcomeIntroTemplate from '../components/WelcomeIntroTemplate.jsx';

const ContentView = ({ contentId, onBack, onProgressUpdate, inlineMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Use contentId prop if provided (inline mode), otherwise use URL param
  const actualContentId = contentId || id;
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [userProgress, setUserProgress] = useState(null);
  
  // Detect user context
  const isSupervisor = window.location.pathname.includes('/supervisor');
  const isTrainee = window.location.pathname.includes('/trainee');

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      if (!actualContentId) {
        setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        // Use different endpoint for trainees vs admins/supervisors
        const endpoint = isTrainee 
          ? `${API_BASE}/api/content/trainee/view/${actualContentId}`
          : `${API_BASE}/api/content/${actualContentId}`;
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
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
          console.error('âŒ Failed to fetch content:', response.status, errorData);
          setContent(null);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [actualContentId]);

  // Progress tracking functions for trainees
  const handleAcknowledge = async () => {
    if (!isTrainee) {
      return;
    }

    if (!content?.ackRequired) {
      return;
    }
    
    setProgressLoading(true);
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
          acknowledged: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.progress);
        
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
      setProgressLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!isTrainee) {
      return;
    }

    // Check if content has quiz questions (placeholder for future implementation)
    const hasQuiz = content?.templateData?.quiz || content?.quiz; // Check if content has a quiz
    const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0; // Check if content has quiz questions
    const quizCompleted = userProgress?.quizCompleted || false; // Check if quiz is completed
    
    // Only block completion if there IS a quiz OR quiz questions AND it's NOT completed
    if ((hasQuiz || hasQuizQuestions) && !quizCompleted) {
      alert('You cannot mark this content as complete before taking the quiz. Please complete the quiz first.');
      return;
    }
    
    setProgressLoading(true);
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
        
        // Notify parent component to refresh data
        if (onProgressUpdate) {
          onProgressUpdate();
        }
      } else {
        const errorData = await response.text();
        console.error('Failed to complete content:', response.status, errorData);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (error) {
      console.error('Error completing content:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  // Handle taking quiz
  const handleTakeQuiz = () => {
    if (!isTrainee) {
      return;
    }
    
    // TODO: Implement quiz functionality
    // For now, just show an alert
    alert('Quiz functionality will be implemented soon!');
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

  // Render template content using the actual template components
  const renderTemplateContent = (templateData) => {
    if (!templateData) return <p className="text-muted-foreground">No template data available</p>;

    // Temporarily return simple content to debug
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Template Content</h3>
        <p className="text-gray-600">Template type: {templateData.type || 'Unknown'}</p>
        <pre className="mt-4 text-xs overflow-auto">
          {JSON.stringify(templateData, null, 2)}
        </pre>
      </div>
    );
  };

  const renderContent = () => {
    if (!content) return null;

    // Check if this is template content
    if (content.contentType === 'template' && content.templateData) {
      return renderTemplateContent(content.templateData);
    }

    // Determine content type and render accordingly

    // Infer type from URL when missing
    const inferTypeFromUrl = (url) => {
      if (!url) return 'unknown';
      const lower = url.toLowerCase();
      
      if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
        return 'youtube';
      }
      
      const extMatch = lower.match(/\.([^.?]+)(?:\?|$)/);
      const ext = extMatch ? extMatch[1] : '';
      
      if (['pdf'].includes(ext)) {
        return 'pdf';
      }
      if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) {
        return 'image';
      }
      
      // Additional image detection - check for image-related patterns in URL
      if (lower.includes('image') || lower.includes('photo') || lower.includes('picture') || 
          lower.includes('img') || lower.includes('gallery') || lower.includes('media')) {
        return 'image';
      }
      if (['mp4','avi','mov','wmv','flv','webm','mkv'].includes(ext)) {
        return 'video';
      }
      if (lower.startsWith('http')) {
        return 'link';
      }
      
      return 'unknown';
    };

    // Get the URL from various possible field names
    const contentUrl = content.contentUrl || content.url || content.linkUrl || content.fileUrl;

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
    }
    
    // Always work with an absolute URL for rendering
    const resourceUrl = toAbsoluteUrl(contentUrl);

    switch (actualType) {
      case 'youtube':
        // Extract video ID from URL if not present in content
        const extractVideoId = (url) => {
          if (!url) return null;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        
        const videoId = content.youtubeVideoId || extractVideoId(resourceUrl);
        
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
              <div className="text-red-500 text-lg mb-4">âš ï¸ Invalid YouTube Video ID</div>
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
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-[700px] flex items-center justify-center">
              <div className="relative group">
                <img
                  src={resourceUrl}
                  alt={content.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
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
                    <div className="text-4xl mb-2">ðŸ–¼ï¸</div>
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
          return (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
                <div className="relative group">
                  <img
                    src={resourceUrl}
                    alt={content.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-pointer transition-transform duration-200 hover:scale-105"
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
                      <div className="text-4xl mb-2">ðŸ–¼ï¸</div>
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
            <div className="text-6xl mb-4">ðŸ“„</div>
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

  return (
    <div className="w-full px-6 pb-6">
      {/* Debug info - remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black text-white p-2 text-xs rounded z-50">
          <div>ID: {actualContentId || 'No ID'}</div>
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>Content: {content ? 'Loaded' : 'None'}</div>
          <div>isTrainee: {isTrainee ? 'Yes' : 'No'}</div>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      )}
      
      {!loading && !content && (
        <div className="text-center py-12">
          <p className="text-gray-500">Content not found</p>
        </div>
      )}
      
      {!loading && content && isTrainee && (
        <div>
          {/* Header */}
          <div className="bg-white border border-gray-200 px-6 py-4 mb-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={() => inlineMode && onBack ? onBack() : navigate('/trainee')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to My Content
              </button>
            </div>
          </div>

          {/* Content Header */}
          <div className="bg-white px-6 py-6 min-h-fit">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {content?.title || 'Loading...'}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-4 break-words">
                {content?.description || 'Learn best practices for handling sensitive company and customer data'}
              </p>
            </div>
          </div>
          {/* Content Display */}
          <div className="px-6 py-4">
            <div>
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Category & Type */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <h3 className="font-semibold text-gray-900">Category & Type</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Category</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {content?.category || content?.contentType || 'Training'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Content Type</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {content?.contentType || content?.type || 'link'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deadline */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                    <h3 className="font-semibold text-gray-900">Deadline</h3>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {formatDate(content?.deadline)}
                    </p>
                    {getDeadlineStatus() && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className={`text-sm font-medium ${getDeadlineStatus().color}`}>
                          {getDeadlineStatus().text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Display */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading content...</p>
                      </div>
                    </div>
                  ) : (
                    <div className={`${
                      content?.contentType === 'link' || content?.type === 'link' 
                        ? 'min-h-[400px]' 
                        : (content?.contentType === 'pdf' || content?.type === 'pdf')
                          ? 'min-h-[900px]'
                          : (content?.contentType === 'template' || content?.type === 'template')
                            ? 'h-auto min-h-[600px]'
                            : 'min-h-[800px]'
                    }`}>
                      {renderContent()}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Cards */}
              <div className="flex justify-center my-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                {/* Acknowledge Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-green-100 rounded-lg mb-4">
                      <Eye className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Acknowledge</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {content?.ackRequired 
                        ? "Confirm you've reviewed this content"
                        : "Acknowledgment not required for this content"
                      }
                    </p>
                    <button
                      onClick={handleAcknowledge}
                      disabled={progressLoading || userProgress?.acknowledged || !content?.ackRequired}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        !content?.ackRequired
                          ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                          : userProgress?.acknowledged
                            ? 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed'
                            : progressLoading
                              ? 'bg-green-400 text-white cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {!content?.ackRequired ? (
                        'Acknowledgment Not Required'
                      ) : progressLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : userProgress?.acknowledged ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Acknowledged âœ“
                        </div>
                      ) : (
                        'Acknowledge Content'
                      )}
                    </button>
                  </div>
                </div>

                {/* Complete Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mb-4">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Complete</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {(() => {
                        const hasQuiz = content?.templateData?.quiz || content?.quiz;
                        const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0;
                        const quizCompleted = userProgress?.quizCompleted || false;
                        
                        if ((hasQuiz || hasQuizQuestions) && !quizCompleted) {
                          return "Complete the quiz before marking as complete";
                        }
                        return "Finish and close this content";
                      })()}
                    </p>
                    <button
                      onClick={handleComplete}
                      disabled={(() => {
                        const hasQuiz = content?.templateData?.quiz || content?.quiz;
                        const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0;
                        const quizCompleted = userProgress?.quizCompleted || false;
                        // Only disable if there IS a quiz OR quiz questions AND it's NOT completed
                        const quizRequiredButNotCompleted = (hasQuiz || hasQuizQuestions) && !quizCompleted;
                        
                        return progressLoading || userProgress?.status === 'completed' || quizRequiredButNotCompleted;
                      })()}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        (() => {
                          const hasQuiz = content?.templateData?.quiz || content?.quiz;
                          const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0;
                          const quizCompleted = userProgress?.quizCompleted || false;
                          const quizRequiredButNotCompleted = (hasQuiz || hasQuizQuestions) && !quizCompleted;
                          
                          if (quizRequiredButNotCompleted) {
                            return 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed';
                          } else if (userProgress?.status === 'completed') {
                            return 'bg-blue-50 text-blue-700 border border-blue-200 cursor-not-allowed';
                          } else if (progressLoading) {
                            return 'bg-blue-400 text-white cursor-not-allowed';
                          } else {
                            return 'bg-blue-600 text-white hover:bg-blue-700';
                          }
                        })()
                      }`}
                    >
                      {(() => {
                        const hasQuiz = content?.templateData?.quiz || content?.quiz;
                        const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0;
                        const quizCompleted = userProgress?.quizCompleted || false;
                        const quizRequiredButNotCompleted = (hasQuiz || hasQuizQuestions) && !quizCompleted;
                        
                        if (quizRequiredButNotCompleted) {
                          return 'Quiz Required';
                        } else if (progressLoading) {
                          return (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          );
                        } else if (userProgress?.status === 'completed') {
                          return (
                            <div className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Completed âœ“
                            </div>
                          );
                        } else {
                          return 'Mark as Complete';
                        }
                      })()}
                    </button>
                  </div>
                </div>

                {/* Quiz Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-red-100 rounded-lg mb-4">
                      <HelpCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Take the Quiz</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {(() => {
                        const hasQuiz = content?.templateData?.quiz || content?.quiz;
                        const hasQuizQuestions = content?.quizQuestions && content?.quizQuestions.length > 0;
                        
                        if (hasQuiz || hasQuizQuestions) {
                          return "Test your knowledge of this content";
                        }
                        return "No quiz available for this content";
                      })()}
                    </p>
                    <button
                      onClick={handleTakeQuiz}
                      disabled={!content?.templateData?.quiz && !content?.quiz && !(content?.quizQuestions && content?.quizQuestions.length > 0)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        (!content?.templateData?.quiz && !content?.quiz && !(content?.quizQuestions && content?.quizQuestions.length > 0))
                          ? 'bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {(!content?.templateData?.quiz && !content?.quiz && !(content?.quizQuestions && content?.quizQuestions.length > 0)) ? 'No Quiz Available' : 'Start Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!loading && content && !isTrainee && (
        <div className="text-center py-12">
          <p className="text-gray-500">Admin/Supervisor view</p>
        </div>
      )}
    </div>
  );
};

export default ContentView;
