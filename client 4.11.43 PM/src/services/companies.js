const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/** List companies with optional search & pagination. Backend should return { items, total } */
export async function fetchCompanies({ q = "", page = 1, pageSize = 20 } = {}) {
  try {
    const params = new URLSearchParams({ q, page, pageSize });
    const response = await fetch(`${API_BASE}/api/companies?${params.toString()}`, {
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Failed to load companies (${response.status}). ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
}

/** Get one company by id. Should return a single company doc. */
export async function fetchCompany(id) {
  try {
    const response = await fetch(`${API_BASE}/api/companies/${id}`, { 
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Company not found (${response.status}). ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching company:", error);
    throw error;
  }
}

/** Get admin details for a company by id from Employee table */
export async function fetchCompanyAdmin(id) {
  try {
    const response = await fetch(`${API_BASE}/api/companies/${id}/admin`, { 
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Admin not found (${response.status}). ${text}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching company admin:", error);
    throw error;
  }
}
