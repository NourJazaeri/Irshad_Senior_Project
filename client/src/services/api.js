const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Global function to handle session expiration
export const handleSessionExpired = () => {
  // Clear all auth data
  localStorage.removeItem('token');
  localStorage.removeItem('sessionId');
  localStorage.removeItem('userRole');
  
  // Show alert
  alert('⏰ Your session has expired. Please log in again.');
  
  // Redirect to login
  window.location.href = '/login';
};

// Enhanced fetch wrapper that handles authentication errors
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Add authorization header if token exists
  if (token && !options.headers?.Authorization) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      handleSessionExpired();
      throw new Error('Session expired');
    }
    
    return response;
  } catch (error) {
    // If it's a network error and we have a token, check if it's expired
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        if (payload.exp && payload.exp < currentTime) {
          handleSessionExpired();
        }
      } catch {
        // Token is malformed, clear it
        handleSessionExpired();
      }
    }
    throw error;
  }
};

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

export async function loginUser({ email, password, role }) {
  try {
    console.log("Sending login request to:", `${API_BASE}/api/auth/login`);
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ role, email, password }),
    });

    console.log("Response status:", response.status);
    
    // Always attempt to parse JSON body
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Prefer server-provided message, fallback to generic per status
      const message = data?.message || (
        response.status === 400 ? "Email, password and role are required" :
        response.status === 401 ? "Incorrect password" :
        response.status === 403 ? "You are not allowed to log in" :
        response.status === 404 ? "Account not found" :
        response.status === 503 ? "Service temporarily unavailable. Please try again later." :
        "Login failed"
      );
      return { success: false, message };
    }
    
    console.log("Response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    return { 
      success: false, 
      message: "Network error - cannot connect to server" 
    };
  }
}

export async function logoutUser(sessionId) {
  try {
    console.log("Sending logout request to:", `${API_BASE}/api/auth/logout`);
    
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ sessionId }),
    });

    console.log("Logout response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Logout response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error logging out:", error);
    return { 
      success: false, 
      message: error.message || "Cannot connect to server during logout." 
    };
  }
}

export async function getEmployeesByDepartment({ departmentName, search = "" }) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/employees/by-department?departmentName=${encodeURIComponent(departmentName)}&search=${encodeURIComponent(search)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to load employees: ${res.status}`);
    }

    const data = await res.json();
    return data.employees || [];
  } catch (err) {
    console.error("❌ getEmployeesByDepartment error:", err);
    throw err;
  }
}

export async function getEmployeesByDepartmentId({ departmentId, search = "" }) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/employees/by-department-id/${departmentId}?search=${encodeURIComponent(search)}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to load employees: ${res.status}`);
    }

    const data = await res.json();
    return data.employees || [];
  } catch (err) {
    console.error("❌ getEmployeesByDepartmentId error:", err);
    throw err;
  }
}

export async function finalizeGroup(payload) {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/api/groups/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to create group");
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ finalizeGroup error:", err);
    throw err;
  }
}

