import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTraineeSupervisor, getTraineeUnreadCount } from "../services/api";
import { FiMessageCircle, FiUser, FiMail } from "react-icons/fi";
import { NotificationBell } from "../components/NotificationBell";
import "../styles/login.css";
import "../styles/chat.css";

function TraineeDashboard() {
  const navigate = useNavigate();
  const [supervisorInfo, setSupervisorInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSupervisorInfo();

    // Poll for unread count every 10 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadSupervisorInfo = async () => {
    try {
      setLoading(true);
      const data = await getTraineeSupervisor();
      setSupervisorInfo(data.supervisor);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load supervisor:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="app-container">
      <div className="trainee-dashboard-wrapper">
        {/* Header Section */}
        <div className="trainee-header">
          <div>
            <h1 className="trainee-title">Trainee Dashboard</h1>
            <p className="trainee-subtitle">Welcome to your training portal!</p>
          </div>
          <NotificationBell />
        </div>

        {/* Main Content */}
        <div className="trainee-content">
          {/* Supervisor Card */}
          {loading ? (
            <div className="trainee-card trainee-loading">
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="trainee-card trainee-error">
              <FiUser size={48} />
              <h3>Supervisor Information</h3>
              <p className="error-text">{error}</p>
            </div>
          ) : supervisorInfo ? (
            <div className="trainee-card supervisor-card">
              <div className="card-icon">
                <FiUser size={32} />
              </div>
              <h3>Your Supervisor</h3>
              <div className="supervisor-info">
                <p className="supervisor-name">
                  {supervisorInfo.fname} {supervisorInfo.lname}
                </p>
                {supervisorInfo.email && (
                  <p className="supervisor-email">
                    <FiMail size={16} /> {supervisorInfo.email}
                  </p>
                )}
              </div>

              {/* Chat Button with Notification Badge */}
              <button className="trainee-chat-btn" onClick={handleChatClick}>
                <FiMessageCircle size={20} />
                <span>Chat with Supervisor</span>
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </button>
            </div>
          ) : (
            <div className="trainee-card trainee-error">
              <FiUser size={48} />
              <h3>No Supervisor Assigned</h3>
              <p>You are not assigned to a group yet. Please contact your administrator.</p>
            </div>
          )}

          {/* Info Cards */}
          <div className="trainee-info-grid">
            <div className="trainee-card info-card">
              <div className="card-icon-small">
                <FiMessageCircle size={24} />
              </div>
              <h4>Communication</h4>
              <p>Stay connected with your supervisor through our chat feature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TraineeDashboard;
