const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5002';

export const fetchNotifications = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/api/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
};

export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
};

export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  return response.json();
};
