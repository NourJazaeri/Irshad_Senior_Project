import React, { useState } from 'react';

export default function CompanyRegistration() {
  const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) || '';
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
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    adminPosition: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!formData.commercialRegistrationNumber.trim()) {
      newErrors.commercialRegistrationNumber = 'Commercial registration number is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Company size is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.adminFirstName.trim()) {
      newErrors.adminFirstName = 'First name is required';
    }
    if (!formData.adminLastName.trim()) {
      newErrors.adminLastName = 'Last name is required';
    }
    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Email is invalid';
    }
    if (!formData.adminPhone.trim()) {
      newErrors.adminPhone = 'Phone number is required';
    }
    if (!formData.adminPosition.trim()) {
      newErrors.adminPosition = 'Position is required';
    }
    if (!formData.adminPassword) {
      newErrors.adminPassword = 'Password is required';
    } else if (formData.adminPassword.length < 6) {
      newErrors.adminPassword = 'Password must be at least 6 characters';
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
      const response = await fetch(`${API_BASE}/api/registration-requests`, {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        alert('Registration request submitted successfully!');
        // Reset form or redirect
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
          adminFirstName: '',
          adminLastName: '',
          adminEmail: '',
          adminPhone: '',
          adminPosition: '',
          adminPassword: '',
          confirmPassword: ''
        });
        setCurrentStep(1);
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

  return (
    <div className="registration-container">
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
                  />
                  {errors.companyName && <span className="error-message">{errors.companyName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="branches">Branches</label>
                  <input
                    type="text"
                    id="branches"
                    name="branches"
                    value={formData.branches}
                    onChange={handleInputChange}
                  />
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
                  />
                  {errors.commercialRegistrationNumber && <span className="error-message">{errors.commercialRegistrationNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taxNumber">Tax Number (Optional)</label>
                  <input
                    type="text"
                    id="taxNumber"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                  />
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
                  <label htmlFor="linkedinProfileUrl">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    id="linkedinProfileUrl"
                    name="linkedinProfileUrl"
                    value={formData.linkedinProfileUrl}
                    onChange={handleInputChange}
                    placeholder="e.g., https://linkedin.com/company/nexus-i"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="companyLogo">Company Logo (Optional)</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="companyLogo"
                      name="companyLogo"
                      onChange={handleInputChange}
                      accept="image/*"
                    />
                    <div className="file-upload-area">
                      <div className="upload-icon">↑</div>
                      <p>Upload Logo (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-step">
              <h2>Admin Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminFirstName">First Name *</label>
                  <input
                    type="text"
                    id="adminFirstName"
                    name="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={handleInputChange}
                    className={errors.adminFirstName ? 'error' : ''}
                  />
                  {errors.adminFirstName && <span className="error-message">{errors.adminFirstName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="adminLastName">Last Name *</label>
                  <input
                    type="text"
                    id="adminLastName"
                    name="adminLastName"
                    value={formData.adminLastName}
                    onChange={handleInputChange}
                    className={errors.adminLastName ? 'error' : ''}
                  />
                  {errors.adminLastName && <span className="error-message">{errors.adminLastName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminEmail">Email *</label>
                  <input
                    type="email"
                    id="adminEmail"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleInputChange}
                    className={errors.adminEmail ? 'error' : ''}
                  />
                  {errors.adminEmail && <span className="error-message">{errors.adminEmail}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="adminPhone">Phone Number *</label>
                  <input
                    type="tel"
                    id="adminPhone"
                    name="adminPhone"
                    value={formData.adminPhone}
                    onChange={handleInputChange}
                    className={errors.adminPhone ? 'error' : ''}
                  />
                  {errors.adminPhone && <span className="error-message">{errors.adminPhone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adminPosition">Position *</label>
                  <input
                    type="text"
                    id="adminPosition"
                    name="adminPosition"
                    value={formData.adminPosition}
                    onChange={handleInputChange}
                    className={errors.adminPosition ? 'error' : ''}
                  />
                  {errors.adminPosition && <span className="error-message">{errors.adminPosition}</span>}
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
