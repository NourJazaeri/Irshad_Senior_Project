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