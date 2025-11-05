import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
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
  
  // User name from localStorage
  const [userName, setUserName] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      console.log('📦 TraineeDashboard - storedUser from localStorage:', storedUser);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log('✅ TraineeDashboard - Parsed userData:', userData);
        console.log('👤 TraineeDashboard - firstName:', userData.firstName);
        
        // If firstName exists, use it; otherwise format from email
        if (userData.firstName) {
          return userData.firstName;
        } else if (userData.email) {
          // Format email into display name: "ziad.alotaibi@..." -> "Ziad Alotaibi"
          const namePart = userData.email.split('@')[0];
          return namePart.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    return 'Trainee';
  });
  
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
  }, []);

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

  const progressBarColor = completionPercentage < 25
    ? 'bg-red-500'
    : (completionPercentage <= 65 ? 'bg-yellow-500' : 'bg-green-500');


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
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Trainee Dashboard</h1>
            <p className="text-gray-600 text-lg">
              Welcome, {userName}!
            </p>
            {assignedData.traineeInfo?.group && (
              <p className="text-sm text-gray-500 mt-1">
                Group: {assignedData.traineeInfo.group}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Department: Human Resources
            </p>
          </div>

      {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">Error loading content</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <button 
                    onClick={loadAssignedContent}
                    className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content Section */}
          {!loading && !error && (
            <section className="mt-8">
              <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">My Content Library</h2>
                      <p className="text-gray-600">View and track all your assigned learning content and tasks.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{assignedData.metrics.total}</div>
                      <div className="text-sm text-gray-600">Total Assigned</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar (replaces individual cards) */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Your Onboarding Progress</h3>
                  <div className="mt-2">
                    <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`${progressBarColor} h-6 rounded-full transition-all`}
                        style={{ width: `${Math.max(0, Math.min(100, completionPercentage))}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span className="font-medium">{completionPercentage}% Completed</span>
                      <span>{completedCount} / {totalAssigned} completed</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">Status: <span className="font-medium">{completionPercentage < 25 ? 'At risk' : completionPercentage <= 65 ? 'On track' : 'Good'}</span></div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4">
                  <div className="flex space-x-8 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'all'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      All Content ({assignedData.metrics.total})
                    </button>
                    <button
                      onClick={() => setActiveTab('notStarted')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'notStarted'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Not Started ({assignedData.metrics.notStarted || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('inProgress')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'inProgress'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      In Progress ({assignedData.metrics.inProgress})
                    </button>
                    <button
                      onClick={() => setActiveTab('completed')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'completed'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Completed ({assignedData.metrics.completed})
                    </button>
                    <button
                      onClick={() => setActiveTab('overdue')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'overdue'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Overdue ({assignedData.metrics.overdue})
                    </button>
                    <button
                      onClick={() => setActiveTab('dueSoon')}
                      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'dueSoon'
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      Due Soon ({assignedData.metrics.dueSoon})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-6">
                    {filteredContent.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600">
                          {activeTab === 'all' ? 'No content assigned yet.' : `No ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase()} content.`}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default TraineeDashboard;