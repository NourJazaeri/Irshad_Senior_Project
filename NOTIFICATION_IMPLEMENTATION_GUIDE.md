# 🔔 NOTIFICATION SYSTEM - COMPLETE IMPLEMENTATION GUIDE

## ✅ COMPLETED (Already Done by Claude)

### Backend Files Created:
1. ✅ `server/src/models/Notification.js` - Already exists with perfect schema
2. ✅ `server/src/routes/notifications.js` - Created with 5 API endpoints
3. ✅ `server/src/services/notificationService.js` - Created with helper functions

---

## 📝 REMAINING TASKS (Step-by-Step)

### STEP 1: Create Frontend Notification Service

**File:** `client/src/services/notifications.js`

```javascript
// client/src/services/notifications.js
import { getAuthHeaders } from './api.js';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5002';

export async function getNotifications() {
  const response = await fetch(`${API_BASE}/api/notifications/trainee`, {
    method: 'GET',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function getUnreadCount() {
  const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
    method: 'GET',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to fetch unread count');
  return response.json();
}

export async function markAsRead(notificationId) {
  const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to mark as read');
  return response.json();
}

export async function markAllAsRead() {
  const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
    method: 'PATCH',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to mark all as read');
  return response.json();
}

export async function deleteNotification(notificationId) {
  const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to delete notification');
  return response.json();
}
```

---

### STEP 2: Create Notification Bell Component

**File:** `client/src/components/NotificationBell.jsx`

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX } from 'react-icons/fi';
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
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
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
        navigate(`/trainee/content`);
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

  const getNotificationIcon = (type) => {
    const colors = {
      'NEW_CONTENT': 'text-blue-600',
      'DEADLINE_SOON': 'text-yellow-600',
      'CONTENT_UPDATED': 'text-green-600',
      'QUIZ_ASSIGNED': 'text-purple-600'
    };
    return colors[type] || 'text-gray-600';
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ marginRight: '20px' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
        style={{ position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer' }}
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
            transform: 'translate(25%, -25%)'
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
          zIndex: '9999',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb'
          }}>
            <h3 style={{ fontWeight: '600', color: '#111827', margin: '0' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: '13px',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: '1' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <FiBell style={{ width: '48px', height: '48px', margin: '0 auto 8px', color: '#d1d5db' }} />
                <p style={{ margin: '0' }}>No notifications yet</p>
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
                      <FiBell className={getNotificationIcon(notification.type)} style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: '0' }} />
                      <div style={{ flex: '1', minWidth: '0' }}>
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
                              flexShrink: '0',
                              marginTop: '6px'
                            }}></span>
                          )}
                        </div>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px 0' }}>
                          {notification.body}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0' }}>
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
```

---

### STEP 3: Register Notification Routes in Server

**File:** `server/src/server.js`

Find the section where routes are imported (around line 15-30), and ADD:

```javascript
import notificationRoutes from './routes/notifications.js';
```

Find the section where routes are registered (around line 100-150), and ADD:

```javascript
app.use('/api/notifications', notificationRoutes);
```

---

### STEP 4: Add Notifications to Content Creation

**File:** `server/src/routes/content.js`

At the TOP of the file (around line 1-10), ADD the import:

```javascript
import { createBulkContentNotifications } from '../services/notificationService.js';
```

Find the `createInitialProgressRecords` function or where progress records are created for trainees.
Search for this pattern (should be around line 180-250):

```javascript
// After progress records are created
for (const traineeId of traineesToAssign) {
  await Progress.create({
    ...
  });
}
```

AFTER the progress creation loop, ADD:

```javascript
// Create notifications for all assigned trainees
if (traineesToAssign && traineesToAssign.length > 0) {
  try {
    await createBulkContentNotifications(traineesToAssign, content);
    console.log(`✅ Notifications sent to ${traineesToAssign.length} trainees`);
  } catch (notifError) {
    console.error('❌ Error creating notifications:', notifError);
    // Don't fail the whole operation if notification fails
  }
}
```

---

### STEP 5: Add NotificationBell to Trainee Topbar

**File:** Find your trainee topbar component (might be `UnifiedTopbar.jsx` or `TraineeTopbar.jsx`)

At the TOP, ADD import:

```javascript
import NotificationBell from './NotificationBell';
```

In the JSX, find where the topbar header is rendered (look for trainee-specific header).
ADD the bell component:

```jsx
{/* Add this in the trainee topbar, between title and logo */}
<div className="flex items-center gap-4">
  <h1>Trainee Dashboard</h1>

  {/* ADD THIS */}
  <NotificationBell />

  {/* Company logo or other elements */}
</div>
```

---

## 🧪 TESTING

1. **Start servers:**
   ```bash
   cd server && npm run dev
   cd client && npm run dev
   ```

2. **Test as Admin/Supervisor:**
   - Create new content
   - Assign to a trainee or group
   - Check server logs for "Notifications sent to X trainees"

3. **Test as Trainee:**
   - Log in as trainee
   - Check bell icon in topbar
   - Should see red badge with count
   - Click bell to see notifications
   - Click notification to navigate to content

4. **Verify Database:**
   ```javascript
   // In MongoDB
   db.Notification.find({}).pretty()
   ```

---

## 📊 SUMMARY OF ALL FILES

### ✅ Created (3 files):
1. `server/src/routes/notifications.js`
2. `server/src/services/notificationService.js`
3. `client/src/services/notifications.js` (you need to create)

### ✅ To Create (1 file):
4. `client/src/components/NotificationBell.jsx` (you need to create)

### ✏️ To Modify (3 files):
5. `server/src/server.js` - Add 2 lines
6. `server/src/routes/content.js` - Add 1 import + 8 lines
7. Trainee topbar component - Add 1 import + 1 line

---

## 🎯 SUCCESS CRITERIA

- ✅ Trainee sees bell icon with unread count
- ✅ Clicking bell shows dropdown with notifications
- ✅ Notifications created when content is assigned
- ✅ Mark as read functionality works
- ✅ Navigate to content when clicking notification
- ✅ Real-time updates every 30 seconds

---

## 🐛 TROUBLESHOOTING

**Issue:** Bell icon doesn't show
**Fix:** Check that NotificationBell is imported and added to trainee topbar

**Issue:** No notifications appear
**Fix:** Check server logs when creating content - should see "Notifications sent to X trainees"

**Issue:** 401 Unauthorized
**Fix:** Ensure user is logged in and token is valid

**Issue:** Notifications not created
**Fix:** Check that content.js has the notification creation code after progress records

---

**Implementation complete! Follow the steps above to finish the notification system.**
