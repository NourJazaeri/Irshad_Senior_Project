import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getSupervisorGroupDetails, getSupervisorUnreadCount } from '../services/api';
import { FiMail, FiArrowLeft, FiUser, FiPlus, FiEye, FiMessageCircle, FiUsers } from 'react-icons/fi';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddContentModal from '../components/AddContentModal';
import ContentCard from '../components/ContentCard';
import '../styles/supervisor.css';
import '../styles/chat.css';

export default function SupervisorGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prevLocationRef = useRef();
  const [meta, setMeta] = useState({ groupName: '', departmentName: '', membersCount: 0 });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraineeForModal, setSelectedTraineeForModal] = useState(null);
  const [contentList, setContentList] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const fetchUnreadCounts = useCallback(async (traineeList) => {
    const counts = {};
    await Promise.all(
      traineeList.map(async (member) => {
        if (member.traineeId) {
          try {
            const count = await getSupervisorUnreadCount(member.traineeId);
            counts[member.traineeId] = count;
          } catch (err) {
            console.error('Failed to fetch unread count for trainee:', member.traineeId, err);
            counts[member.traineeId] = 0;
          }
        }
      })
    );
    setUnreadCounts(counts);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSupervisorGroupDetails(id);
        setMeta(data.group);
        setMembers(data.members || []);
        // Fetch unread counts for all trainees
        if (data.members && data.members.length > 0) {
          fetchUnreadCounts(data.members);
        }
      } catch (e) {
        console.error('Load group details failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Refresh unread counts when returning from chat page
  useEffect(() => {
    // Check if we're coming back from a chat page
    const prevPath = prevLocationRef.current;
    const currentPath = location.pathname;

    // If we were on a chat page and now we're back on this group details page, refresh counts
    if (prevPath && prevPath.includes('/supervisor/chat/') && currentPath.includes('/supervisor/groups/') && members.length > 0) {
      console.log('🔄 Refreshing unread counts after returning from chat');
      fetchUnreadCounts(members);
    }

    // Update previous location
    prevLocationRef.current = currentPath;
  }, [location.pathname, members, fetchUnreadCounts]);

  // Poll for unread counts every 10 seconds when members are loaded
  useEffect(() => {
    if (members.length === 0) return;

    // Initial fetch
    fetchUnreadCounts(members);

    // Set up polling interval
    const interval = setInterval(() => {
      fetchUnreadCounts(members);
    }, 10000);

    // Refresh counts when page becomes visible (user returns from chat)
    const handleVisibilityChange = () => {
      if (!document.hidden && members.length > 0) {
        fetchUnreadCounts(members);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      if (members.length > 0) {
        fetchUnreadCounts(members);
      }
    });

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [members, fetchUnreadCounts]);

  useEffect(() => {
    if (members.length > 0 || !loading) {
      fetchGroupContent();
    }
  }, [members, id]);

  const fetchGroupContent = async () => {
    try {
      setLoadingContent(true);
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      // Fetch all content assigned to this group
      const response = await fetch(`${API_BASE}/api/content/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const allContent = await response.json();
        // Filter content assigned to this group or to trainees in this group
        const groupContent = allContent.filter(content => {
          // Check if content is assigned to this group
          if (content.assignedTo_GroupID && String(content.assignedTo_GroupID._id || content.assignedTo_GroupID) === String(id)) {
            return true;
          }
          // Check if content is assigned to any trainee in this group
          if (content.assignedTo_traineeID) {
            const traineeId = content.assignedTo_traineeID._id || content.assignedTo_traineeID;
            return members.some(member => String(member.traineeId) === String(traineeId));
          }
          return false;
        });
        setContentList(groupContent);
      }
    } catch (error) {
      console.error('Error fetching group content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Breadcrumb and Actions - Aligned */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
              <span 
                style={{ color: '#6b7280', cursor: 'pointer' }} 
                onClick={() => navigate('/supervisor/groups')}
              >
                Groups
              </span>
              <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
              <span style={{ color: '#111827', fontWeight: '700' }}>
                {meta.groupName || 'Group'}
              </span>
            </div>

            {/* Actions */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover shadow-soft text-base font-semibold px-6 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Content to Group
            </Button>
          </div>

          {/* Overview KPI */}
          <div className="sv-grid sv-grid-2" style={{ gap: 22, marginTop: 24 }}>
            <div className="sv-card sv-card-pad sv-kpi-card-enhanced">
              <div className="sv-kpi-icon-wrapper">
                <FiUsers className="sv-kpi-icon" />
              </div>
              <div className="sv-kpi-title">Group Overview</div>
              <div className="sv-kpi-caption">Total Members</div>
              <div className="sv-kpi-number">{meta.membersCount}</div>
            </div>
            <div className="sv-card sv-card-pad sv-kpi-card-enhanced">
              <div className="sv-kpi-icon-wrapper">
                <FiEye className="sv-kpi-icon" />
              </div>
              <div className="sv-kpi-title">Assigned Content</div>
              <div className="sv-kpi-caption">Items Available</div>
              <div className="sv-kpi-number">{contentList.length}</div>
            </div>
          </div>

          {/* Members Table */}
          <div className="sv-table-card sv-table-card-enhanced" style={{ marginTop: 24 }}>
            <div className="sv-table-header" style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FiUsers size={22} style={{ color: '#2563eb' }} />
                Group Members
              </h3>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th className="sv-col-name">Name</th>
                    <th className="sv-col-email">Email</th>
                    <th className="sv-col-id">Employee ID</th>
                    <th className="sv-col-actions">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 18, color: '#6b7280' }}>
                        Loading…
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 18, color: '#6b7280' }}>
                        No trainees in this group.
                      </td>
                    </tr>
                  ) : (
                    members.map((m, idx) => (
                      <tr 
                        key={m.traineeId || idx} 
                        className="hoverable sv-table-row-enhanced"
                        onClick={() => {
                          // Navigate to trainee details page, passing group info for breadcrumb
                          navigate(`/supervisor/trainees/${m.traineeId}`, {
                            state: {
                              groupId: id,
                              groupName: meta.groupName
                            }
                          });
                        }}
                        style={{ 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* NAME */}
                        <td className="sv-col-name">
                          <div className="sv-user">
                            <span className="sv-avatar">
                              <FiUser className="sv-avatar-icon" />
                            </span>
                            <span className="sv-user-name">{m.name || '—'}</span>
                          </div>
                        </td>

                        {/* EMAIL */}
                        <td className="sv-col-email" onClick={(e) => e.stopPropagation()}>
                          <div className="sv-email">
                            <FiMail className="sv-email-ic" />
                            {m.email ? (
                              <a
                                className="sv-link sv-ellipsis"
                                href={`mailto:${m.email}`}
                                title={m.email}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {m.email}
                              </a>
                            ) : (
                              <span className="sv-ellipsis">—</span>
                            )}
                          </div>
                        </td>

                        {/* EMPLOYEE ID */}
                        <td className="sv-col-id">{m.empId || '—'}</td>

                        {/* ACTIONS - Chat Button with Notification Badge */}
                        <td className="sv-col-actions" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/supervisor/chat/${m.traineeId}`}
                            title="Chat with trainee"
                            style={{
                              padding: '8px 16px',
                              background: '#2563EB',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s',
                              color: '#FFFFFF',
                              fontWeight: '500',
                              fontSize: '14px',
                              textDecoration: 'none',
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
                            {unreadCounts[m.traineeId] > 0 && (
                              <span className="sv-chat-badge">{unreadCounts[m.traineeId]}</span>
                            )}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Content Section */}
          <div className="sv-table-card sv-table-card-enhanced" style={{ marginTop: 24 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#111827',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <FiEye size={22} style={{ color: '#2563eb' }} />
                Assigned Content
              </h2>
              <span style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {contentList.length} {contentList.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div style={{ padding: '24px' }}>
              {loadingContent ? (
                <div className="sv-loading-state" style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                  <div className="sv-spinner"></div>
                  <div style={{ marginTop: '16px', fontSize: '15px' }}>Loading content...</div>
                </div>
              ) : contentList.length === 0 ? (
                <div className="sv-empty-state" style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
                  <div className="sv-empty-icon">
                    <FiEye size={48} />
                  </div>
                  <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: '500' }}>No content assigned yet</div>
                  <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '14px' }}>Add content to this group to get started</div>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '20px' 
                }}>
                  {contentList.map((content, index) => (
                    <div 
                      key={content._id} 
                      onClick={() => navigate(`/supervisor/content/${content._id}`)}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        animation: 'fadeInUp 0.4s ease-out forwards',
                        opacity: 0
                      }}
                    >
                      <ContentCard 
                        content={content} 
                        onClick={() => navigate(`/supervisor/content/${content._id}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Content Modal */}
          <AddContentModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTraineeForModal(null);
            }}
            onContentAdded={() => {
              setIsModalOpen(false);
              setSelectedTraineeForModal(null);
              // Optionally refresh the data or show a success message
            }}
            groupId={selectedTraineeForModal ? null : id}
            traineeId={selectedTraineeForModal}
          />
    </div>
  );
}
