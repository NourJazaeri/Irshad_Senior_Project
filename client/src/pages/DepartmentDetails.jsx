import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [renameModal, setRenameModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef();

  useEffect(() => {
    fetchDepartmentDetails();

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchDepartmentDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/departments/${id}`, {
        headers: authHeaders(),
      });

      const groupRes = await axios.get(
        `http://localhost:5000/api/groups/by-department/${id}`,
        { headers: authHeaders() }
      );

      setDepartment(res.data.department);
      setGroups(groupRes.data.groups || []);
    } catch (err) {
      console.error("Error fetching department details:", err);
    } finally {
      setLoading(false);
    }
  };

  const renameGroup = async () => {
    if (!renameModal || !renameValue.trim()) return;
    try {
      await axios.put(
        `http://localhost:5000/api/groups/${renameModal._id}`,
        { groupName: renameValue.trim() },
        { headers: authHeaders() }
      );
      setRenameModal(null);
      setRenameValue("");
      fetchDepartmentDetails();
    } catch (err) {
      console.error(err);
      alert("Rename failed");
    }
  };

  const deleteGroup = async () => {
    if (!deleteModal) return;
    try {
      await axios.delete(`http://localhost:5000/api/groups/${deleteModal._id}`, {
        headers: authHeaders(),
      });
      setDeleteModal(null);
      fetchDepartmentDetails();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading department details...</p>;

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", padding: "30px" }}>
      {/* ===== Header ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <button
            onClick={() => navigate(-1)}
            style={backBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          >
            ← Back
          </button>
          <h2 style={{ color: "#1e293b", fontWeight: "700", fontSize: "1.4rem" }}>
            {department?.departmentName}
          </h2>
        </div>

        <button
          style={addBtn}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
          onClick={() => alert("Add Group functionality coming soon!")}
        >
          + Add Group
        </button>
      </div>

      {/* ===== Groups ===== */}
      {groups.length === 0 ? (
        <p style={{ color: "#64748b" }}>No groups yet. Add your first one!</p>
      ) : (
        <div style={gridStyle}>
          {groups.map((group) => (
            <div key={group._id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={titleStyle}>{group.groupName}</h3>
                <div style={{ position: "relative" }}>
                  <div
                    style={menuIcon}
                    onClick={() =>
                      setActiveMenu(activeMenu === group._id ? null : group._id)
                    }
                  >
                    ⋮
                  </div>
                  {activeMenu === group._id && (
                    <div ref={menuRef} style={menuStyle}>
                      <div
                        onClick={() => {
                          setRenameModal(group);
                          setRenameValue(group.groupName);
                          setActiveMenu(null);
                        }}
                        style={menuItem}
                      >
                        ✏️ Rename
                      </div>
                      <div
                        onClick={() => {
                          setDeleteModal(group);
                          setActiveMenu(null);
                        }}
                        style={{ ...menuItem, color: "#dc2626" }}
                      >
                        🗑️ Delete
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <p style={descStyle}>👤 Supervisor: {group.supervisorName || "N/A"}</p>
              <p style={descStyle}>👥 Members: {group.numOfMembers}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {renameModal && (
        <Modal
          title={`Rename "${renameModal.groupName}"`}
          confirmText="Save"
          value={renameValue}
          setValue={setRenameValue}
          onClose={() => setRenameModal(null)}
          onConfirm={renameGroup}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title={`Delete "${deleteModal.groupName}"?`}
          message="This action cannot be undone."
          onClose={() => setDeleteModal(null)}
          onConfirm={deleteGroup}
        />
      )}
    </div>
  );
}

/* ========== COMPONENTS ========== */
function Modal({ title, confirmText, value, setValue, onClose, onConfirm }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "20px", fontWeight: "700", color: "#111827" }}>
          {title}
        </h2>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter name"
          style={inputStyle}
        />
        <div style={modalActions}>
          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>
          <button onClick={onConfirm} style={confirmBtn}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onClose, onConfirm }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginBottom: "10px", fontWeight: "700", color: "#111827" }}>
          {title}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>{message}</p>
        <div style={modalActions}>
          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>
          <button onClick={onConfirm} style={deleteBtn}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== STYLES ========== */
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  position: "relative",
  transition: "transform 0.2s ease",
};

const titleStyle = {
  color: "#1e293b",
  fontWeight: "600",
  marginBottom: "8px",
};

const descStyle = {
  color: "#475569",
  fontSize: "0.9rem",
  marginBottom: "4px",
};

const menuIcon = {
  cursor: "pointer",
  fontSize: "1.3rem",
  color: "#9ca3af",
  padding: "5px 10px",
  borderRadius: "6px",
};

const menuStyle = {
  position: "absolute",
  top: "25px",
  right: "0",
  background: "#fff",
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  borderRadius: "8px",
  zIndex: 10,
  width: "140px",
};

const menuItem = {
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "0.95rem",
  color: "#111827",
  borderBottom: "1px solid #f3f4f6",
};

const addBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const backBtn = {
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "6px",
  padding: "8px 16px",
  fontWeight: "500",
  cursor: "pointer",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modalStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "12px",
  width: "400px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  marginBottom: "20px",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
};

const cancelBtn = {
  background: "#e5e7eb",
  color: "#111827",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
};

const confirmBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
};

const deleteBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
};
