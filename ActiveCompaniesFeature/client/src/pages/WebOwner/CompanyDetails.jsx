import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchCompany, fetchCompanyAdmin } from "../../api/companies";
import EmptyState from "../../components/common/EmptyState.jsx";
import "../../styles/owner.css";

export default function CompanyDetails() {
  const { id } = useParams();
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
    <div className="wo-details-container">
      {/* Header Section */}
      <div className="wo-details__header">
        <div className="wo-header__left">
          <Link to="/owner/companies" className="wo-back-link">
            <span className="wo-back-icon">←</span>
            Back to Companies
          </Link>
          <h1 className="wo-company-title">{doc.name}</h1>
        </div>
        <div className="wo-header__right">
          <span className="wo-badge wo-badge--green">Active Company</span>
        </div>
      </div>

      {/* Company Hero Section */}
      <div className="wo-company-hero">
        <div className="wo-hero__content">
          {doc.logoUrl && (
            <div className="wo-hero__logo">
              <img 
                src={doc.logoUrl} 
                alt={`${doc.name} logo`}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="wo-hero__info">
            <div className="wo-hero__meta">
              <span className="wo-meta-item">
                <span className="wo-meta-icon">🏢</span>
                {doc.industry}
              </span>
              <span className="wo-meta-item">
                <span className="wo-meta-icon">👥</span>
                {doc.size}
              </span>
              <span className="wo-meta-item">
                <span className="wo-meta-icon">🏬</span>
                {doc.branches ? 
                  (typeof doc.branches === 'string' ? 
                    `${doc.branches.split(',').filter(b => b.trim()).length} branches` : 
                    (Array.isArray(doc.branches) ? `${doc.branches.length} branches` : '1 branch')
                  ) : '0 branches'}
              </span>
            </div>
            {doc.description && (
              <p className="wo-hero__description">{doc.description}</p>
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
          <span className="wo-tab-icon">🏢</span>
          Company Details
        </button>
        <button 
          className={`wo-tab ${activeTab === "admin" ? "wo-tab--active" : ""}`}
          onClick={() => setActiveTab("admin")}
        >
          <span className="wo-tab-icon">👤</span>
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
                <span className="wo-card-icon">📋</span>
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
                <span className="wo-card-icon">🔗</span>
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
                        <span className="wo-link-icon">🔗</span>
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
                <span className="wo-card-icon">🏢</span>
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
                        <span className="wo-branch-icon">📍</span>
                        <span className="wo-branch-name">{branch.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wo-empty-state">
                    <span className="wo-empty-icon">🏢</span>
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
              <span className="wo-card-icon">👤</span>
              Administrator Details
            </h3>
            {adminLoading ? (
              <div className="wo-loading-state">
                <span className="wo-loading-icon">⏳</span>
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
                      <a href={`mailto:${adminDoc.email}`} className="wo-link">
                        {adminDoc.email}
                      </a>
                    ) : '—'}
                  </span>
                </div>
                <div className="wo-info-item">
                  <label>Phone Number</label>
                  <span className="wo-value">
                    {adminDoc.phone ? (
                      <a href={`tel:${adminDoc.phone}`} className="wo-link">
                        {adminDoc.phone}
                      </a>
                    ) : '—'}
                  </span>
                </div>
                <div className="wo-info-item">
                  <label>Position</label>
                  <span className="wo-value">{adminDoc.position || '—'}</span>
                </div>
                <div className="wo-info-item">
                  <label>Employee ID</label>
                  <span className="wo-value">{adminDoc.EmpID || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="wo-empty-state">
                <span className="wo-empty-icon">👤</span>
                <p>Admin information not available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
