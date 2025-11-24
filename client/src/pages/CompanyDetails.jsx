import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiBriefcase, FiUsers, FiMapPin, FiFileText, FiLink, FiUser, FiMail, FiPhone, FiHash } from "react-icons/fi";
import { fetchCompany, fetchCompanyAdmin } from "../services/companies";
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
        <div className="wo-details__header" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <div className="wo-header__left">
          <h1 className="wo-company-title">{doc.name}</h1>
        </div>
        <div className="wo-header__right">
          <span className="wo-badge wo-badge--green">Active Company</span>
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
      </div>
    </div>
  );
}
