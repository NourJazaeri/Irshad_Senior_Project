// client/src/services/notifications.js
import { getAuthHeaders } from './api.js';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export async function getNotifications(userType = 'trainee') {
  const endpoint = userType === 'supervisor' ? '/api/notifications/supervisor' : '/api/notifications/trainee';
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
}

export async function getUnreadCount(userType = 'trainee') {
  const endpoint = userType === 'supervisor' 
    ? '/api/notifications/supervisor/unread-count' 
    : '/api/notifications/unread-count';
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to fetch unread count');
  return response.json();
}

export async function markAsRead(notificationId, userType = 'trainee') {
  const endpoint = userType === 'supervisor' 
    ? `/api/notifications/supervisor/${notificationId}/read` 
    : `/api/notifications/${notificationId}/read`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PATCH',
    headers: getAuthHeaders(null)
  });
  if (!response.ok) throw new Error('Failed to mark as read');
  return response.json();
}

export async function markAllAsRead(userType = 'trainee') {
  const endpoint = userType === 'supervisor' 
    ? '/api/notifications/supervisor/mark-all-read' 
    : '/api/notifications/mark-all-read';
  const response = await fetch(`${API_BASE}${endpoint}`, {
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
