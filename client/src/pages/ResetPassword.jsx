import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Hero from "../components/Hero";
import "../styles/login.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Get token, uid, and role from URL parameters
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const role = searchParams.get("role");

  useEffect(() => {
    document.body.classList.add("login-page");
    
    // Validate URL parameters
    if (!token || !uid || !role) {
      setMessage("Invalid or missing reset link parameters.");
      setMessageType("error");
    }
    
    return () => document.body.classList.remove("login-page");
  }, [token, uid, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Password validation with clear requirements
    const validationErrors = [];
    
    if (newPassword.length < 8) {
      validationErrors.push('at least 8 characters');
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      validationErrors.push('1 capital letter');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      validationErrors.push('1 special character');
    }
    
    if (validationErrors.length > 0) {
      setMessage(`Password must contain: ${validationErrors.join(', ')}.`);
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    if (!token || !uid || !role) {
      setMessage("Invalid reset link. Please request a new password reset.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token, 
          uid, 
          role, 
          newPassword 
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errText = data?.message || `Request failed with status ${res.status}`;
        setMessage(errText);
        setMessageType("error");
      } else if (data?.success) {
        setMessage("Password reset successful! Redirecting to login...");
        setMessageType("success");
        
        // Clear form
        setNewPassword("");
        setConfirmPassword("");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data?.message || "Failed to reset password. Please try again.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setMessage("Network error - cannot connect to server. Please try again later.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Hero />
      <div className="card" role="group" aria-labelledby="reset-password-title">
        <h2 id="reset-password-title">Reset Your Password</h2>
        <div className="subtitle">Enter your new password below</div>

        {message && (
          <div 
            className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}
            style={{
              backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
              borderLeft: messageType === 'success' ? '4px solid #28a745' : '4px solid #dc3545',
              color: messageType === 'success' ? '#155724' : '#721c24',
              padding: '12px 16px',
              margin: '20px 0',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '1.5',
            }}
            role="alert"
          >
            {messageType === 'success' ? '✅ ' : '❌ '}{message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row password-field">
            <label className="label" htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="newPassword"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 capital, 1 special char"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <button 
                type="button" 
                className="toggle" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-row password-field">
            <label className="label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="confirmPassword"
                className="input"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button 
                type="button" 
                className="toggle" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-row">
            <button 
              className="button-primary" 
              type="submit" 
              disabled={loading || !token || !uid || !role}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>

        <div className="links">
          <a href="/login" onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}>← Back to Login</a>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
