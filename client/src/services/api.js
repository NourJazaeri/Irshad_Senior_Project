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