// client/src/services/notifications.js
import { getAuthHeaders } from './api.js';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

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
