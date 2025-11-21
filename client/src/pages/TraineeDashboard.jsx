import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMessageCircle, FiUser, FiMail } from "react-icons/fi";
import { Building2 } from "lucide-react";
import { getTraineeSupervisor, getTraineeUnreadCount } from "../services/api";
import "../styles/login.css";
import "../styles/chat.css";
import TraineeContentCard from "../components/TraineeContentCard";
import { fetchTraineeAssignedContent } from "../services/content";

// Import the ContentView component for inline viewing
const ContentView = React.lazy(() => import('./ContentView'));

function TraineeDashboard() {
  const navigate = useNavigate();
  
  // Tab state for onboarding content
  const [activeTab, setActiveTab] = useState('all');
  
  // Content viewing state
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentView, setShowContentView] = useState(false);
  
  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignedData, setAssignedData] = useState({
    traineeInfo: null,
    content: [],
    metrics: {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      dueSoon: 0,
      notStarted: 0
    }
  });

  // Supervisor state for chat
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [supervisorLoading, setSupervisorLoading] = useState(true);
  const [supervisorError, setSupervisorError] = useState(null);


  // Handle content card click to show inline content
  const handleContentSelect = (content) => {
    setSelectedContent(content);
    setShowContentView(true);
  };

  // Handle progress update callback from ContentView
  const handleProgressUpdate = () => {
    loadAssignedContent(); // Refresh the dashboard data
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setShowContentView(false);
    setSelectedContent(null);
    // Reload content to refresh any progress updates
    loadAssignedContent();
  };

  // Fetch assigned content on component mount
  useEffect(() => {
    loadAssignedContent();
    loadSupervisorInfo();
  }, []);

  // Poll for unread count every 10 seconds
  useEffect(() => {
    if (!supervisorInfo) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, [supervisorInfo]);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAssignedContent();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', loadAssignedContent);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadAssignedContent);
    };
  }, []);

  const loadAssignedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchTraineeAssignedContent();
      
      if (response.success) {
        // Calculate notStarted count locally
        const contentArray = response.data.content || [];
        const notStartedCount = contentArray.filter(item => {
          const hasNoProgress = !item.progress;
          const hasNotStartedStatus = item.progress && (!item.progress.status || item.progress.status === 'not started');
          return hasNoProgress || hasNotStartedStatus;
        }).length;
        
        // Add notStarted to metrics
        const updatedData = {
          ...response.data,
          metrics: {
            ...response.data.metrics,
            notStarted: notStartedCount
          }
        };
        
        setAssignedData(updatedData);
      } else {
        setError(response.message || 'Failed to fetch assigned content');
      }
    } catch (err) {
      console.error('Error loading assigned content:', err);
      setError(err.message || 'Failed to fetch assigned content');
    } finally {
      setLoading(false);
    }
  };

  const loadSupervisorInfo = async () => {
    try {
      setSupervisorLoading(true);
      setSupervisorError(null);
      const data = await getTraineeSupervisor();
      setSupervisorInfo(data.supervisor);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load supervisor:', err);
      setSupervisorError(err.message);
    } finally {
      setSupervisorLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getTraineeUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleChatClick = () => {
    navigate('/trainee/chat');
  };


  // Filter content based on active tab
  const getFilteredContent = () => {
    if (!assignedData.content) return [];
    
    switch (activeTab) {
      case 'all':
        return assignedData.content;
      case 'inProgress':
        return assignedData.content.filter(item => item.progress?.status === 'in progress');
      case 'completed':
        return assignedData.content.filter(item => item.progress?.status === 'completed');
      case 'overdue':
        return assignedData.content.filter(item => {
          // Skip completed items - they shouldn't appear in overdue
          if (item.progress?.status === 'completed') {
            return false;
          }
          
          // Check if already marked as overdue in progress
          if (item.progress?.status === 'overdue') {
            return true;
          }
          
          // Check deadline-based overdue status for all non-completed items
          if (item.deadline) {
            // Parse the deadline date
            const dueDate = new Date(item.deadline);
            const currentDate = new Date();
            
            // Simple comparison - if due date is before current date, it's overdue
            if (dueDate < currentDate) {
              return true;
            }
          }
          return false;
        });
      case 'dueSoon':
        return assignedData.content.filter(item => {
          // Skip completed items - they shouldn't appear in due soon
          if (item.progress?.status === 'completed') {
            return false;
          }
          
          // Check if already marked as due soon in progress
          if (item.progress?.status === 'due soon') {
            return true;
          }
          
          // Check deadline-based due soon status (only for non-completed items)
          if (item.deadline) {
            const dueDate = new Date(item.deadline);
            const currentDate = new Date();
            
            // Normalize dates to avoid time zone issues
            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
            
            const timeDiff = dueDateOnly.getTime() - currentDateOnly.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            if (daysDiff >= 0 && daysDiff <= 3) {
              return true;
            }
          }
          return false;
        });
      case 'notStarted':
        return assignedData.content.filter(item => {
          // Not started means the trainee hasn't clicked on or interacted with the content yet
          // This includes items with no progress object or progress with no status/"not started" status
          const hasNoProgress = !item.progress;
          const hasNotStartedStatus = item.progress && (!item.progress.status || item.progress.status === 'not started');
          return hasNoProgress || hasNotStartedStatus;
        });
      default:
        return assignedData.content;
    }
  };

  const filteredContent = getFilteredContent();

  // Derived progress values for display
  const totalAssigned = assignedData.metrics?.total || 0;
  const completedCount = assignedData.metrics?.completed || 0;
  const completionPercentage = (typeof assignedData.metrics?.completionPercentage === 'number')
    ? assignedData.metrics.completionPercentage
    : (totalAssigned ? Math.round((completedCount / totalAssigned) * 100) : 0);

  // Determine progress bar color and status based on performance
  // Color scheme: Red (poor) -> Orange (needs work) -> Yellow (average) -> Blue (good) -> Green (excellent)
  const getProgressColor = (percentage) => {
    if (percentage < 30) {
      return '#ef4444'; // Red - Poor performance / At risk
    } else if (percentage < 50) {
      return '#f97316'; // Orange - Needs improvement
    } else if (percentage < 70) {
      return '#eab308'; // Yellow - Average performance
    } else if (percentage < 85) {
      return '#3b82f6'; // Blue - Good performance
    } else {
      return '#10b981'; // Green - Excellent performance
    }
  };

  const getProgressStatus = (percentage) => {
    if (percentage < 30) {
      return 'At risk';
    } else if (percentage < 50) {
      return 'Needs improvement';
    } else if (percentage < 70) {
      return 'On track';
    } else if (percentage < 85) {
      return 'Good progress';
    } else {
      return 'Excellent';
    }
  };

  const progressBarColor = getProgressColor(completionPercentage);
  const progressStatus = getProgressStatus(completionPercentage);

  return (
    <div className="w-full p-6">
      {showContentView && selectedContent ? (
        // Show inline content view
        <React.Suspense fallback={<div className="flex items-center justify-center py-12"><div className="text-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-600">Loading content...</p></div></div>}>
          <ContentView 
            contentId={selectedContent._id} 
            onBack={handleBackToDashboard}
            onProgressUpdate={handleProgressUpdate}
            inlineMode={true}
          />
        </React.Suspense>
      ) : (
        // Show dashboard
        <>
          {/* Supervisor Card for Chat */}
          {supervisorLoading ? (
            <div className="trainee-card trainee-loading" style={{ marginBottom: '24px' }}>
              <p>Loading supervisor information...</p>
            </div>
          ) : supervisorError ? (
            <div className="trainee-card trainee-error" style={{ marginBottom: '24px' }}>
              <FiUser size={48} />
              <h3>Supervisor Information</h3>
              <p className="error-text">{supervisorError}</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              {/* Department Card */}
              {assignedData.traineeInfo?.department && (
                <div className="trainee-card" style={{ 
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flex: 1,
                  minWidth: '280px'
                }}>
                  <div className="card-icon" style={{ 
                    width: '64px', 
                    height: '64px', 
                    margin: 0,
                    flexShrink: 0,
                    background: '#DBEAFE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={32} color="#2563eb" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '0.95rem', 
                      marginBottom: '6px',
                      color: '#64748b',
                      marginTop: 0
                    }}>
                      Your Department
                    </p>
                    <p style={{ 
                      fontSize: '1.125rem', 
                      margin: 0,
                      color: '#0b2f55',
                      fontWeight: '600'
                    }}>
                      {assignedData.traineeInfo.department}
                    </p>
                  </div>
                </div>
              )}

              {/* Supervisor Card */}
              {supervisorInfo && (
                <div className="trainee-card supervisor-card" style={{ 
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flex: 1,
                  minWidth: '320px'
                }}>
                  <div className="card-icon" style={{ 
                    width: '64px', 
                    height: '64px', 
                    margin: 0,
                    flexShrink: 0,
                    background: '#DBEAFE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiUser size={32} color="#2563eb" />
              </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '0.95rem', 
                      marginBottom: '8px',
                      color: '#64748b',
                      marginTop: 0
                    }}>
                      Your Supervisor
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <p style={{ 
                        fontSize: '1.125rem', 
                        margin: 0,
                        color: '#0b2f55',
                        fontWeight: '600'
                      }}>
                  {supervisorInfo.fname} {supervisorInfo.lname}
                </p>
                {supervisorInfo.email && (
                        <p className="supervisor-email" style={{ 
                          fontSize: '0.875rem', 
                          margin: 0,
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FiMail size={14} /> {supervisorInfo.email}
                  </p>
                )}
              </div>
                  </div>
                  <button className="trainee-chat-btn" onClick={handleChatClick} style={{
                    padding: '8px 16px',
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s',
                    color: '#FFFFFF',
                    fontWeight: '500',
                    fontSize: '14px',
                    flexShrink: 0,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#2563EB';
                  }}
                  >
                    <FiMessageCircle size={18} color="white" />
                    <span>Chat</span>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </button>
            </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p style={{ color: '#6b7280' }}>Loading content...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div style={{ 
              padding: '24px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Error loading content</h3>
              <p style={{ color: '#991b1b', marginBottom: '16px' }}>{error}</p>
              <button 
                onClick={loadAssignedContent}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/* Content Section */}
          {!loading && !error && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
                {/* Header */}
                <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>My Content Library</h2>
                      <p style={{ color: '#6b7280', margin: 0 }}>View and track all your assigned learning content and tasks.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{assignedData.metrics.total}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Assigned</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Your Onboarding Progress</h3>
                  <div>
                    <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '9999px', height: '24px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease-in-out, background-color 0.3s ease-in-out',
                          width: `${Math.max(0, Math.min(100, completionPercentage))}%`,
                          backgroundColor: progressBarColor
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span style={{ fontWeight: '500' }}>{completionPercentage}% Completed</span>
                      <span>{completedCount} / {totalAssigned} completed</span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                      Status: <span style={{ fontWeight: '500', color: progressBarColor }}>{progressStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div>
                  <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                    <button
                      onClick={() => setActiveTab('all')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'all' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'all' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      All Content ({assignedData.metrics.total})
                    </button>
                    <button
                      onClick={() => setActiveTab('notStarted')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'notStarted' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'notStarted' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      Not Started ({assignedData.metrics.notStarted || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('inProgress')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'inProgress' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'inProgress' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      In Progress ({assignedData.metrics.inProgress})
                    </button>
                    <button
                      onClick={() => setActiveTab('completed')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'completed' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'completed' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      Completed ({assignedData.metrics.completed})
                    </button>
                    <button
                      onClick={() => setActiveTab('overdue')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'overdue' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'overdue' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      Overdue ({assignedData.metrics.overdue})
                    </button>
                    <button
                      onClick={() => setActiveTab('dueSoon')}
                      style={{
                        paddingBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderBottom: activeTab === 'dueSoon' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'dueSoon' ? '#2563eb' : '#6b7280',
                        background: 'none',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s'
                      }}
                    >
                      Due Soon ({assignedData.metrics.dueSoon})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div>
                    {filteredContent.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                        <p>
                          {activeTab === 'all' ? 'No content assigned yet.' : `No ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} content.`}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {filteredContent.map((content) => (
                          <TraineeContentCard
                            key={content._id}
                            content={content}
                            onContentSelect={handleContentSelect}
                            traineeInfo={assignedData.traineeInfo}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </>
      )}

    </div>
  );
}

export default TraineeDashboard;