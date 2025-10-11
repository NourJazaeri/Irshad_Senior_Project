const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

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

// User Management API Functions
export async function fetchEmployees() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log("Fetching employees...");
    
    const response = await fetch(`${API_BASE}/api/admin/users/employees`, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
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