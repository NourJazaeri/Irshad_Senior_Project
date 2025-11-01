const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/**
 * Upload file content to the server
 */
export async function uploadContent(formData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading content:', error);
    throw error;
  }
}

/**
 * Create link content
 */
export async function createLinkContent(contentData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/link`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contentData)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating link content:', error);
    throw error;
  }
}

/**
 * Create template content
 */
export async function createTemplateContent(contentData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/template`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contentData)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating template content:', error);
    throw error;
  }
}

/**
 * Save content from template
 */
export async function saveContentFromTemplate(contentData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/save-content`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(contentData)
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving content from template:', error);
    throw error;
  }
}

/**
 * Get available templates
 */
export async function getTemplates() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/templates`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.templates || data; // Handle both formats
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get all content items
 */
export async function getAllContent() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}

/**
 * Get content with filtering
 */
export async function getContent(filters = {}) {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}/api/content/content?${queryParams}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}

/**
 * Get departments for assignment
 */
export async function getDepartments() {
  try {
    const token = localStorage.getItem('token');
    console.log('🌐 Making API call to:', `${API_BASE}/api/content/departments`);
    console.log('🔑 Using token:', token ? 'Token present' : 'No token found');
    
    const response = await fetch(`${API_BASE}/api/content/departments`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching departments:', error);
    throw error;
  }
}

/**
 * Test department assignment endpoint
 */
export async function testDepartmentAssignment(departmentId) {
  try {
    const response = await fetch(`${API_BASE}/api/content/test-department/${departmentId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Department test data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in department test:', error);
    throw error;
  }
}

/**
 * Debug endpoint to check trainee assignment relationships
 */
export async function debugTraineeAssignment() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/trainee/debug`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Debug assignment data:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in debug assignment:', error);
    throw error;
  }
}

/**
 * Fetch content assigned to the authenticated trainee
 */
export async function fetchTraineeAssignedContent() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/trainee/assigned`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Trainee assigned content:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching trainee assigned content:', error);
    throw error;
  }
}

/**
 * Update progress for a specific content item
 */
export async function updateContentProgress(contentId, progressData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/api/content/trainee/progress/${contentId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progressData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Progress updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error updating content progress:', error);
    throw error;
  }
}
