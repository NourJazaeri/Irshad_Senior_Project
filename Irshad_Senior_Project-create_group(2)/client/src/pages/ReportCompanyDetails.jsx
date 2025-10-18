import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/owner-components.css';

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Fetch company data from Atlas database
    const fetchCompanyDetails = async () => {
      try {
        console.log('Fetching company details for ID:', companyId);
        const response = await fetch(`/api/companies/${companyId}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const companyData = await response.json();
        console.log('Company details API Result:', companyData);
        
        if (companyData && !companyData.error) {
          const processedData = {
            _id: companyData._id,
            name: companyData.name,
            CRN: companyData.CRN,
            industry: companyData.industry,
            size: companyData.size,
            taxNo: companyData.taxNo,
            branches: companyData.branches,
            linkedin: companyData.linkedIn || companyData.linkedin,
            description: companyData.description,
            logoUrl: companyData.logoUrl || companyData.logo || companyData.logoFilename,
            createdAt: companyData.createdAt,
            updatedAt: companyData.updatedAt,
            registrationRequest: {
              status: 'approved', // Default status since this is from main companies table
              submittedAt: companyData.createdAt ? 
                new Date(companyData.createdAt).toLocaleDateString() : null
            },
            admin: companyData.admin
          };
          
          console.log('Processed company data:', processedData);
          setCompany(processedData);
        } else {
          console.error('Failed to fetch company from database:', companyData.error || 'Unknown error');
          setCompany(null);
        }
      } catch (error) {
        console.error('Error connecting to database:', error);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  const handleBack = () => {
    navigate('/');
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="company-details">
        <div className="loading">Loading company details...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="company-details">
        <div className="not-found">
          <h2>Company not found</h2>
          <button onClick={handleBack} className="back-btn">
            Back to Company List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="main">
        <Topbar />
        
        <div className="company-details">
          <div className="page-header">
            <button onClick={handleBack} className="back-btn">
              ← Back
            </button>
            <h1>Company Details</h1>
          </div>

      <div className="company-details-content">
        <div className="company-summary-cards">
          <div className="summary-card">
            <div className="card-icon company-icon">🏢</div>
            <div className="card-content">
              <div className="card-number">{company.CRN}</div>
              <div className="card-label">{company.industry}</div>
              <div className="card-meta">Size: {company.size}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon status-icon">⏳</div>
            <div className="card-content">
              <div className="card-number">{formatStatus(company.registrationRequest.status)}</div>
              <div className="card-label">Registration Status</div>
            </div>
          </div>
        </div>

        <div className="details-sections">
          <div className="details-section">
            <h2>
              <span className="section-icon">🏢</span>
              Company Information
            </h2>
            <div className="details-grid">
              <div className="detail-item">
                <label>Name:</label>
                <span>{company.name}</span>
              </div>
              <div className="detail-item">
                <label>CRN:</label>
                <span>{company.CRN}</span>
              </div>
              <div className="detail-item">
                <label>Industry:</label>
                <span>{company.industry}</span>
              </div>
              <div className="detail-item">
                <label>Size:</label>
                <span>{company.size}</span>
              </div>
              <div className="detail-item">
                <label>Tax No:</label>
                <span>{company.taxNo}</span>
              </div>
              <div className="detail-item">
                <label>Branches:</label>
                <span>{company.branches}</span>
              </div>
              <div className="detail-item">
                <label>LinkedIn:</label>
                <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-link">
                  {company.linkedin}
                </a>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h2>
              <span className="section-icon">📋</span>
              Registration Status
            </h2>
            <div className="details-grid">
              <div className="detail-item">
                <label>Status:</label>
                <div className={`status-badge status-${company.registrationRequest.status}`}>
                  <div className="status-icon">⏳</div>
                  {formatStatus(company.registrationRequest.status)}
                </div>
              </div>
              <div className="detail-item">
                <label>Submitted At:</label>
                <div className="date-field">
                  <span className="date-icon">📅</span>
                  {company.registrationRequest.submittedAt || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h2>
              <span className="section-icon">📝</span>
              Description
            </h2>
            <div className="description-content">
              <p>{company.description}</p>
            </div>
          </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}