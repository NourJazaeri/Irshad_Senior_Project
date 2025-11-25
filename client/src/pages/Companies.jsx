import { useEffect, useState } from "react";
import { fetchCompanies } from "../services/companies";
import CompanyCard from "../components/CompanyCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import "../styles/owner-components.css";

export default function CompaniesPage() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        // Fetch all companies from Company table
        const res = await fetchCompanies({ q, page: 1, pageSize: 10000 });
        if (!ignore) setData(res);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to load");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [q]);

  return (
    <div className="wo-companies-page">
      <div className="wo-search-container">
        <input
          className="wo-search-input"
          placeholder="Search companies…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="wo-list">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading companies...</p>
          </div>
        )}
        {err && <div className="wo-error">{err}</div>}
        {!loading && !err && data.items.map((c, index) => (
          <div key={c._id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
            <CompanyCard company={c} />
          </div>
        ))}
        {!loading && !err && data.items.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p>No companies found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
