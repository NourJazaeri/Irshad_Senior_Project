import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notifications';

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

      if (notification.refId) {
        navigate('/trainee/content');
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

  const getNotificationColor = (type) => {
    const colors = {
      'NEW_CONTENT': '#3b82f6',
      'DEADLINE_SOON': '#f59e0b',
      'CONTENT_UPDATED': '#10b981',
      'QUIZ_ASSIGNED': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', marginRight: '20px' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          padding: '8px',
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        aria-label="Notifications"
      >
        <FiBell style={{ width: '24px', height: '24px', color: '#374151' }} />

        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: '700',
            color: 'white',
            backgroundColor: '#ef4444',
            borderRadius: '10px',
            transform: 'translate(25%, -25%)',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          right: '0',
          marginTop: '8px',
          width: '384px',
          maxWidth: '90vw',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          zIndex: 9999,
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ fontWeight: '600', color: '#111827', margin: 0, fontSize: '16px' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '13px',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <FiBell style={{ width: '48px', height: '48px', margin: '0 auto 8px', color: '#d1d5db' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: notification.isRead ? 'white' : '#eff6ff',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? 'white' : '#eff6ff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <FiBell style={{ 
                        width: '20px', 
                        height: '20px', 
                        marginTop: '2px', 
                        flexShrink: 0,
                        color: getNotificationColor(notification.type)
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '8px' }}>
                          <p style={{
                            fontSize: '14px',
                            fontWeight: notification.isRead ? '500' : '600',
                            color: '#111827',
                            margin: '0 0 4px 0'
                          }}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '50%',
                              flexShrink: 0,
                              marginTop: '6px'
                            }}></span>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0' }}>
                          {notification.body}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
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
