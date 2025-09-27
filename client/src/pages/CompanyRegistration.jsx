import React, { useState } from 'react';

export default function CompanyRegistration() {
  const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:5000';
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    description: '',
    branches: '',
    commercialRegistrationNumber: '',
    taxNumber: '',
    industry: '',
    companySize: '',
    companyLogo: null,
    linkedinProfileUrl: '',
    // Admin Information (for step 2)
    adminEmail: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Real Estate',
    'Consulting',
    'Other'
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Company description is required';
    }
    if (!formData.branches.trim()) {
      newErrors.branches = 'Branches information is required';
    }
    if (!formData.commercialRegistrationNumber.trim()) {
      newErrors.commercialRegistrationNumber = 'Commercial registration number is required';
    }
    if (!formData.taxNumber.trim()) {
      newErrors.taxNumber = 'Tax number is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Company size is required';
    }
    if (!formData.companyLogo) {
      newErrors.companyLogo = 'Company logo is required';
    }
    if (!formData.linkedinProfileUrl.trim()) {
      newErrors.linkedinProfileUrl = 'LinkedIn profile URL is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Email is invalid';
    }
    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Password is required';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.adminPassword)) {
        newErrors.adminPassword = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
      }
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'companyLogo' && formData[key]) {
          submitData.append(key, formData[key]);
        } else if (key !== 'companyLogo') {
          submitData.append(key, formData[key]);
        }
      });

      // Submit to MongoDB via API
      const response = await fetch(`${API_BASE}/api/company-registration-forms`, {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        setShowSuccess(true);
      } else {
        throw new Error('Failed to submit registration request');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting registration request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Reset form
    setFormData({
      companyName: '',
      description: '',
      branches: '',
      commercialRegistrationNumber: '',
      taxNumber: '',
      industry: '',
      companySize: '',
      companyLogo: null,
      linkedinProfileUrl: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: ''
    });
    setCurrentStep(1);
    // Redirect to login page
    window.location.href = '/auth';
  };

  const SuccessMessage = () => (
    <>
      <div className="success-overlay" onClick={handleSuccessClose}></div>
      <div className="success-message">
        <div className="success-icon">
          ✓
        </div>
        <h3 className="success-title">Registration Submitted Successfully!</h3>
        <p className="success-description">
          Thank you for submitting your company registration request. Our team will review your application and get back to you within 2-3 business days.
        </p>
        <button className="success-button" onClick={handleSuccessClose}>
          Continue to Login
        </button>
      </div>
    </>
  );

  return (
    <div className="registration-container">
      {showSuccess && <SuccessMessage />}
      <div className="registration-header">
        <h1>Register Your Company on Irshad</h1>
        <p>Please provide company and admin details to get started.</p>
      </div>

      <div className="step-indicator">
        <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
          1 Company Info
        </div>
        <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
          2 Admin Info
        </div>
      </div>

      <div className="registration-form-container">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="form-step">
              <h2>Company Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={errors.companyName ? 'error' : ''}
                    placeholder="e.g., Nexus Technologies Ltd."
                    required
                  />
                  {errors.companyName && <span className="error-message">{errors.companyName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={errors.description ? 'error' : ''}
                    rows="4"
                    placeholder="Describe your company's main business activities, services, and mission..."
                    required
                  />
                  {errors.description && <span className="error-message">{errors.description}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branches">Branches *</label>
                  <input
                    type="text"
                    id="branches"
                    name="branches"
                    value={formData.branches}
                    onChange={handleInputChange}
                    className={errors.branches ? 'error' : ''}
                    placeholder="Riyadh, Jeddah, Dammam (separate with commas)"
                    required
                  />
                  {errors.branches && <span className="error-message">{errors.branches}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="commercialRegistrationNumber">Commercial Registration Number *</label>
                  <input
                    type="text"
                    id="commercialRegistrationNumber"
                    name="commercialRegistrationNumber"
                    value={formData.commercialRegistrationNumber}
                    onChange={handleInputChange}
                    className={errors.commercialRegistrationNumber ? 'error' : ''}
                    placeholder="1010123456 (10-digit number)"
                    required
                  />
                  {errors.commercialRegistrationNumber && <span className="error-message">{errors.commercialRegistrationNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taxNumber">Tax Number *</label>
                  <input
                    type="text"
                    id="taxNumber"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                    className={errors.taxNumber ? 'error' : ''}
                    placeholder="300123456789003 (15-digit VAT number)"
                    required
                  />
                  {errors.taxNumber && <span className="error-message">{errors.taxNumber}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="industry">Industry *</label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className={errors.industry ? 'error' : ''}
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <span className="error-message">{errors.industry}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="companySize">Company Size *</label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className={errors.companySize ? 'error' : ''}
                  >
                    <option value="">Select Company Size</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.companySize && <span className="error-message">{errors.companySize}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="linkedinProfileUrl">LinkedIn Profile URL *</label>
                  <input
                    type="url"
                    id="linkedinProfileUrl"
                    name="linkedinProfileUrl"
                    value={formData.linkedinProfileUrl}
                    onChange={handleInputChange}
                    className={errors.linkedinProfileUrl ? 'error' : ''}
                    placeholder="https://linkedin.com/company/your-company"
                    required
                  />
                  {errors.linkedinProfileUrl && <span className="error-message">{errors.linkedinProfileUrl}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="companyLogo">Company Logo *</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="companyLogo"
                      name="companyLogo"
                      onChange={handleInputChange}
                      accept="image/*"
                      className={errors.companyLogo ? 'error' : ''}
                      required
                    />
                    <div className="file-upload-area">
                      {formData.companyLogo ? (
                        <div className="uploaded-file-preview">
                          <img 
                            src={URL.createObjectURL(formData.companyLogo)} 
                            alt="Company Logo Preview" 
                            className="logo-preview"
                          />
                          <p className="file-name">{formData.companyLogo.name}</p>
                          <p className="file-info">✓ Logo uploaded successfully</p>
                        </div>
                      ) : (
                        <>
                          <div className="upload-icon">↑</div>
                          <p>Upload Company Logo (Required)</p>
                          <p className="upload-hint">JPG, PNG, GIF - Max 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.companyLogo && <span className="error-message">{errors.companyLogo}</span>}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-step">
              <h2>Admin Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminEmail">Admin Email *</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className={errors.adminEmail ? 'error' : ''}
                    placeholder="Enter admin email"
                  />
                  {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminPassword">Password *</label>
                  <input
                    type="password"
                    id="adminPassword"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleInputChange}
                    className={errors.adminPassword ? 'error' : ''}
                    placeholder="Enter admin password"
                  />
                  {errors.adminPassword && <span className="error-message">{errors.adminPassword}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm admin password"
                  />
                  {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {currentStep === 1 ? (
              <button type="button" onClick={handleNext} className="btn-primary">
                Next: Admin Information →
              </button>
            ) : (
              <>
                <button type="button" onClick={handleBack} className="btn-secondary">
                  ← Back to Company Info
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
