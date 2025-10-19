// client/src/pages/CompanyProfile.jsx
import React, { useState, useEffect } from "react";
// Import Link from react-router-dom
import { Link } from 'react-router-dom';
import "../styles/admin-components.css";
import "../styles/company-profile.css";
import api from '../services/api'; // centralized API helper

const API_BASE = api.API_BASE;


/* ✅ define before use */
const btnStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'inline-block',
  textDecoration: 'none'
};

function CompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [savingField, setSavingField] = useState(null);
  const [fieldStatus, setFieldStatus] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Fetch admin's company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/company-profile/me`, {
          headers: api.getAuthHeaders()
        });

        if (!response.ok) {
          // Extract message if provided
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Admin company data:', data);

        // FIX: Ensure data.company is defined before setting it
        if (data.ok && data.company) {
          setCompany(data.company);
        } else {
          // If response is OK but 'company' is missing (which shouldn't happen based on logs)
          setError(data.message || 'No company profile found for this admin.');
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError(err.message || 'Failed to load company data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Start editing a field
  const startEditing = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setFieldValue(currentValue || '');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingField(null);
    setFieldValue('');
    setFieldStatus({});
  };

  // Save field changes
  const saveField = async (fieldName) => {
    try {
      // Prevent saving an empty value for required fields (simple client-side check)
      if (!fieldValue && (fieldName === 'name' || fieldName === 'CRN' || fieldName === 'industry')) {
        setFieldStatus(prev => ({ ...prev, [fieldName]: 'error' }));
        setTimeout(() => setFieldStatus(prev => ({ ...prev, [fieldName]: null })), 3000);
        return;
      }
      
      setSavingField(fieldName);
      setFieldStatus(prev => ({ ...prev, [fieldName]: 'saving' }));

      const updateData = { [fieldName]: fieldValue };

      const response = await fetch(`${API_BASE}/api/company-profile/me`, {
        method: 'PUT',
        // api.getAuthHeaders() must return { 'Authorization': 'Bearer ...', 'Content-Type': 'application/json' }
        headers: api.getAuthHeaders(), 
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.ok && data.company) {
        setCompany(data.company);
        setEditingField(null);
        setFieldValue('');
        setFieldStatus(prev => ({ ...prev, [fieldName]: 'saved' }));

        // Clear status after 2 seconds
        setTimeout(() => {
          setFieldStatus(prev => ({ ...prev, [fieldName]: null }));
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to update field');
      }
    } catch (err) {
      console.error('Error updating field:', err);
      setFieldStatus(prev => ({ ...prev, [fieldName]: 'error' }));

      // Clear error status after 3 seconds
      setTimeout(() => {
        setFieldStatus(prev => ({ ...prev, [fieldName]: null }));
      }, 3000);
    } finally {
      setSavingField(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setFieldValue(e.target.value);
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setFieldStatus(prev => ({ ...prev, logoUrl: 'saving' }));

      const formData = new FormData();
      formData.append('companyLogo', file);

      // FIX: Ensure only the Authorization header is sent for FormData.
      // Assuming api.getAuthHeaders(false) or similar returns ONLY { 'Authorization': 'Bearer ...' }
      // If api.getAuthHeaders() returns Content-Type, you MUST remove it here.
      const headers = api.getAuthHeaders();
      delete headers['Content-Type']; // Crucial for letting browser set multipart/form-data

      const response = await fetch(`${API_BASE}/api/company-profile/upload`, {
        method: 'POST',
        headers, // includes Authorization and Accept but no Content-Type
        body: formData
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Upload failed: ${response.status}`);
      }

      const uploadResult = await response.json();

      if (uploadResult.success && uploadResult.logoUrl) {
        // Update the company with the new logo URL
        const updateResponse = await fetch(`${API_BASE}/api/company-profile/me`, {
          method: 'PUT',
          // Use default headers (including Content-Type: application/json) for the PUT update
          headers: api.getAuthHeaders(), 
          body: JSON.stringify({ logoUrl: uploadResult.logoUrl })
        });

        if (!updateResponse.ok) {
          const errBody = await updateResponse.json().catch(() => ({}));
          throw new Error(errBody?.message || `Update after upload failed: ${updateResponse.status}`);
        }

        const updateData = await updateResponse.json();
        if (updateData.ok && updateData.company) {
          setCompany(updateData.company);
          setFieldStatus(prev => ({ ...prev, logoUrl: 'saved' }));

          // Clear status after 2 seconds
          setTimeout(() => {
            setFieldStatus(prev => ({ ...prev, logoUrl: null }));
          }, 2000);
        }
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo: ' + (err.message || err));
      setFieldStatus(prev => ({ ...prev, logoUrl: 'error' }));

      // Clear error status after 3 seconds
      setTimeout(() => {
        setFieldStatus(prev => ({ ...prev, logoUrl: null }));
      }, 3000);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Handle Enter key to save
  const handleKeyPress = (e, fieldName) => {
    if (e.key === 'Enter' && fieldName !== 'description' && fieldName !== 'branches') {
      // Prevent default form submission behavior and save field for input/select
      e.preventDefault(); 
      saveField(fieldName);
    } else if (e.key === 'Enter' && (fieldName === 'description' || fieldName === 'branches') && e.ctrlKey) {
       // Allow Ctrl+Enter to save for textarea fields
       e.preventDefault(); 
       saveField(fieldName);
    }
    else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Render field value
  const renderFieldValue = (fieldName, value) => {
    if (editingField === fieldName) {
      const isTextarea = fieldName === 'description' || fieldName === 'branches';

      return (
        <div className="form-group-editing"> {/* Added a specific class for editing state */}
          {isTextarea ? (
            <textarea
              value={fieldValue}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyPress(e, fieldName)}
              className="form-textarea"
              rows="4"
              autoFocus
              placeholder={`Enter company ${fieldName}...`}
            />
          ) : fieldName === 'industry' ? (
            <select
              value={fieldValue}
              onChange={handleInputChange}
              className="form-select"
              autoFocus
            >
              <option value="">Select industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Education">Education</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Construction">Construction</option>
              <option value="Consulting">Consulting</option>
              <option value="Other">Other</option>
            </select>
          ) : fieldName === 'size' ? (
            <select
              value={fieldValue}
              onChange={handleInputChange}
              className="form-select"
              autoFocus
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="501-1000">501-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          ) : (
            <input
              // Use 'text' for all remaining, including linkedin, since we just want the URL string
              type={'text'} 
              value={fieldValue}
              onChange={handleInputChange}
              onKeyDown={(e) => handleKeyPress(e, fieldName)}
              className="form-input"
              autoFocus
              placeholder={`Enter company ${fieldName}...`}
            />
          )}

          <div className="inline-actions show">
            <button
              onClick={() => saveField(fieldName)}
              disabled={savingField === fieldName}
              className="inline-btn inline-btn-save"
            >
              {savingField === fieldName ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={cancelEditing}
              disabled={savingField === fieldName}
              className="inline-btn inline-btn-cancel"
            >
              Cancel
            </button>
          </div>
          {isTextarea && (
             <p className="edit-hint">Press Enter for new line, Ctrl+Enter to Save</p>
          )}
        </div>
      );
    }

    const isRequiredAndEmpty = (fieldName) => {
        const requiredFields = ['name', 'CRN', 'industry'];
        return requiredFields.includes(fieldName) && !value;
    };

    return (
      <div
        className={`form-display ${editingField === fieldName ? 'editing' : ''} ${isRequiredAndEmpty(fieldName) ? 'missing-required' : ''}`}
        onClick={() => startEditing(fieldName, value)}
      >
        <span className="display-value">
            {value || 'Click to edit'}
        </span>
        <span className="edit-icon">✏️</span>
        <div className={`field-status ${fieldStatus[fieldName] || ''}`}></div>
        {fieldStatus[fieldName] === 'saved' && (
          <div className="field-message success">Field saved successfully!</div>
        )}
        {fieldStatus[fieldName] === 'error' && (
          <div className="field-message error">
            {isRequiredAndEmpty(fieldName) ? 'Required field cannot be empty' : 'Failed to save field'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="company-profile-loading">
          <div className="loading-spinner"></div>
          <h2>Loading your company profile...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="company-profile-error">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Company Profile</h2>
          <p className="error-message">{error}</p>
          <p className="error-help">
            Make sure your admin account is linked to a company.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">

    {/* Example placement near your page header */}
    <div style={{ marginBottom: 16 }}>
      <Link to="/admin/departments" style={btnStyle}>
        Browse Departments
      </Link>
    </div>

    <div className="admin-company-profile">
      <div className="admin-company-profile-header">
        <div className="header-content">
          <h1 className="admin-company-profile-title">
            <span className="admin-company-profile-icon">🏢</span>
            Company Profile
          </h1>
          <p className="admin-company-profile-subtitle">
            Click on any field to edit your company information
          </p>
        </div>
      </div>

        <div className="company-profile-content">
          <div className="profile-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Basic Information
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Company Name <span className="required">*</span>
                </label>
                {renderFieldValue('name', company?.name)}
              </div>

              <div className="form-group">
                <label className="form-label">
                  CRN (Commercial Registration Number) <span className="required">*</span>
                </label>
                {renderFieldValue('CRN', company?.CRN)}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tax Number
                </label>
                {renderFieldValue('taxNo', company?.taxNo)}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="section-title">
              <span className="section-icon">🏭</span>
              Business Details
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  Industry <span className="required">*</span>
                </label>
                {renderFieldValue('industry', company?.industry)}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Company Size (Employees)
                </label>
                {renderFieldValue('size', company?.size)}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Company Description
                </label>
                {renderFieldValue('description', company?.description)}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Branches
                </label>
                {renderFieldValue('branches', company?.branches)}
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3 className="section-title">
              <span className="section-icon">🌐</span>
              Online Presence
            </h3>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  LinkedIn Profile
                </label>
                {/* Cleaned up LinkedIn rendering block */}
                {renderFieldValue('linkedin', company?.linkedin)}
                {company?.linkedin && (
                  <a 
                    href={company.linkedin.startsWith('http') ? company.linkedin : `https://${company.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="profile-link"
                    style={{ marginTop: '5px', display: 'block' }}
                  >
                    View LinkedIn Profile →
                  </a>
                )}
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Company Logo
                </label>
                <div className="logo-upload-section">
                  {company?.logoUrl && (
                    <div className="current-logo">
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="logo-preview-img"
                        onError={(e) => {
                          // Fallback on error (e.g., if logoUrl is broken)
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="upload-controls">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingLogo}
                    />
                    <label htmlFor="logo-upload" className="upload-btn">
                      {uploadingLogo ? (
                        <>
                          <span className="btn-spinner"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <span className="btn-icon">📁</span>
                          {company?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </>
                      )}
                    </label>

                    {fieldStatus.logoUrl === 'saved' && (
                      <span className="upload-success">✅ Logo updated successfully!</span>
                    )}
                    {fieldStatus.logoUrl === 'error' && (
                      <span className="upload-error">❌ Failed to upload logo</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;