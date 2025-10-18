// Utility functions for user authentication and session management

export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Decode the JWT token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id || payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getSessionId = () => {
  return localStorage.getItem('sessionId');
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const isAdmin = () => {
  return getUserRole() === 'Admin';
};

export const isSupervisor = () => {
  return getUserRole() === 'Supervisor';
};

export const isTrainee = () => {
  return getUserRole() === 'Trainee';
};

export const isWebOwner = () => {
  return getUserRole() === 'WebOwner';
};