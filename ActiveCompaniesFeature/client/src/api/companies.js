const API = import.meta.env.VITE_API_BASE || "";

/** List companies with optional search & pagination. Backend should return { items, total } */
export async function fetchCompanies({ q = "", page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({ q, page, pageSize });
  const res = await fetch(`${API}/api/companies?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load companies (${res.status}). ${text}`);
  }
  return res.json();
}

/** Get one company by id. Should return a single company doc. */
export async function fetchCompany(id) {
  const res = await fetch(`${API}/api/companies/${id}`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Company not found (${res.status}). ${text}`);
  }
  return res.json();
}

/** Get admin details for a company by id from Employee table */
export async function fetchCompanyAdmin(id) {
  const res = await fetch(`${API}/api/companies/${id}/admin`, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Admin not found (${res.status}). ${text}`);
  }
  return res.json();
}