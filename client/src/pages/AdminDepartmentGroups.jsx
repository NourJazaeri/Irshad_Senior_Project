import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { adminGetDepartment, adminGetGroupsByDepartment } from "../services/api";

export default function AdminDepartmentGroups() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dept, setDept] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, rows] = await Promise.all([
          adminGetDepartment(id),
          adminGetGroupsByDepartment(id),
        ]);
        setDept(d);
        setGroups(rows);
      } catch (e) {
        console.error(e);
        alert("Failed to load department groups");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div style={{ background:"#f8fafc", minHeight:"100vh", padding:"28px" }}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>
      <h1 style={styles.h1}>{dept?.departmentName || "Department"}</h1>
      <div style={{ color:"#64748b", marginBottom:16 }}>{dept?.companyName || "—"}</div>

      {loading ? (
        <div style={styles.muted}>Loading…</div>
      ) : groups.length === 0 ? (
        <div style={styles.muted}>No groups in this department.</div>
      ) : (
        <div style={styles.grid}>
          {groups.map((g) => (
            <Link key={g._id} to={`/admin/groups/${g._id}`} style={styles.link}>
              <div style={styles.card}>
                <div style={styles.title}>{g.groupName}</div>
                <div style={styles.sub}>
                  {g.supervisorName ? `Supervisor: ${g.supervisorName} • ` : ""}
                  {g.numOfMembers} {g.numOfMembers === 1 ? "member" : "members"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  back: { background:"#eef2f7", border:"1px solid #e2e8f0", color:"#334155", padding:"8px 12px", borderRadius:8, cursor:"pointer", marginBottom:10 },
  h1: { fontSize:28, fontWeight:800, color:"#0f172a", marginBottom:6 },
  grid: { display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))" },
  card: { background:"#fff", border:"1px solid #e6edf5", borderRadius:14, padding:18, boxShadow:"0 1px 0 rgba(16,24,40,.02)" },
  title: { fontWeight:700, color:"#0f172a" },
  sub: { color:"#64748b", marginTop:6 },
  link: { textDecoration:"none", color:"inherit" },
  muted: { background:"#fff", border:"1px dashed #e5e7eb", color:"#64748b", borderRadius:14, padding:18 },
};
