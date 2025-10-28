import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import KnowledgeCardsTemplate from '../components/KnowledgeCardsTemplate.jsx';
import RecognitionTemplate from '../components/RecognitionTemplate.jsx';
import EventAnnouncementTemplate from '../components/EventAnnouncementTemplate.jsx';
import ToolSystemGuideTemplate from '../components/ToolSystemGuideTemplate.jsx';
import TaskRemindersBoardTemplate from '../components/TaskRemindersBoardTemplate.jsx';
import WelcomeIntroTemplate from '../components/WelcomeIntroTemplate.jsx';

const ContentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Detect if we're in supervisor context
  const isSupervisor = window.location.pathname.includes('/supervisor');

  // Fetch content details
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/api/content/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setContent(data && data.content ? data.content : data);
        } else {
          console.error('Failed to fetch content');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id]);

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

    const templateType = templateData.type;

    // Use the actual template components with read-only mode and the saved data
    switch(templateType) {
      case 'knowledge-cards':
        return (
          <KnowledgeCardsTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            isReadOnly={true}
            templateData={templateData}
          />
        );

      case 'recognition':
        return (
          <RecognitionTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            formData={templateData}
          />
        );

      case 'event-announcement':
        return (
          <EventAnnouncementTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            formData={templateData}
          />
        );

      case 'tool-system-guide':
        return (
          <ToolSystemGuideTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            templateData={templateData}
          />
        );

      case 'task-reminders-board':
        return (
          <TaskRemindersBoardTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            templateData={templateData}
          />
        );

      case 'welcome-intro':
        return (
          <WelcomeIntroTemplate
            onClose={() => {}}
            onTemplateSaved={() => {}}
            templateData={templateData}
          />
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
            <div className="w-full h-full max-w-6xl max-h-[80vh]">
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
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
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
            <div className="w-full h-full max-w-6xl max-h-[80vh]">
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
        
        // Regular link display - Use iframe to view directly
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full max-w-6xl max-h-[80vh] border border-border rounded-lg overflow-hidden shadow-2xl bg-white">
              <iframe
                src={resourceUrl}
                title={content.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onError={(e) => {
                  console.error('Link iframe error:', e);
                }}
              />
            </div>
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
    const backRoute = isSupervisor ? '/supervisor/content' : '/admin/content';
    
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Content Not Found</h2>
          <p className="text-muted-foreground mb-6">The content you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(backRoute)} className="bg-primary hover:bg-primary-hover">
            Back to Content Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col" style={{ margin: '-1.5rem', padding: 0, overflow: 'hidden' }}>
      {/* Content Viewer */}
      <div 
        className="flex flex-col h-full"
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Content Title */}
        {content && (
          <div className="w-full px-8 py-6 bg-card border-b border-border flex-shrink-0">
            <h1 className="text-4xl font-bold text-foreground text-center">
              {content.title}
            </h1>
          </div>
        )}
        
        {/* Content Display Area - Takes remaining space */}
        <div className={`flex-1 w-full ${content?.contentType === 'template' ? 'overflow-y-auto p-8' : 'flex items-center justify-center overflow-hidden'}`} style={{ minHeight: 0 }}>
          {renderContent() || (
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Debug: Content Data</h3>
                <div className="bg-gray-100 p-4 rounded-lg text-left max-w-2xl">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(content, null, 2)}
                  </pre>
                </div>
                <p className="text-muted-foreground mt-4">
                  If you see this, the content is loaded but renderContent() returned null.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContentView;