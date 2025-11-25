import React, { useState, useEffect } from "react";
import { FileText, Building2, Globe, Upload } from "lucide-react";
import "../styles/profile.css";

function CompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSection, setEditingSection] = useState(null); // 'basic', 'business', 'online', or null
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    CRN: '',
    taxNo: '',
    industry: '',
    size: '',
    description: '',
    branches: '',
    linkedin: ''
  });

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
          setFormData({
            name: data.company.name || '',
            CRN: data.company.CRN || '',
            taxNo: data.company.taxNo || '',
            industry: data.company.industry || '',
            size: data.company.size || '',
            description: data.company.description || '',
            branches: data.company.branches || '',
            linkedin: data.company.linkedin || ''
          });
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

  // Handle input changes
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/company-profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.ok && data.company) {
        setCompany(data.company);
        setEditingSection(null);
        alert('Changes saved successfully!');
      } else {
        throw new Error(data.message || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = (section) => {
    setEditingSection(null);
    if (company) {
      setFormData({
        name: company.name || '',
        CRN: company.CRN || '',
        taxNo: company.taxNo || '',
        industry: company.industry || '',
        size: company.size || '',
        description: company.description || '',
        branches: company.branches || '',
        linkedin: company.linkedin || ''
      });
    }
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

      const uploadFormData = new FormData();
      uploadFormData.append('companyLogo', file);

      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/company-profile/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData
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
            alert('Logo uploaded successfully!');
          }
        }
      } else {
        throw new Error(uploadResult.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert('Failed to upload logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading your company profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">Error Loading Company Profile: {error}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Basic Information */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <div className="profile-icon blue">
              <FileText size={24} />
            </div>
            <div>
              <h2>Basic Information</h2>
              <p>Your company's basic details and registration information</p>
            </div>
          </div>
        </div>

        <div className="profile-card-body">
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>
                <FileText size={16} /> Company Name <span className="read-only-badge">Required</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={editingSection !== 'basic'}
                className="profile-input"
              />
            </div>

            <div className="profile-form-group">
              <label>
                <Building2 size={16} /> Industry <span className="read-only-badge">Required</span>
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={editingSection !== 'basic'}
                className="profile-input"
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
            </div>

            <div className="profile-form-group">
              <label>
                <Building2 size={16} /> Branches
              </label>
              <input
                type="text"
                name="branches"
                value={formData.branches}
                onChange={handleInputChange}
                disabled={editingSection !== 'basic'}
                className="profile-input"
              />
            </div>

            <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                <FileText size={16} /> Company Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={editingSection !== 'basic'}
                className="profile-input"
                rows="4"
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>
          </div>

          <div className="profile-actions">
            {editingSection === 'basic' ? (
              <>
                <button className="btn-primary" onClick={handleSaveChanges} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => handleCancel('basic')}>
                  Cancel
                </button>
              </>
            ) : (
              <button className={editingSection ? "btn-secondary" : "btn-secondary"} onClick={() => setEditingSection('basic')}>
                Edit Information
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <div className="profile-icon purple">
              <Building2 size={24} />
            </div>
            <div>
              <h2>Business Details</h2>
              <p>Information about your company's industry, size, and operations</p>
            </div>
          </div>
        </div>

        <div className="profile-card-body">
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>
                <FileText size={16} /> CRN (Commercial Registration Number) <span className="read-only-badge">Required</span>
              </label>
              <input
                type="text"
                name="CRN"
                value={formData.CRN}
                onChange={handleInputChange}
                disabled={editingSection !== 'business'}
                className="profile-input"
              />
            </div>

            <div className="profile-form-group">
              <label>
                <FileText size={16} /> Tax Number
              </label>
              <input
                type="text"
                name="taxNo"
                value={formData.taxNo}
                onChange={handleInputChange}
                disabled={editingSection !== 'business'}
                className="profile-input"
              />
            </div>

            <div className="profile-form-group">
              <label>
                <Building2 size={16} /> Company Size (Employees)
              </label>
              <select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                disabled={editingSection !== 'business'}
                className="profile-input"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>
          </div>

          <div className="profile-actions">
            {editingSection === 'business' ? (
              <>
                <button className="btn-primary" onClick={handleSaveChanges} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => handleCancel('business')}>
                  Cancel
                </button>
              </>
            ) : (
              <button className={editingSection ? "btn-secondary" : "btn-secondary"} onClick={() => setEditingSection('business')}>
                Edit Information
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Online Presence */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <div className="profile-icon green">
              <Globe size={24} />
            </div>
            <div>
              <h2>Online Presence</h2>
              <p>Your company's online profiles and branding</p>
            </div>
          </div>
        </div>

        <div className="profile-card-body">
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>
                <Globe size={16} /> LinkedIn Profile
              </label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                disabled={editingSection !== 'online'}
                className="profile-input"
                placeholder="https://linkedin.com/company/your-company"
              />
            </div>

            <div className="profile-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                <Building2 size={16} /> Company Logo
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleLogoUpload}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: editingSection === 'online' ? 'pointer' : 'not-allowed', zIndex: 1 }}
                  disabled={uploadingLogo || editingSection !== 'online'}
                />
                <div 
                  style={{
                    border: '2px dashed #D1D5DB',
                    borderRadius: '12px',
                    padding: '48px 20px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    transition: 'all 0.2s',
                    cursor: editingSection === 'online' ? 'pointer' : 'not-allowed',
                    opacity: editingSection === 'online' ? 1 : 0.6,
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (editingSection === 'online') {
                      e.currentTarget.style.borderColor = '#4F46E5';
                      e.currentTarget.style.background = '#F3F4F6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (editingSection === 'online') {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                >
                  {company?.logoUrl && !uploadingLogo ? (
                    <>
                      <img 
                        src={company.logoUrl} 
                        alt={`${company.name} logo`}
                        style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', objectFit: 'contain', marginBottom: '12px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <p style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Click to change logo
                      </p>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>
                        JPG, PNG, GIF - Max 5MB
                      </p>
                    </>
                  ) : uploadingLogo ? (
                    <>
                      <div style={{ width: '48px', height: '48px', border: '3px solid rgba(79, 70, 229, 0.3)', borderTop: '3px solid #4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }}></div>
                      <p style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Uploading...
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload size={48} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '500' }}>
                        Upload Company Logo (Optional)
                      </p>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>
                        JPG, PNG, GIF - Max 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {editingSection === 'online' ? (
              <>
                <button className="btn-primary" onClick={handleSaveChanges} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => handleCancel('online')}>
                  Cancel
                </button>
              </>
            ) : (
              <button className={editingSection ? "btn-secondary" : "btn-secondary"} onClick={() => setEditingSection('online')}>
                Edit Information
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;