import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";
import "../styles/login.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function ForgotPassword() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    // Basic validation
    if (!role || !email) {
      setMessage("Please select a role and enter your email.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errText = data?.message || `Request failed with status ${res.status}`;
        setMessage(errText);
        setMessageType("error");
      } else if (data?.success) {
        setMessage("Password reset link sent to your email. Please check your inbox.");
        setMessageType("success");
        // Clear form on success
        setEmail("");
        setRole("");
      } else {
        setMessage(data?.message || "Failed to send reset link. Please try again.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage("Network error - cannot connect to server. Please try again later.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Hero />
      <div className="card" role="group" aria-labelledby="forgot-password-title">
        <h2 id="forgot-password-title">Forgot Password</h2>
        <div className="subtitle">Enter your role and email to receive a password reset link.</div>

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
            <div className="form-row">
              <label className="label" htmlFor="role">Role</label>
              <div className="select-wrapper">
                <select
                  id="role"
                  className="select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Trainee">Trainee</option>
                  <option value="WebOwner">Web Owner</option>
                </select>
                <svg className="select-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div className="form-row">
              <label className="label" htmlFor="email">Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <button className="button-primary" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Email"}
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

export default ForgotPassword;
