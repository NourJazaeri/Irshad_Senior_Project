import React, { useState } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder login logic - just show alert for now
    alert('Login functionality will be implemented here!');
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <h1>Login to Irshad</h1>
        <p>Welcome back! Please sign in to your account.</p>
      </div>

      <div className="registration-form-container" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-step">
            <h2>Sign In</h2>
            
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => window.location.href = '/'} className="btn-secondary">
              ← Back to Registration
            </button>
            <button type="submit" className="btn-primary">
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