// Helper function for GET requests
async function httpGet(url) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP error! status: ${res.status}`);
  }
  
  return res.json();
}

// Helper function for auth headers
function getAuthHeaders(token = null) {
  const authToken = token || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
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

// User Management API Functions
export async function fetchEmployees() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching employees...");
    
    // Use authenticatedFetch instead of fetch - it handles 401 automatically
    const response = await authenticatedFetch(`${API_BASE}/api/admin/users/employees`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    console.log("Employees response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Employees response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    // Don't return error if session expired (user already redirected)
    if (error.message === 'Session expired') {
      return null;
    }
    return { 
      success: false, 
      message: error.message || "Cannot fetch employees.",
      data: []
    };
  }
}

export async function fetchTrainees() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching trainees...");
    
    const response = await fetch(`${API_BASE}/api/admin/users/trainees`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Trainees response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Trainees response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching trainees:", error);
    return { 
      success: false, 
      message: error.message || "Cannot fetch trainees.",
      data: []
    };
  }
}

export async function fetchSupervisors() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching supervisors...");
    
    const response = await fetch(`${API_BASE}/api/admin/users/supervisors`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Supervisors response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Supervisors response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return { 
      success: false, 
      message: error.message || "Cannot fetch supervisors.",
      data: []
    };
  }
}

// Individual User Detail API Functions
export async function fetchEmployeeDetails(employeeId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching employee details for ID:", employeeId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/employees/${employeeId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Employee details response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Employee details response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching employee details:", error);
    return { 
      success: false, 
      message: error.message || "Cannot fetch employee details.",
      data: null
    };
  }
}

export async function fetchTraineeDetails(traineeId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching trainee details for ID:", traineeId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/trainees/${traineeId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Trainee details response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Trainee details response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching trainee details:", error);
    return { 
      success: false, 
      message: error.message || "Cannot fetch trainee details.",
      data: null
    };
  }
}

export async function fetchSupervisorDetails(supervisorId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching supervisor details for ID:", supervisorId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/supervisors/${supervisorId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Supervisor details response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Supervisor details response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error fetching supervisor details:", error);
    return { 
      success: false, 
      message: error.message || "Cannot fetch supervisor details.",
      data: null
    };
  }
}

// Delete trainee by employee ID
export async function deleteTraineeByEmployeeId(employeeId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Deleting trainee for employee ID:", employeeId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/trainees/by-employee/${employeeId}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Delete trainee response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Delete trainee response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error deleting trainee:", error);
    return { 
      success: false, 
      message: error.message || "Cannot delete trainee.",
      data: null
    };
  }
}

// Delete supervisor by employee ID
export async function deleteSupervisorByEmployeeId(employeeId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Deleting supervisor for employee ID:", employeeId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/supervisors/by-employee/${employeeId}`, {
      method: "DELETE",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Delete supervisor response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Delete supervisor response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error deleting supervisor:", error);
    return { 
      success: false, 
      message: error.message || "Cannot delete supervisor.",
      data: null
    };
  }
}

// Check if employee is a trainee or supervisor
export async function checkEmployeeUserType(employeeId) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Checking user type for employee ID:", employeeId);
    
    const response = await fetch(`${API_BASE}/api/admin/users/employee-type/${employeeId}`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    console.log("Check user type response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Check user type response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error checking user type:", error);
    return { 
      success: false, 
      message: error.message || "Cannot check user type.",
      data: null
    };
  }
}

// Content API functions
export async function saveContent(contentData) {
  try {
    console.log("Sending save content request to:", `${API_BASE}/api/content/save-content`);
    
    const response = await fetch(`${API_BASE}/api/content/save-content`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(contentData),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        data: data.content,
        message: data.message || "Content saved successfully"
      };
    } else {
      return {
        success: false,
        message: data.error || `Server error: ${response.status}`
      };
    }
  } catch (error) {
    console.error("Error saving content:", error);
    return { 
      success: false, 
      message: error.message || "Cannot connect to server to save content." 
    };
  }
}

export async function getContent(params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const url = `${API_BASE}/api/content/content${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log("Fetching content from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: { 
        "Accept": "application/json"
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: "Content fetched successfully"
      };
    } else {
      return {
        success: false,
        message: data.error || `Server error: ${response.status}`
      };
    }
  } catch (error) {
    console.error("Error fetching content:", error);
    return { 
      success: false, 
      message: error.message || "Cannot connect to server to fetch content." 
    };
  }
}

// --------------------------- Todo API ---------------------------

export async function deleteAllCompletedTodos(traineeId) {
  const token = localStorage.getItem('token');
  const res = await fetch(
    `${API_BASE}/api/todos/completed/${traineeId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to delete all completed todos');
  }
  return res.json();
}

export async function fetchTodos(traineeId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/todos/${traineeId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to fetch todos');
  }
  return res.json();
}

export async function addTodo({ traineeId, day, title }) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ traineeId, day, title }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to add todo');
  }
  return res.json();
}

export async function updateTodo(id, title) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/todos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to update todo');
  }
  return res.json();
}

export async function completeTodo(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/todos/${id}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to complete todo');
  }
  return res.json();
}

export async function deleteTodo(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/api/todos/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to delete todo');
  }
  return res.json().catch(() => ({}));
}