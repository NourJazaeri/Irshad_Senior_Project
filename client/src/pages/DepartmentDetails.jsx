import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUsers } from "react-icons/fi";
import CreateGroupButton from "../components/CreateGroupButton";
import "../styles/department-details.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function DepartmentDetails() {
  const { departmentName } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef();
  const [renameModal, setRenameModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // Fetch department details and groups
  useEffect(() => {
    const fetchDepartmentData = async () => {
    try {
        setLoading(true);
        
        // First, get all departments to find the one with matching name
        const departmentsResponse = await axios.get(`${API_BASE}/api/departments`, {
        headers: authHeaders(),
      });

        if (departmentsResponse.data.ok) {
          const departments = departmentsResponse.data.departments;
          const foundDepartment = departments.find(dept => 
            dept.departmentName.toLowerCase() === departmentName.toLowerCase()
          );

          if (foundDepartment) {
            setDepartment(foundDepartment);

            // Now fetch groups for this department
            const groupsResponse = await axios.get(
              `${API_BASE}/api/groups/by-department/${foundDepartment._id}`,
        { headers: authHeaders() }
      );

            if (groupsResponse.data.ok) {
              setGroups(groupsResponse.data.groups);
            }
          } else {
            setError("Department not found");
          }
        }
    } catch (err) {
        console.error("Error fetching department data:", err);
        setError("Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

    fetchDepartmentData();
  }, [departmentName]);

  const handleGroupUpdate = () => {
    // Refresh groups after any update
    if (department) {
      axios.get(
        `${API_BASE}/api/groups/by-department/${department._id}`,
        { headers: authHeaders() }
      ).then(response => {
        if (response.data.ok) {
          setGroups(response.data.groups);
        }
      }).catch(err => console.error("Error refreshing groups:", err));
    }
  };

  // Handle rename group
  const renameGroup = async () => {
    if (!renameModal || !renameValue.trim()) return;

    try {
      const response = await axios.put(
        `${API_BASE}/api/groups/${renameModal._id}`,
        { groupName: renameValue.trim() },
        { headers: authHeaders() }
      );

      if (response.data.ok) {
        handleGroupUpdate(); // Refresh the groups list
        setRenameModal(null);
        setRenameValue("");
      }
    } catch (err) {
      console.error("Error editing group:", err);
      alert("Failed to rename group");
    }
  };

  // Handle delete group (from modal)
  const deleteGroupFromModal = async () => {
    if (!deleteModal) return;

    try {
      const response = await axios.delete(
        `${API_BASE}/api/groups/${deleteModal._id}`,
        { headers: authHeaders() }
      );
      
      if (response.data.ok) {
        handleGroupUpdate();
        setDeleteModal(null);
      }
    } catch (err) {
      console.error("Error deleting group:", err);
        alert("Failed to delete group");
    }
  };

  // Handle group click to navigate to group details
  const handleGroupClick = (groupId) => {
    navigate(`/admin/groups/${groupId}`);
  };


  if (loading) {
    return (
      <div style={{ background: '#f9fafc', border: '1px solid #e2e6ef', borderRadius: '10px', padding: '40px', margin: '10px 8px' }}>
        <div className="loading">Loading department details...</div>
    </div>
  );
}

  if (error) {
  return (
      <div style={{ background: '#f9fafc', border: '1px solid #e2e6ef', borderRadius: '10px', padding: '40px', margin: '10px 8px' }}>
        <div className="error">❌ {error}</div>
    </div>
  );
}

  return (
    <div style={{ background: '#f9fafc', border: '1px solid #e2e6ef', borderRadius: '10px', padding: '40px', margin: '10px 8px' }}>
      <div className="department-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          {/* Breadcrumb Navigation instead of title */}
          <div className="breadcrumb" style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#6b7280', cursor: 'pointer' }} onClick={() => navigate('/admin')}>Departments</span>
            <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span style={{ color: '#111827', fontWeight: '700' }}>{department?.departmentName}</span>
          </div>
        <CreateGroupButton 
          departmentName={departmentName} 
          adminId={localStorage.getItem("userId")}
          onGroupCreated={handleGroupUpdate}
        />
      </div>

      <div className="groups-section">
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '20px', letterSpacing: '0.025em' }}>Groups ({groups.length})</h2>
        
        {groups.length > 0 ? (
          <div className="groups-grid">
            {groups.map((group) => (
              <div 
                key={group._id} 
                className="group-card clickable"
                onClick={() => handleGroupClick(group._id)}
                title="Click to view group details"
                style={{ position: 'relative' }}
              >
                {/* Menu Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveMenu(activeMenu === group._id ? null : group._id);
                  }}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>

                <div className="p-4 rounded-full bg-blue-100 transition-colors duration-300 mb-4">
                  <div className="text-blue-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-lg text-card-foreground mb-2" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', wordWrap: 'break-word', textAlign: 'center' }}>
                  {group.groupName}
                </h3>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="text-2xl font-bold text-blue-600">
                    {group.numOfMembers || 0}
                  </span>
                  <span className="text-sm">{group.numOfMembers === 1 ? 'Member' : 'Members'}</span>
                </div>

                {/* Dropdown Menu */}
                {activeMenu === group._id && (
                  <div
                    ref={menuRef}
                    className="absolute top-12 right-3 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-20 w-40"
                    style={{
                      position: 'absolute',
                      top: '48px',
                      right: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      zIndex: 20,
                      width: '160px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setRenameModal(group);
                        setRenameValue(group.groupName);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-card-foreground hover:bg-accent text-sm"
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        color: '#111827',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Rename
                      </button>
                      <button 
                      onClick={() => {
                        setDeleteModal(group);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        textAlign: 'left',
                        color: '#dc2626',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Delete
          </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-groups">
            <div className="no-groups-icon">
              <FiUsers />
            </div>
            <h3>No groups yet</h3>
            <p>Create your first group to start organizing this department</p>
          </div>
        )}
      </div>
      
      {/* Rename Modal */}
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
      
      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmModal
          title="Are you sure you want to delete this group?"
          message={`Deleting "${deleteModal.groupName}" will permanently remove all associated trainees. They will be unassigned and available for other groups. This action cannot be undone.`}
          onClose={() => setDeleteModal(null)}
          onConfirm={deleteGroupFromModal}
        />
      )}
    </div>
  );
}

/* ========== MODAL COMPONENTS ========== */
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
          placeholder="Enter group name"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            marginBottom: "20px",
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onConfirm();
            } else if (e.key === 'Escape') {
              onClose();
            }
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
        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <div style={iconContainerStyle}>
            <svg style={{ width: "24px", height: "24px", color: "#dc2626" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={titleStyle}>
            {title}
          </h2>
        </div>
        <p style={messageStyle}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
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
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modalStyle = {
  background: "#fff",
  padding: "32px",
  borderRadius: "16px",
  width: "600px",
  maxWidth: "90vw",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
  border: "1px solid #e5e7eb",
};

const iconContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#fee2e2",
  marginRight: "12px",
  flexShrink: 0,
};

const titleStyle = {
  margin: 0,
  fontWeight: "700",
  color: "#111827",
  fontSize: "18px",
  lineHeight: "1.5",
  whiteSpace: "nowrap",
};

const messageStyle = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
};

const cancelBtn = {
  background: "#f3f4f6",
  color: "#111827",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

const confirmBtn = {
  background: "#2563eb",
  color: "#fff",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

const deleteBtn = {
  background: "#dc2626",
  color: "#fff",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

export default DepartmentDetails;
