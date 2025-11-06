import React, { useState, useEffect } from "react";
import { FileText, Building2, Building, Globe, ExternalLink, Check, X, Save, Edit3 } from "lucide-react";
import "../styles/admin-components.css";
import "../styles/company-profile.css";

function CompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState("");
  const [savingField, setSavingField] = useState(null);
  const [fieldStatus, setFieldStatus] = useState({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch admin's company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/api/company-profile/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Admin company data:', data);
        
        if (data.ok && data.company) {
          setCompany(data.company);
        } else {
          setError(data.message || 'No company found');
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

  // Deselect editing when clicking anywhere outside the active field
  useEffect(() => {
    const handleGlobalMouseDown = (e) => {
      if (!editingField) return;
      // If click is inside any editing form group, ignore
      const isInsideEditingGroup = e.target.closest('.form-group');
      if (isInsideEditingGroup) return;
      // Otherwise, cancel editing
      cancelEditing();
    };

    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, [editingField]);

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

  // Handle field value change
  const handleFieldChange = (fieldName, value) => {
    setFieldValue(value);
    setEditedFields(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Save all changes
  const saveAllChanges = async () => {
    try {
      setSavingField('all');
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      // Backend route is PUT /api/company-profile/me and returns { ok, company }
      const response = await fetch(`${API_BASE}/api/company-profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedFields)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.ok && data.company) {
        setCompany(data.company);
        setEditedFields({});
        setHasUnsavedChanges(false);
        setEditingField(null);
        setFieldValue('');
        setFieldStatus({});
        alert('All changes saved successfully!');
      } else {
        throw new Error(data.message || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSavingField(null);
    }
  };

  // Cancel all changes
  const cancelAllChanges = () => {
    setEditedFields({});
    setHasUnsavedChanges(false);
    setEditingField(null);
    setFieldValue('');
    setFieldStatus({});
  };

  // Save field changes
  const saveField = async (fieldName) => {
    try {
      setSavingField(fieldName);
      setFieldStatus(prev => ({ ...prev, [fieldName]: 'saving' }));

      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const updateData = { [fieldName]: fieldValue };
      
      const response = await fetch(`${API_BASE}/api/company-profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setFieldStatus(prev => ({ ...prev, logoUrl: 'saving' }));

      const formData = new FormData();
      formData.append('companyLogo', file);

      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/company-profile/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const uploadResult = await response.json();
      
      if (uploadResult.success && uploadResult.logoUrl) {
        // Update the company with the new logo URL
        const updateResponse = await fetch(`${API_BASE}/api/company-profile/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ logoUrl: uploadResult.logoUrl })
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          if (updateData.ok && updateData.company) {
            setCompany(updateData.company);
            setFieldStatus(prev => ({ ...prev, logoUrl: 'saved' }));
            
            // Clear status after 2 seconds
            setTimeout(() => {
              setFieldStatus(prev => ({ ...prev, logoUrl: null }));
            }, 2000);
          }
        }
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo: ' + err.message);
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
    if (e.key === 'Enter') {
      saveField(fieldName);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Render field value
  const renderFieldValue = (fieldName, value) => {
    const pendingValue = editedFields[fieldName];
    const displayValue = typeof pendingValue !== 'undefined' && pendingValue !== null && String(pendingValue).length > 0
      ? pendingValue
      : value;
    if (editingField === fieldName) {
      const isTextarea = fieldName === 'description' || fieldName === 'branches';
      
      return (
        <div className="form-group">
          {isTextarea ? (
            <textarea
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, fieldName)}
              className="form-textarea editing"
              rows="4"
              autoFocus
            />
          ) : fieldName === 'industry' ? (
            <select
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="form-select editing"
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
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="form-select editing"
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
              type={fieldName === 'linkedin' || fieldName === 'logoUrl' ? 'url' : 'text'}
              value={fieldValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, fieldName)}
              className="form-input editing"
              autoFocus
            />
          )}
        </div>
      );
    }

    // Special display for LinkedIn: show clickable URL in the box (including unsaved edits)
    if (fieldName === 'linkedin' && displayValue) {
      const href = /^https?:\/\//i.test(displayValue) ? displayValue : `https://${displayValue}`;
      return (
        <div 
          className={`form-display hoverable ${editedFields[fieldName] ? 'has-changes' : ''}`}
          onClick={() => startEditing(fieldName, displayValue)}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="linkedin-url"
            onClick={(e) => e.stopPropagation()}
          >
            {displayValue}
          </a>
          <ExternalLink className="w-5 h-5 text-primary" />
        </div>
      );
    }

    return (
      <div 
        className={`form-display hoverable ${editingField === fieldName ? 'editing' : ''} ${editedFields[fieldName] ? 'has-changes' : ''}`}
        onClick={() => startEditing(fieldName, displayValue)}
      >
        {displayValue || 'Click to edit'}
        {editedFields[fieldName] && (
          <div className="field-indicator">
            <Edit3 size={16} className="text-primary" />
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
      <div className="admin-company-profile">
        <div className="admin-company-profile-header">
          <div className="header-content">
            <p className="admin-company-profile-subtitle">Click on any field to edit your company information</p>
          </div>
        </div>

        <div className="company-profile-content">
          <div className="profile-section">
            <h3 className="section-title">
              <FileText className="w-6 h-6 text-primary" />
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
              <Building2 className="w-6 h-6 text-primary" />
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
              <Globe className="w-6 h-6 text-primary" />
              Online Presence
            </h3>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  LinkedIn Profile
                </label>
                {company?.linkedin ? (
                  <div>
                    {renderFieldValue('linkedin', company.linkedin)}
                    <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="profile-link">
                      View LinkedIn Profile →
                    </a>
                  </div>
                ) : (
                  renderFieldValue('linkedin', company?.linkedin)
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

          {/* Save/Cancel Actions */}
          {hasUnsavedChanges && (
            <div className="profile-actions">
              <div className="actions-container">
                <button
                  onClick={cancelAllChanges}
                  className="action-btn action-btn-cancel"
                >
                  <X size={20} className="mr-2" />
                  Cancel All Changes
                </button>
                <button
                  onClick={saveAllChanges}
                  disabled={savingField === 'all'}
                  className="action-btn action-btn-save"
                >
                  <Save size={20} className="mr-2" />
                  {savingField === 'all' ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;