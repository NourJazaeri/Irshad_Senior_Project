import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notifications';
import '../styles/chat.css';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notifResponse, countResponse] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);

      if (notifResponse.success) {
        setNotifications(notifResponse.notifications);
      }

      if (countResponse.success) {
        setUnreadCount(countResponse.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
      }

      // Navigate to the specific content if refId is available
      if (notification.refId && notification.refType === 'Content') {
        navigate(`/trainee/content/${notification.refId}`);
      }

      setShowDropdown(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIconClass = (type) => {
    const classes = {
      'NEW_CONTENT': 'notification-icon-new-content',
      'DEADLINE_SOON': 'notification-icon-deadline-soon',
      'CONTENT_UPDATED': 'notification-icon-content-updated',
      'QUIZ_ASSIGNED': 'notification-icon-quiz-assigned'
    };
    return classes[type] || 'notification-icon-default';
  };

  return (
    <div ref={dropdownRef} className="notification-bell-container">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="notification-bell-btn"
        aria-label="Notifications"
      >
        <FiBell className="notification-bell-icon" />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="notification-mark-all-btn"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <FiBell className="notification-empty-icon" />
                <p className="notification-empty-text">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-item-content">
                      <FiBell className={`notification-item-icon ${getNotificationIconClass(notification.type)}`} />
                      <div className="notification-item-details">
                        <div className="notification-item-header">
                          <p className="notification-item-title">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="notification-item-unread-dot"></span>
                          )}
                        </div>
                        <p className="notification-item-body">
                          {notification.body}
                        </p>
                        <p className="notification-item-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
