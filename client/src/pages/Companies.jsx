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
        {loading && <EmptyState>Loading…</EmptyState>}
        {err && <div className="wo-error">{err}</div>}
        {!loading && !err && data.items.map((c) => (
          <CompanyCard key={c._id} company={c} />
        ))}
        {!loading && !err && data.items.length === 0 && (
          <EmptyState>No companies found.</EmptyState>
        )}
      </div>
    </div>
  );
}
