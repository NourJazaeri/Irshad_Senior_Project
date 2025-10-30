// client/src/services/api.js

// Base URL (compatible with both old and new env var names)
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5002';

console.log('API_BASE =', API_BASE, 'token?', !!localStorage.getItem('token'));

/* ------------------------------ Auth Headers ------------------------------ */
export function getAuthHeaders(contentType = 'application/json') {
  const token = localStorage.getItem('token');
  const headers = {};
  if (contentType) headers['Content-Type'] = contentType;
  headers['Accept'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('role_lc');
  localStorage.removeItem('userId');
}

/* --------------------------------- Auth ---------------------------------- */
// Login user: stores token (and role) on success
export async function loginUser({ email, password, role }) {
  try {
    const url = `${API_BASE}/api/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ role, email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.message ||
        (response.status === 400
          ? 'Email, password and role are required'
          : response.status === 401
          ? 'Incorrect password'
          : response.status === 403
          ? 'You are not allowed to log in'
          : response.status === 404
          ? 'Account not found'
          : response.status === 503
          ? 'Service temporarily unavailable. Please try again later.'
          : 'Login failed');
      return { success: false, message };
    }

    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.role || role) localStorage.setItem('role', data.role || role);
    if (data?.user?.id) localStorage.setItem('userId', data.user.id);

    const roleNorm = (data?.role || role || '').toString();
    localStorage.setItem('role_lc', roleNorm.toLowerCase());

    return data; // expected to include { success:true, token, role, ... }
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, message: 'Network error - cannot connect to server' };
  }
}

// Logout and clear local token
export async function logoutUser(sessionId) {
  try {
    const url = `${API_BASE}/api/auth/logout`;
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP error! status: ${response.status}. ${text}`);
    }

    const data = await response.json();
    clearAuth();
    return data;
  } catch (error) {
    console.error('Error logging out:', error);
    clearAuth();
    return { success: false, message: error.message || 'Cannot connect to server during logout.' };
  }
}

/* ------------------------------ HTTP Helpers ------------------------------ */
async function httpGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(null), // no Content-Type for GET
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `GET ${path} failed with ${res.status}`);
  }
  return res.json();
}

/* -------------------------- Supervisor Endpoints -------------------------- */
/** New-style named functions (used by pages/hooks) */
export async function getSupervisorOverview() {
  // backend exposes /api/supervisor/overview
  return httpGet('/api/supervisor/overview'); // -> { fullName, totalTrainees, activeGroups }
}

export async function getSupervisorGroups() {
  // backend exposes /api/supervisor/my-groups
  return httpGet('/api/supervisor/my-groups'); // -> { items: [...] }
}

export async function getSupervisorGroupDetails(groupId) {
  return httpGet(`/api/supervisor/groups/${groupId}`); // -> { group, members }
}

/** Backward-compatible object (keeps your old usage intact) */
export const supervisorApi = {
  getOverview: getSupervisorOverview,
  getMyGroups: getSupervisorGroups,
};

/* ---------------------------- Admin Endpoints ----------------------------- */
/** Departments list for admin */
export async function adminGetDepartments() {
  const data = await httpGet('/api/departments'); // -> { ok, departments }
  if (!data?.ok) throw new Error(data?.message || 'Failed to fetch departments');
  return data.departments || [];
}

/** Single department header (name/company) */
export async function adminGetDepartment(deptId) {
  const data = await httpGet(`/api/departments/${deptId}`); // -> { ok, department }
  if (!data?.ok) throw new Error(data?.message || 'Failed to fetch department');
  return data.department;
}

/** Groups for a department (cards) */
export async function adminGetGroupsByDepartment(deptId) {
  const data = await httpGet(`/api/groups/by-department/${deptId}`); // -> { ok, groups }
  if (!data?.ok) throw new Error(data?.message || 'Failed to fetch groups');
  return data.groups || [];
}

/** Single group details for admin */
export async function adminGetGroupDetails(groupId) {
  // This uses the endpoint that returns { group, supervisor, members }
  return httpGet(`/api/groups/${groupId}`); 
}

