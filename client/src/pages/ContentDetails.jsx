import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Building, 
  FileText,
  LayoutTemplate,
  X,
  Link,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import AddContentModal from '../components/AddContentModal';

const ContentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  
  // Detect if we're in a group context
  const isInGroupContext = () => {
    const pathParts = location.pathname.split('/');
    const groupsIndex = pathParts.findIndex(part => part === 'groups');
    return groupsIndex !== -1 && pathParts[groupsIndex + 1];
  };
  
  const inGroupContext = isInGroupContext();

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
          const contentData = data && data.content ? data.content : data;
          
          setContent(contentData);
          
          // Fetch departments if content has assigned departments
          if (contentData.assignedTo_depID && contentData.assignedTo_depID.length > 0) {
            fetchDepartments();
          }
          
          // Fetch quizzes for this content
          fetchQuizzes();
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

  // Fetch quizzes from database
  const fetchQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/${id}/quiz`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Get department names for assigned departments
  const getAssignedDepartmentNames = () => {
    if (!content.assignedTo_depID || content.assignedTo_depID.length === 0) {
      return [];
    }
    
    return content.assignedTo_depID.map(depId => {
      // Handle ObjectId conversion more robustly
      let depIdStr;
      if (typeof depId === 'object' && depId._id) {
        depIdStr = depId._id.toString();
      } else if (typeof depId === 'object' && depId.$oid) {
        depIdStr = depId.$oid;
      } else {
        depIdStr = depId.toString();
      }
      
      const department = departments.find(dept => {
        const deptIdStr = dept._id.toString();
        return deptIdStr === depIdStr;
      });
      
      return department ? department.departmentName : `Department ${depIdStr}`;
    });
  };

  // Get icon based on content type - 3 types only
  const getContentIcon = (contentType) => {
    // Template types
    if (contentType === 'template' || ['Template', 'Form'].includes(contentType)) {
      return <LayoutTemplate className="w-8 h-8 text-primary" />;
    }
    
    // Link types (including YouTube and external links)
    if (contentType === 'link' || ['Link', 'Resource', 'Reference'].includes(contentType)) {
      return <Link className="w-8 h-8 text-primary" />;
    }
    
    // File types (everything else: pdf, doc, images, etc.)
    return <FileText className="w-8 h-8 text-primary" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleViewContent = () => {
    const isSupervisor = window.location.pathname.includes('/supervisor');
    const viewRoute = isSupervisor ? `/supervisor/content/${id}/view` : `/admin/content/${id}/view`;
    navigate(viewRoute);
  };

  const handleEditContent = () => {
    console.log('🔄 Opening edit modal for content:', content);
    console.log('🔄 Content ID:', content?._id);
    console.log('🔄 Content title:', content?.title);
    setShowEditModal(true);
  };

  const handleDeleteContent = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Content deleted successfully!');
        navigate('/admin/content');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert(`Error: ${error.message || 'Failed to delete content. Please try again.'}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleContentUpdated = (updatedContent) => {
    console.log('🔄 Content updated, refreshing details:', updatedContent);
    setContent(updatedContent);
    setShowEditModal(false);
    
    // Refresh the content details to get the latest data
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
        }
      } catch (error) {
        console.error('Error refreshing content:', error);
      }
    };

    fetchContent();
  };

  // Render template content using the same styling as original templates
  const renderTemplateContent = (templateData) => {
    if (!templateData) return <p className="text-muted-foreground">No template data available</p>;

    // Handle different template types using original template styling
    if (templateData.type === 'knowledge-cards' || templateData.title === 'Knowledge Cards/Quick Facts') {
      return (
        <div className="knowledge-cards-container" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div className="header-section">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              {templateData.title || 'Knowledge Cards/Quick Facts'}
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '1rem' }}>
              {templateData.description || 'Create quick reference cards with essential information'}
            </p>
            
            <div className="quick-reference-badge" style={{ 
              display: 'inline-block', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              fontSize: '0.9rem', 
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              {templateData.badgeText || 'Quick Reference Guide'}
            </div>
            <p className="subtitle" style={{ fontSize: '1rem', color: '#6b7280', fontStyle: 'italic' }}>
              {templateData.subtitle || 'Essential information at your fingertips'}
            </p>
          </div>

          <div className="facts-section">
            <div className="facts-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px', 
              marginTop: '2rem' 
            }}>
              {(templateData.facts || templateData.cards || []).map((card, index) => (
                <div key={index} className="fact-card" style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}>
                  <div className="fact-icon" style={{
                    fontSize: '2rem',
                    textAlign: 'center',
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px',
                    display: 'inline-block',
                    width: '100%'
                  }}>
                    {card.icon || '💡'}
                  </div>
                  <div className="fact-title" style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '8px',
                    textAlign: 'center'
                  }}>
                    {card.title}
                  </div>
                  <div className="fact-description" style={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    textAlign: 'center'
                  }}>
                    {card.description || card.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (templateData.type === 'recognition') {
      return (
        <div className="recognition-template" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#f59e0b', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              🏆
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              Recognition Award
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Celebrating outstanding achievements
            </p>
          </div>

          <div className="recognition-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#92400e',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {templateData.recognitionTitle}
            </h2>
            <div style={{
              backgroundColor: '#fff8e1',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#92400e',
                lineHeight: '1.6',
                textAlign: 'center',
                margin: 0
              }}>
                {templateData.recognitionMessage}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (templateData.type === 'event-announcement') {
      return (
        <div className="event-announcement-template" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              📅
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              Event Announcement
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Share important events with your team
            </p>
          </div>

          <div className="event-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '2px solid #e5e7eb',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1e40af',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {templateData.eventTitle}
            </h2>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: '0 auto 2rem',
              justifyContent: 'center'
            }}>
              <span>📅</span>
              <span>{templateData.eventDate}</span>
            </div>
            <div style={{
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#1e40af',
                lineHeight: '1.6',
                textAlign: 'center',
                margin: 0
              }}>
                {templateData.eventDescription}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (templateData.type === 'tool-system-guide') {
      const data = templateData.templateData ? templateData.templateData : templateData;
      const numberColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#84cc16', '#d946ef'];
      return (
        <div className="tool-guide-template" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              🛠️
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              System Guide
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Step-by-step instructions for tools and systems
            </p>
          </div>

          <div className="guide-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              {data.guideTitle || data.toolName}
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1rem',
              fontStyle: 'italic'
            }}>
              {data.guideSubtitle || data.purpose}
            </p>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Instructions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Array.isArray(data.steps) && data.steps.map((step, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  width: '100%'
                }}>
                  <span style={{
                    backgroundColor: numberColors[index % numberColors.length],
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '1rem',
                      color: '#374151',
                      lineHeight: '1.5',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {typeof step === 'object' && step && step.title && (
                        (() => {
                          const cleanTitle = String(step.title || '')
                            .replace(/\s+/g, ' ')
                            .trim();
                          return (
                            <span style={{
                              fontSize: '1.05rem',
                              fontWeight: '600',
                              color: '#111827',
                              whiteSpace: 'nowrap',
                              display: 'inline'
                            }}>
                              {cleanTitle}{(step && step.description) ? ': ' : ' '}
                            </span>
                          );
                        })()
                      )}
                      {(() => {
                        if (typeof step === 'string') return step;
                        if (step && typeof step === 'object') {
                          const desc = (step.description || '').trim();
                          if (desc) return desc;
                          const title = (step.title || '').replace(/^Step \d+:\s*/, '').trim();
                          return title;
                        }
                        return '';
                      })()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (templateData.type === 'task-reminders-board') {
      return (
          <div className="task-board-template" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#f97316', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              📋
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              Task Board
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Remind your trainees of important tasks with visual reminder cards
            </p>
          </div>

          <div className="task-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '2px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {templateData.boardTitle}
            </h2>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Tasks to Complete
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {templateData.tasks && templateData.tasks.map((task, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#9ca3af',
                      borderRadius: '2px'
                    }}></div>
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    color: '#374151',
                    fontWeight: '500',
                    margin: 0
                  }}>
                    {task}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (templateData.type === 'welcome-intro') {
      return (
        <div className="welcome-template" style={{ position: 'relative', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
          <div className="header-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              backgroundColor: '#8b5cf6', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem',
              fontSize: '2.5rem'
            }}>
              👋
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
              Welcome Message
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
              Create a warm welcome for new team members
            </p>
          </div>

          <div className="welcome-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '2px solid #8b5cf6',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#6d28d9',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              {templateData.welcomeTitle}
            </h2>
            <p style={{
              fontSize: '1.1rem',
              color: '#6b7280',
              lineHeight: '1.6',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              {templateData.welcomeMessage}
            </p>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              Key Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {templateData.keyPoints && templateData.keyPoints.map((point, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px'
                }}>
                  <span style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </span>
                  <p style={{
                    fontSize: '1rem',
                    color: '#374151',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Generic template display for unknown types
    return (
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-foreground mb-4">Template Content</h4>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{templateData.title || 'Template'}</h3>
            <p className="text-gray-600">{templateData.description || 'Custom template content'}</p>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
            <h5 className="text-lg font-bold text-gray-800 mb-4">Template Details</h5>
            <div className="space-y-3">
              {Object.entries(templateData).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h6 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h6>
                      <div className="space-y-2">
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div key={subKey} className="flex justify-between">
                            <span className="text-gray-600 capitalize">{subKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="text-gray-800">{String(subValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else if (Array.isArray(value)) {
                  return (
                    <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h6 className="font-semibold text-gray-700 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h6>
                      <div className="space-y-2">
                        {value.map((item, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              {typeof item === 'object' ? (
                                <div className="space-y-1">
                                  {Object.entries(item).map(([itemKey, itemValue]) => (
                                    <div key={itemKey} className="flex justify-between">
                                      <span className="text-gray-600 capitalize">{itemKey.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="text-gray-800">{String(itemValue)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-800">{String(item)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={key} className="flex justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-gray-800">{String(value)}</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading content details...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div style={{
        padding: '20px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}>
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={48} />
          </div>
          <p className="text-muted-foreground">Content not found</p>
          <Button 
            onClick={() => {
              const isSupervisor = window.location.pathname.includes('/supervisor');
              const backRoute = isSupervisor ? '/supervisor/content' : '/admin/content';
              navigate(backRoute);
            }} 
            className="btn-enhanced-primary mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Content
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }}>
      {/* All Content Wrapped Together */}
      <div>
        {/* Breadcrumb Navigation - only show if not in group context */}
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
              Content
            </span>
            <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span style={{ color: '#111827', fontWeight: '700' }}>
              {content?.title || 'Loading...'}
            </span>
          </div>
        )}

        {/* Content Header */}
        <div className="enhanced-card fade-in-up delay-0 bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl font-bold text-foreground leading-tight">
              {content.title}
            </h1>
          </div>
            <div className="flex items-center gap-4">
              {content.contentType !== 'template' && (
                <Button
                  onClick={handleViewContent}
                  className="btn-enhanced-primary bg-primary hover:bg-primary-hover shadow-soft text-lg px-6 py-3"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Content
                </Button>
              )}
              <Button
                onClick={() => setShowEditModal(true)}
                variant="outline"
                size="default"
                className="btn-enhanced-secondary text-lg"
              >
                <Edit className="w-5 h-5 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="default"
                className="btn-enhanced-danger text-lg border-red-500 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </div>
          </div>
          
          {content.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category and Type */}
        <div className="enhanced-card fade-in-up delay-1 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Category & Type
          </h3>
          <div className="ml-18 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Category</p>
              <CategoryBadge category={content.category || content.contentType || content.type || 'General'} />
            </div>
            <div>
              <p className="text-lg font-medium text-muted-foreground mb-3">Content Type</p>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-secondary text-secondary-foreground">
                {content.contentType || content.type || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

          {/* Deadline */}
        <div className="enhanced-card fade-in-up delay-2 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            Deadline
          </h3>
          <div className="ml-18">
            <p className="text-2xl font-semibold text-foreground">
              {formatDate(content.deadline)}
            </p>
          </div>
        </div>

          {/* Acknowledgement */}
        <div className="enhanced-card fade-in-up delay-3 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            Acknowledgement
          </h3>
          <div className="ml-18">
            <div className="flex items-center gap-6">
              {content.ackRequired ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="text-2xl font-semibold text-green-700">Yes, Required</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <X className="w-8 h-8 text-gray-500" />
                  </div>
                  <span className="text-2xl font-semibold text-muted-foreground">Not Required</span>
                </>
              )}
            </div>
          </div>
        </div>

          {/* Assigned To */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-smooth"
          style={{
            animation: 'fadeInUp 0.5s ease-out forwards',
            opacity: 0,
            animationDelay: '0.3s',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12), 0 6px 12px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.borderColor = '#bfdbfe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#e5e7eb';
          }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            Assigned To
          </h3>
          <div className="ml-18 space-y-4">
            {/* Departments */}
            {content.assignedTo_depID && content.assignedTo_depID.length > 0 && (
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-3">Departments</p>
                {loadingDepartments ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAssignedDepartmentNames().map((deptName, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-lg text-foreground font-medium">{deptName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Groups */}
            {content.assignedTo_GroupID && (
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-3">Groups</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-lg text-foreground font-medium">
                    {typeof content.assignedTo_GroupID === 'object' 
                      ? (content.assignedTo_GroupID.groupName || content.assignedTo_GroupID.name || 'Group')
                      : String(content.assignedTo_GroupID)}
                  </span>
                </div>
              </div>
            )}

            {/* Trainees */}
            {content.assignedTo_traineeID && (
              <div>
                <p className="text-lg font-medium text-muted-foreground mb-3">Trainees</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span className="text-lg text-foreground font-medium">
                    {typeof content.assignedTo_traineeID === 'object'
                      ? (content.assignedTo_traineeID.name || content.assignedTo_traineeID.fname || 'Trainee')
                      : String(content.assignedTo_traineeID)}
                  </span>
                </div>
              </div>
            )}

            {/* Not Assigned */}
            {(!content.assignedTo_depID || content.assignedTo_depID.length === 0) && !content.assignedTo_GroupID && !content.assignedTo_traineeID && (
              <p className="text-lg font-medium text-muted-foreground">Not Assigned</p>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Quiz Card - Show quizzes from database */}
      {loadingQuizzes ? (
        <div className="bg-card rounded-xl border border-border p-10 mb-8 shadow-card">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted-foreground">Loading quiz...</span>
          </div>
        </div>
      ) : quizzes.length > 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 mb-8 shadow-card">
          {(() => {
            const quiz = quizzes[0]; // Only show the first (and only) quiz
            return (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                    <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    Quiz Questions
                  </h3>
                  <span className="text-sm text-muted-foreground bg-purple-50 px-4 py-2 rounded-full">
                    {quiz.questions.length} Question{quiz.questions.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {quiz.questions.map((q, idx) => {
                    const questionText = q.questionText || '';
                    const options = q.options || [];
                    const correctAnswer = q.correctAnswer || '';
                    const correctIdx = options.findIndex(o => String(o).trim() === String(correctAnswer).trim());
                    
                    return (
                      <div key={idx} className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-purple-300 transition-colors">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </span>
                          <div className="font-semibold text-lg text-foreground flex-1">{questionText}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                          {options.map((opt, i) => (
                            <div 
                              key={i} 
                              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                                i === correctIdx 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {i === correctIdx && (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                                <span className={`text-sm ${
                                  i === correctIdx 
                                    ? 'text-green-700 font-semibold' 
                                    : 'text-gray-700'
                                }`}>
                                  {opt}
                                </span>
                              </div>
                              {i === correctIdx && (
                                <span className="text-xs text-green-600 font-medium ml-7">✓ Correct Answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      ) : null}

      {/* Template Content Display */}
      {content.contentType === 'template' && content.templateData && (
        <div className="bg-card rounded-xl border border-border p-10 mb-8 shadow-card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-foreground">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <LayoutTemplate className="w-8 h-8 text-purple-600" />
            </div>
            Template Content
          </h3>
          <div className="template-content-card">
            {renderTemplateContent(content.templateData)}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AddContentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onContentAdded={handleContentUpdated}
        editMode={true}
        editContent={content}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-elevated">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">Delete Content</h3>
                <p className="text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-8">
              <p className="text-lg text-foreground mb-2">
                Are you sure you want to delete <strong>"{content.title}"</strong>?
              </p>
              <p className="text-muted-foreground">
                This will permanently remove the content and all associated data.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 text-lg py-3"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteContent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-lg py-3"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDetails;