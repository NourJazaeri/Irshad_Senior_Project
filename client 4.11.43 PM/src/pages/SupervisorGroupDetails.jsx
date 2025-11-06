import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getSupervisorGroupDetails } from '../services/api';
import { FiMail, FiArrowLeft, FiUser, FiPlus, FiEye } from 'react-icons/fi';
import AddContentModal from '../components/AddContentModal';
import ContentCard from '../components/ContentCard';
import '../styles/supervisor.css';

export default function SupervisorGroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ groupName: '', departmentName: '', membersCount: 0 });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraineeForModal, setSelectedTraineeForModal] = useState(null);
  const [contentList, setContentList] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSupervisorGroupDetails(id);
        setMeta(data.group);
        setMembers(data.members || []);
      } catch (e) {
        console.error('Load group details failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
    <div>
          {/* Breadcrumb */}
          <div className="sv-backline">
            <Link to="/supervisor" className="sv-backlink">
              <FiArrowLeft /> Groups
            </Link>
            <span className="sv-crumb-sep">/</span>
            <span className="sv-crumb-current">{meta.groupName || 'Group'}</span>
            {meta.departmentName && <span className="sv-crumb-sub">({meta.departmentName})</span>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              <FiPlus size={18} />
              Add Content to Group
            </button>
          </div>

          {/* Overview KPI */}
          <div className="sv-grid sv-grid-2" style={{ gap: 22, marginTop: 14 }}>
            <div className="sv-card sv-card-pad">
              <div className="sv-kpi-title">Group Overview</div>
              <div className="sv-kpi-caption">Members</div>
              <div className="sv-kpi-number">{meta.membersCount}</div>
            </div>
          </div>

          {/* Members Table */}
          <div className="sv-table-card" style={{ marginTop: 22 }}>
            <div className="sv-table-wrap">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th className="sv-col-name">Name</th>
                    <th className="sv-col-email">Email</th>
                    <th className="sv-col-id">Employee ID</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 18, color: '#6b7280' }}>
                        Loading…
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: 18, color: '#6b7280' }}>
                        No trainees in this group.
                      </td>
                    </tr>
                  ) : (
                    members.map((m, idx) => (
                      <tr key={m.traineeId || idx} className="hoverable">
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
                        <td className="sv-col-email">
                          <div className="sv-email">
                            <FiMail className="sv-email-ic" />
                            {m.email ? (
                              <a
                                className="sv-link sv-ellipsis"
                                href={`mailto:${m.email}`}
                                title={m.email}
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Content Section */}
          <div className="sv-table-card" style={{ marginTop: 22 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#111827',
                margin: 0
              }}>
                Assigned Content
              </h2>
            </div>

            {loadingContent ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                Loading content...
              </div>
            ) : contentList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                No content assigned to this group yet.
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
                {contentList.map(content => (
                  <div key={content._id} onClick={() => navigate(`/supervisor/content/${content._id}`)}>
                    <ContentCard 
                      content={content} 
                      onClick={() => navigate(`/supervisor/content/${content._id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
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
