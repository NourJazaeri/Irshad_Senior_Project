import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGetDepartments } from "../services/api";

export default function AdminDepartments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rows = await adminGetDepartments();
        setItems(rows);
      } catch (e) {
        console.error(e);
        alert("Failed to load departments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "28px" }}>
      <h1 style={styles.h1}>Departments</h1>

      {loading ? (
        <div style={styles.cardMuted}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={styles.cardMuted}>No departments yet.</div>
      ) : (
        <div style={styles.grid}>
          {items.map((d) => (
            <Link key={d._id} to={`/admin/departments/${d._id}`} style={styles.cardLink}>
              <div style={styles.card}>
                <div style={styles.title}>{d.departmentName}</div>
                <div style={styles.sub}>{d.companyName || "—"}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  h1: { fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 16 },
  grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" },
  card: { background:"#fff", border:"1px solid #e6edf5", borderRadius:14, padding:18, boxShadow:"0 1px 0 rgba(16,24,40,.02)" },
  cardLink: { textDecoration:"none", color:"inherit" },
  title: { fontWeight: 700, color:"#0f172a" },
  sub: { color:"#64748b", marginTop:6 },
  cardMuted: { background:"#fff", border:"1px dashed #e5e7eb", color:"#64748b", borderRadius:14, padding:18 },
};