/** Remove supervisor from a group (DELETE method is best practice) */
export async function adminRemoveSupervisor(groupId) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/supervisor`, {
    method: 'DELETE',
    headers: getAuthHeaders(null),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to remove supervisor`);
  }
  return res.json();
}

/** Remove trainee from a group */
export async function adminRemoveTrainee(groupId, traineeId) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/trainees/${traineeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(null),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to remove trainee`);
  }
  return res.json();
}

/* ---------------------------- Chat Endpoints ------------------------------ */
/** Get chat conversation between supervisor and trainee */
export async function getChatConversation(traineeId) {
  console.log('🌐 [api.js] getChatConversation called with traineeId:', traineeId);
  const path = `/api/chat/conversation/${traineeId}`;
  console.log('🌐 [api.js] Fetching from:', `${API_BASE}${path}`);

  const data = await httpGet(path);

  console.log('✅ [api.js] Response received:', data);
  console.log('✅ [api.js] data.ok:', data?.ok);
  console.log('✅ [api.js] messages length:', data?.messages?.length);

  if (!data?.ok) throw new Error(data?.error || 'Failed to fetch conversation');
  return data;
}

/** Send a chat message */
export async function sendChatMessage(traineeId, message) {
  const res = await fetch(`${API_BASE}/api/chat/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ traineeId, message }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to send message');
  }
  return res.json();
}

/** Get all conversations */
export async function getChatConversations() {
  const data = await httpGet('/api/chat/conversations');
  if (!data?.ok) throw new Error(data?.error || 'Failed to fetch conversations');
  return data.conversations || [];
}

/** Mark message as read */
export async function markMessageAsRead(messageId) {
  const res = await fetch(`${API_BASE}/api/chat/${messageId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(null),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to mark message as read');
  }
  return res.json();
}

/* ------------------------ Trainee Chat Endpoints -------------------------- */
/** Get trainee's supervisor information */
export async function getTraineeSupervisor() {
  const data = await httpGet('/api/chat/trainee/my-supervisor');
  if (!data?.ok) throw new Error(data?.error || 'Failed to fetch supervisor');
  return data;
}

/** Get trainee's conversation with supervisor */
export async function getTraineeConversation() {
  const data = await httpGet('/api/chat/trainee/conversation');
  if (!data?.ok) throw new Error(data?.error || 'Failed to fetch conversation');
  return data;
}

/** Send a message from trainee to supervisor */
export async function sendTraineeMessage(message) {
  const res = await fetch(`${API_BASE}/api/chat/trainee/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to send message');
  }
  return res.json();
}

/** Get unread message count for trainee */
export async function getTraineeUnreadCount() {
  const data = await httpGet('/api/chat/trainee/unread-count');
  if (!data?.ok) throw new Error(data?.error || 'Failed to fetch unread count');
  return data.unreadCount || 0;
}

/** Mark all messages as read for trainee */
export async function markTraineeMessagesRead() {
  const res = await fetch(`${API_BASE}/api/chat/trainee/mark-read`, {
    method: 'PATCH',
    headers: getAuthHeaders(null),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to mark messages as read');
  }
  return res.json();
}

/* --------------------------------- Export --------------------------------- */
export default {
  API_BASE,
  // auth
  loginUser,
  logoutUser,
  getAuthHeaders,
  clearAuth,
  // supervisor
  supervisorApi,
  getSupervisorOverview,
  getSupervisorGroups,
  getSupervisorGroupDetails,
  // admin
  adminGetDepartments,
  adminGetDepartment,
  adminGetGroupsByDepartment,
  adminGetGroupDetails,
  adminRemoveSupervisor,
  adminRemoveTrainee,
  // chat
  getChatConversation,
  sendChatMessage,
  getChatConversations,
  markMessageAsRead,
  // trainee chat
  getTraineeSupervisor,
  getTraineeConversation,
  sendTraineeMessage,
  getTraineeUnreadCount,
  markTraineeMessagesRead,
};