import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import DepartmentDetails from "./DepartmentDetails.jsx";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function AdminHome() {
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [renameModal, setRenameModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const boot = async () => {
      await fetchCompanyId();
      await fetchDepartments();
    };
    boot();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchCompanyId = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/company-profile/me`, {
        headers: authHeaders(),
      });
      if (res.data?.company?._id) setCompanyId(res.data.company._id);
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to load company profile");
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/departments`, {
        headers: authHeaders(),
      });
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to fetch departments");
    }
  };

  const addDepartment = async () => {
    if (!newDeptName.trim() || !companyId) return;
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/departments`,
        { departmentName: newDeptName.trim(), companyId },
        { headers: authHeaders() }
      );
      setShowModal(false);
      setNewDeptName("");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      setErrMsg("Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  const renameDepartment = async () => {
    if (!renameModal || !renameValue.trim()) return;
    try {
      await axios.put(
        `${API_BASE}/api/departments/${renameModal._id}`,
        { departmentName: renameValue.trim() },
        { headers: authHeaders() }
      );
      setRenameModal(null);
      setRenameValue("");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("Rename failed");
    }
  };

  const deleteDepartment = async () => {
    if (!deleteModal) return;
    try {
      await axios.delete(
        `${API_BASE}/api/departments/${deleteModal._id}`,
        { headers: authHeaders() }
      );
      setDeleteModal(null);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
        padding: "40px 60px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#111827" }}>
          Departments
        </h1>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#1d4ed8")}
            onMouseLeave={(e) => (e.target.style.background = "#2563eb")}
          >
            + Create Department
          </button>

          <button
            onClick={() => alert("Add Content clicked! (coming soon...)")}
            style={{
              background: "#475569",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#334155")}
            onMouseLeave={(e) => (e.target.style.background = "#475569")}
          >
            + Add Content
          </button>
        </div>
      </div>

      {errMsg && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.95rem",
          }}
        >
          {errMsg}
        </div>
      )}

      {/* ===== DEPARTMENT LIST ===== */}
      {departments.length === 0 ? (
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>
          No departments yet. Add your first one!
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "25px",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          }}
        >
          {departments.map((dept) => (
            <div
              key={dept._id}
              onClick={() =>
                window.location.assign(`/admin/departments/${dept.departmentName}/details`)
              }
              style={{
                background: "#fff",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                position: "relative",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
                e.target.style.transform = "translateY(0)";
              }}
            >
             
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <h3
                  style={{
                    color: "#111827",
                    fontWeight: "600",
                    fontSize: "1.05rem",
                  }}
                >
                  {dept.departmentName}
                </h3>

                
                <div
                  style={{
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "1.3rem",
                    color: "#9ca3af",
                    userSelect: "none",
                    padding: "5px 10px",
                    borderRadius: "6px",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenu(activeMenu === dept._id ? null : dept._id);
                  }}
                >
                  ⋮
                </div>
              </div>

              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                👥 {dept.numOfGroups || 0} Groups
              </p>
              <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                🧑‍💻 {dept.numOfMembers || 0} Members
              </p>

              {activeMenu === dept._id && (
                <div
                  ref={menuRef}
                  style={{
                    position: "absolute",
                    top: "45px",
                    right: "15px",
                    background: "#fff",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    borderRadius: "8px",
                    zIndex: 10,
                    overflow: "hidden",
                    width: "140px",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    onClick={() => {
                      setRenameModal(dept);
                      setRenameValue(dept.departmentName);
                      setActiveMenu(null);
                    }}
                    style={menuItem}
                  >
                    ✏️ Rename
                  </div>
                  <div
                    onClick={() => {
                      setDeleteModal(dept);
                      setActiveMenu(null);
                    }}
                    style={{ ...menuItem, color: "#dc2626" }}
                  >
                    🗑️ Delete
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {showModal && (
        <Modal
          title="Create Department"
          confirmText="Add"
          value={newDeptName}
          setValue={setNewDeptName}
          onClose={() => setShowModal(false)}
          onConfirm={addDepartment}
          loading={loading}
        />
      )}
      {renameModal && (
        <Modal
          title={`Rename "${renameModal.departmentName}"`}
          confirmText="Save"
          value={renameValue}
          setValue={setRenameValue}
          onClose={() => setRenameModal(null)}
          onConfirm={renameDepartment}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          title={`Delete "${deleteModal.departmentName}"?`}
          message="This action cannot be undone."
          onClose={() => setDeleteModal(null)}
          onConfirm={deleteDepartment}
        />
      )}
    </div>
  );
}

/* ========== COMPONENTS ========== */
const menuItem = {
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "0.95rem",
  color: "#111827",
  borderBottom: "1px solid #f3f4f6",
  background: "#fff",
};

function Modal({ title, confirmText, value, setValue, onClose, onConfirm, loading }) {
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
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            marginBottom: "20px",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={cancelBtn}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !value.trim()}
            style={confirmBtn}
          >
            {loading ? "Saving..." : confirmText}
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
