import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notifications';
import '../styles/chat.css';

export const NotificationBell = ({ userType = 'trainee' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notifResponse, countResponse] = await Promise.all([
        getNotifications(userType),
        getUnreadCount(userType)
      ]);

      if (notifResponse.success) {
        const notifications = notifResponse.notifications || [];
        setNotifications(notifications);
        console.log(`📬 [NotificationBell] Fetched ${notifications.length} notifications for ${userType}`, {
          total: notifications.length,
          unread: notifications.filter(n => !n.isRead).length,
          types: notifications.map(n => n.type)
        });
      } else {
        console.warn('⚠️ [NotificationBell] Failed to fetch notifications:', notifResponse);
      }

      if (countResponse.success) {
        const count = countResponse.count || 0;
        setUnreadCount(count);
        console.log(`📬 [NotificationBell] Unread count for ${userType}:`, count);
      } else {
        console.warn('⚠️ [NotificationBell] Failed to fetch unread count:', countResponse);
      }
    } catch (error) {
      console.error('❌ [NotificationBell] Error fetching notifications:', error);
      // Set defaults on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 10 seconds for faster updates
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
        await markAsRead(notification._id, userType);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
      }

      // Navigate based on notification type and user type
      if (notification.refId) {
        if (notification.refType === 'Content') {
          const contentPath = userType === 'supervisor' 
            ? `/supervisor/content/${notification.refId}` 
            : `/trainee/content/${notification.refId}`;
          navigate(contentPath);
        } else if (notification.refType === 'Chat') {
          // Navigate to chat - for trainee, go to their chat page
          // For supervisor, we'd need the traineeId from the chat message
          if (userType === 'trainee') {
            navigate('/trainee/chat');
          } else if (userType === 'supervisor') {
            // For supervisor, we'd need to extract traineeId from the chat message
            // For now, just navigate to groups page
            navigate('/supervisor/groups');
          }
        }
      }

      setShowDropdown(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(userType);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIconClass = (type) => {
    const classes = {
      'NEW_CONTENT': 'notification-icon-new-content',
      'CONTENT_UPDATED': 'notification-icon-content-updated',
      'QUIZ_ASSIGNED': 'notification-icon-quiz-assigned',
      'NEW_MESSAGE': 'notification-icon-new-message'
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
