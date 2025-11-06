import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationAsRead } from '../services/notifications';
import '../styles/notification-bell.css';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications || []);
      const unread = (data.notifications || []).filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to content if refId exists
    if (notification.refId) {
      window.location.href = '/trainee/content';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} new</span>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={48} strokeWidth={1} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.body}</p>
                    <span className="notification-time">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="notification-unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
