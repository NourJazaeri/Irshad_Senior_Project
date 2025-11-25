import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiBriefcase, FiUsers, FiMapPin, FiFileText, FiLink, FiUser, FiMail, FiPhone, FiHash, FiTrash2 } from "react-icons/fi";
import { fetchCompany, fetchCompanyAdmin, deleteCompany } from "../services/companies";
import EmptyState from "../components/EmptyState.jsx";
import "../styles/owner-components.css";

export default function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [adminDoc, setAdminDoc] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErr("");
        const data = await fetchCompany(id);
        console.log('Frontend received company data:', data);
        console.log('LinkedIn value:', data.linkedin || data.linkedIn);
        console.log('Logo value:', data.logoUrl || data.logo || data.logoFilename);
        setDoc(data);
      } catch (e) {
        setErr(e.message || "Failed to load company");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const loadAdminData = async () => {
    try {
      setAdminLoading(true);
      const adminData = await fetchCompanyAdmin(id);
      setAdminDoc(adminData);
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && !adminDoc) {
      loadAdminData();
    }
  }, [activeTab, adminDoc]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      setShowDeleteModal(false);
      await deleteCompany(id);
      // Show success message briefly before redirecting
      alert(`Company "${doc.name}" and all related data have been deleted successfully.`);
      navigate('/owner/companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(`Failed to delete company: ${error.message}`);
      setIsDeleting(false);
    }
  };

  if (loading) return <EmptyState>Loading…</EmptyState>;
  if (err) return <div className="wo-error">{err}</div>;
  if (!doc) return <EmptyState>Company not found.</EmptyState>;

  return (
    <div className="wo-details-container" style={{ maxWidth: '100%', padding: '0 16px' }}>
      {/* Main Container Card */}
      <div className="wo-details-card" style={{ padding: '32px', marginBottom: '24px', width: '100%' }}>
        {/* Breadcrumb Navigation */}
        <div className="wo-breadcrumb" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <span 
            style={{ color: '#6b7280', cursor: 'pointer', transition: 'color 0.2s ease' }} 
            onClick={() => navigate('/owner/companies')}
            onMouseEnter={(e) => e.target.style.color = '#2563eb'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >
            Companies
          </span>
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
          <span style={{ color: '#111827', fontWeight: '700' }}>
            {doc.name}
          </span>
        </div>

      {/* Header Section */}
        <div className="wo-details__header" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="wo-header__left">
          <h1 className="wo-company-title">{doc.name}</h1>
        </div>
        <div className="wo-header__right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="wo-badge wo-badge--green">Active Company</span>
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isDeleting ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isDeleting) {
                e.target.style.backgroundColor = '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDeleting) {
                e.target.style.backgroundColor = '#ef4444';
              }
            }}
          >
            <FiTrash2 style={{ fontSize: '1rem' }} />
            {isDeleting ? 'Deleting...' : 'Delete Company'}
          </button>
        </div>
      </div>

      {/* Company Summary Card */}
      <div className="wo-details-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {doc.logoUrl && (
            <div style={{ 
              flexShrink: 0, 
              width: '120px', 
              height: '120px', 
              background: '#f8f9fa', 
              border: '1px solid #e5e7eb',
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'hidden',
              padding: '12px'
            }}>
              <img 
                src={doc.logoUrl.startsWith('http') ? doc.logoUrl : `${import.meta.env.VITE_API_BASE || 'http://localhost:5000'}${doc.logoUrl}`}
                alt={`${doc.name} logo`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px', 
              flexWrap: 'wrap' 
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0c4a6e',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <FiBriefcase style={{ fontSize: '1.1rem', color: '#2563eb' }} />
                {doc.industry}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0c4a6e',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <FiUsers style={{ fontSize: '1.1rem', color: '#2563eb' }} />
                {doc.size}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0c4a6e',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <FiMapPin style={{ fontSize: '1.1rem', color: '#2563eb' }} />
                {doc.branches ? 
                  (typeof doc.branches === 'string' ? 
                    `${doc.branches.split(',').filter(b => b.trim()).length} branches` : 
                    (Array.isArray(doc.branches) ? `${doc.branches.length} branches` : '1 branch')
                  ) : '0 branches'}
              </span>
            </div>
            {doc.description && (
              <p style={{ 
                fontSize: '1rem', 
                lineHeight: '1.6', 
                margin: 0, 
                color: '#374151' 
              }}>
                {doc.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="wo-tabs">
        <button 
          className={`wo-tab ${activeTab === "company" ? "wo-tab--active" : ""}`}
          onClick={() => setActiveTab("company")}
        >
          <FiBriefcase className="wo-tab-icon" style={{ fontSize: '1.1rem' }} />
          Company Details
        </button>
        <button 
          className={`wo-tab ${activeTab === "admin" ? "wo-tab--active" : ""}`}
          onClick={() => setActiveTab("admin")}
        >
          <FiUser className="wo-tab-icon" style={{ fontSize: '1.1rem' }} />
          Admin Information
        </button>
      </div>

      {/* Company Details Tab */}
      {activeTab === "company" && (
        <div className="wo-details">
          <div className="wo-details-grid">
            {/* Business Information Card */}
            <div className="wo-details-card">
              <h3 className="wo-card-title">
                <FiFileText className="wo-card-icon" style={{ fontSize: '1.3rem', color: '#2563eb' }} />
                Business Information
              </h3>
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <label>Company Registration Number</label>
                  <span className="wo-value">{doc.CRN}</span>
                </div>
                <div className="wo-info-item">
                  <label>Industry</label>
                  <span className="wo-value">{doc.industry}</span>
                </div>
                <div className="wo-info-item">
                  <label>Company Size</label>
                  <span className="wo-value">{doc.size}</span>
                </div>
                <div className="wo-info-item">
                  <label>Tax Number</label>
                  <span className="wo-value">{doc.taxNo || '—'}</span>
                </div>
              </div>
            </div>

            {/* Contact & Links Card */}
            <div className="wo-details-card">
              <h3 className="wo-card-title">
                <FiLink className="wo-card-icon" style={{ fontSize: '1.3rem', color: '#2563eb' }} />
                Contact & Links
              </h3>
              <div className="wo-info-grid">
                <div className="wo-info-item wo-info-item--full">
                  <label>LinkedIn Profile</label>
                  <span className="wo-value">
                    {(doc.linkedIn || doc.linkedin) ? (
                      <a 
                        href={doc.linkedIn || doc.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="wo-link wo-link--external"
                      >
                        <FiLink className="wo-link-icon" style={{ fontSize: '0.9rem' }} />
                        {doc.linkedIn || doc.linkedin}
                      </a>
                    ) : (
                      <span className="wo-value--empty">No LinkedIn profile provided</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Branches Information Card */}
            <div className="wo-details-card wo-details-card--full">
              <h3 className="wo-card-title">
                <FiMapPin className="wo-card-icon" style={{ fontSize: '1.3rem', color: '#2563eb' }} />
                Branch Locations
              </h3>
              <div className="wo-branches">
                {doc.branches ? (
                  <div className="wo-branches-grid">
                    {(typeof doc.branches === 'string' ? 
                      doc.branches.split(',').filter(b => b.trim()) : 
                      (Array.isArray(doc.branches) ? doc.branches : [doc.branches])
                    ).map((branch, index) => (
                      <div key={index} className="wo-branch-item">
                        <span className="wo-branch-name">{branch.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wo-empty-state">
                    <FiBriefcase className="wo-empty-icon" style={{ fontSize: '2.5rem', color: '#9ca3af' }} />
                    <p>No branch information available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Information Tab */}
      {activeTab === "admin" && (
        <div className="wo-details">
          <div className="wo-details-card">
            <h3 className="wo-card-title">
              <FiUser className="wo-card-icon" style={{ fontSize: '1.3rem', color: '#2563eb' }} />
              Administrator Details
            </h3>
            {adminLoading ? (
              <div className="wo-loading-state">
                <div className="wo-loading-spinner" style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '4px solid #e5e7eb', 
                  borderTop: '4px solid #2563eb', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  marginBottom: '12px'
                }}></div>
                <p>Loading admin information…</p>
              </div>
            ) : adminDoc ? (
              <div className="wo-info-grid">
                <div className="wo-info-item">
                  <label>First Name</label>
                  <span className="wo-value">{adminDoc.fname || '—'}</span>
                </div>
                <div className="wo-info-item">
                  <label>Last Name</label>
                  <span className="wo-value">{adminDoc.lname || '—'}</span>
                </div>
                <div className="wo-info-item">
                  <label>Email Address</label>
                  <span className="wo-value">
                    {adminDoc.email ? (
                      <a href={`mailto:${adminDoc.email}`} className="wo-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiMail style={{ fontSize: '0.9rem' }} />
                        {adminDoc.email}
                      </a>
                    ) : '—'}
                  </span>
                </div>
                <div className="wo-info-item">
                  <label>Phone Number</label>
                  <span className="wo-value">
                    {adminDoc.phone ? (
                      <a href={`tel:${adminDoc.phone}`} className="wo-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiPhone style={{ fontSize: '0.9rem' }} />
                        {adminDoc.phone}
                      </a>
                    ) : '—'}
                  </span>
                </div>
                <div className="wo-info-item">
                  <label>Position</label>
                  <span className="wo-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiBriefcase style={{ fontSize: '0.9rem', color: '#6b7280' }} />
                    {adminDoc.position || '—'}
                  </span>
                </div>
                <div className="wo-info-item">
                  <label>Employee ID</label>
                  <span className="wo-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <FiHash style={{ fontSize: '0.9rem', color: '#6b7280' }} />
                    {adminDoc.EmpID || '—'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="wo-empty-state">
                <FiUser className="wo-empty-icon" style={{ fontSize: '2.5rem', color: '#9ca3af' }} />
                <p>Admin information not available</p>
                <p className="wo-empty-subtitle">This company was registered without an admin user linked to it.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <ConfirmModal
          title="Are you sure you want to delete this company?"
          message={`Deleting "${doc.name}" will permanently remove the company and all associated data including departments, groups, employees, admin/supervisor/trainee accounts, and all related content. This action cannot be undone.`}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />,
        document.body
      )}
      </div>
    </div>
  );
}

/* ========== MODAL COMPONENT ========== */
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
          <h2 style={titleStyle}>{title}</h2>
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

/* ========== MODAL STYLES ========== */
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  margin: 0,
  padding: 0,
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

const deleteBtn = {
  background: "#ef4444",
  color: "#fff",
  padding: "10px 24px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  transition: "all 0.2s ease",
};

// Add hover effects via CSS classes
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .modal-cancel-btn:hover {
      background: #e5e7eb !important;
    }
    .modal-delete-btn:hover {
      background: #dc2626 !important;
    }
  `;
  if (!document.head.querySelector('style[data-modal-styles]')) {
    style.setAttribute('data-modal-styles', 'true');
    document.head.appendChild(style);
  }
}
