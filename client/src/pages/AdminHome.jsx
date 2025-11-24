import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Users, Building2, Briefcase, Code, Palette, BarChart, Headphones, Cog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import AddContentModal from "@/components/AddContentModal";
import "../styles/dashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// Function to get icon based on department name
const getDepartmentIcon = (departmentName) => {
  const name = departmentName.toLowerCase();
  if (name.includes('human') || name.includes('hr')) return <Users className="w-8 h-8" />;
  if (name.includes('operation') || name.includes('admin')) return <Building2 className="w-8 h-8" />;
  if (name.includes('sales') || name.includes('marketing')) return <Briefcase className="w-8 h-8" />;
  if (name.includes('engineer') || name.includes('development') || name.includes('tech')) return <Code className="w-8 h-8" />;
  if (name.includes('design') || name.includes('creative')) return <Palette className="w-8 h-8" />;
  if (name.includes('analytics') || name.includes('data') || name.includes('research')) return <BarChart className="w-8 h-8" />;
  if (name.includes('support') || name.includes('customer') || name.includes('service')) return <Headphones className="w-8 h-8" />;
  if (name.includes('it') || name.includes('information')) return <Cog className="w-8 h-8" />;
  return <Building2 className="w-8 h-8" />; // Default icon
};

export default function AdminHome() {
  const navigate = useNavigate();
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
  const [showAddContentModal, setShowAddContentModal] = useState(false);
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
      console.log('Fetching departments...');
      console.log('API_BASE:', API_BASE);
      console.log('Auth headers:', authHeaders());
      
      const res = await axios.get(`${API_BASE}/api/departments`, {
        headers: authHeaders(),
      });
      
      console.log('Departments response:', res.data);
      const departmentsData = res.data.departments || [];
      console.log('Departments with numOfMembers:', departmentsData.map(d => ({
        name: d.departmentName,
        numOfMembers: d.numOfMembers,
        _id: d._id
      })));
      setDepartments(departmentsData);
    } catch (err) {
      console.error('Departments fetch error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
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
    <div style={{ 
      background: 'white', 
      border: '1px solid #E2E8F0', 
      borderRadius: '12px', 
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }}>
      <style>{`
        .modal-cancel-btn:hover {
          background: #d1d5db !important;
        }
        .modal-delete-btn:hover {
          background: #b91c1c !important;
        }
      `}</style>
      {/* Header Section */}
      <div className="container mx-auto max-w-7xl px-2 pt-2 pb-4">
        <div className="flex justify-between items-center mb-2">
          <div></div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
            >
              + Create Department
            </button>
            <button
              onClick={() => setShowAddContentModal(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
            >
              + Add Content
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-2">
            {errMsg}
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="container mx-auto max-w-7xl px-2 mb-6">
        <Card>
          <CardContent className="px-6 pt-5 pb-7 flex items-center">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 w-full">
              <div className="flex flex-col justify-center">
                <h2 className="text-xl font-bold text-foreground">
                  Total Workforce
                </h2>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {departments.reduce((acc, dept) => acc + (dept.numOfMembers || 0), 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Total Employees
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {departments.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Departments
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <main className="container mx-auto max-w-7xl px-2 pb-4">
        {departments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">
              No departments yet. Create your first one!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '20px' }}>
              {departments.map((dept) => (
                <Card
                  key={dept._id}
                  onClick={() =>
                    navigate(`/admin/departments/${dept.departmentName}/details`)
                  }
                  className="cursor-pointer relative"
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(11, 91, 211, 0.35)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    {/* Menu Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === dept._id ? null : dept._id);
                      }}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    <div className="p-4 rounded-full bg-blue-100 transition-colors duration-300 mb-4">
                      <div className="text-blue-600">{getDepartmentIcon(dept.departmentName)}</div>
                    </div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', wordWrap: 'break-word', textAlign: 'center' }}>
                      {dept.departmentName}
                    </h3>
                    <div>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-2xl font-bold text-blue-600">
                          {dept.numOfMembers || 0}
                        </span>
                        <span className="text-sm">members</span>
                      </div>
                    </div>

                  {/* Dropdown Menu */}
                  {activeMenu === dept._id && (
                    <div
                      ref={menuRef}
                      className="absolute top-12 right-3 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-20 w-40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setRenameModal(dept);
                          setRenameValue(dept.departmentName);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-card-foreground hover:bg-accent text-sm"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => {
                          setDeleteModal(dept);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

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
          title="Are you sure you want to delete this department?"
          message={`Deleting "${deleteModal.departmentName}" will permanently remove all associated data including team members, groups, and content. This action cannot be undone.`}
          onClose={() => setDeleteModal(null)}
          onConfirm={deleteDepartment}
        />
      )}
      
      {/* Add Content Modal */}
      <AddContentModal
        isOpen={showAddContentModal}
        onClose={() => setShowAddContentModal(false)}
        onContentAdded={(content) => {
          console.log('Content added:', content);
          setShowAddContentModal(false);
        }}
      />
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
          <button onClick={onClose} style={cancelBtn} className="modal-cancel-btn">
            Cancel
          </button>
          <button onClick={onConfirm} style={deleteBtn} className="modal-delete-btn">
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
  animation: "fadeIn 0.2s ease-out",
};

const modalStyle = {
  background: "#fff",
  padding: "32px",
  borderRadius: "16px",
  width: "600px",
  maxWidth: "90vw",
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
  border: "1px solid #e5e7eb",
  animation: "fadeIn 0.2s ease-out",
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
