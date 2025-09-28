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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Response data:", data);
    
    return data;
  } catch (error) {
    console.error("Error logging in:", error);
    return { 
      success: false, 
      message: error.message || "Cannot connect to server. Check if backend is running." 
    };
  }
}