import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api.js";

function LoginCard({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("Admin"); // Default to Admin for testing
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await loginUser({ email, password, role });

      if (res.success) {
        onLogin?.(res.user);
        localStorage.setItem("token", res.token);
        localStorage.setItem("sessionId", res.sessionId);
        localStorage.setItem("user", JSON.stringify(res.user)); // Save user data for TodoList

        if (res.redirectTo) {
          navigate(res.redirectTo);
        } else {
          const redirectMap = {
            Admin: "/admin/dashboard",
            Supervisor: "/supervisor",
            Trainee: "/trainee",
            WebOwner: "/webowner",
          };
          navigate(redirectMap[res.user.role] || "/");
        }
      } else {
        setErrorMsg(res.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg(error?.message || "Network error - cannot connect to server");
    }

    setLoading(false);
  };

  return (
    <div className="card" role="group" aria-labelledby="signin-title">
      <h2 id="signin-title">Welcome to Irshad</h2>
      <div className="subtitle">Sign in to your account to continue</div>

      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="role">Role</label>
          <div className="select-wrapper">
            <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
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
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row password-field">
          <label className="label" htmlFor="pwd">Password</label>
          <div className="input-wrapper">
            <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              id="pwd"
              className="input"
              type={show ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="toggle" onClick={() => setShow((s) => !s)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-row">
          <button className="button-primary" type="submit">
            Sign In
          </button>
        </div>
      </form>

      <div className="links">
        <a href="/forgot-password">Forgot your password?</a>
        <div className="link-inline">
          <span>Don't have a company account? </span>
          <a href="/registration">Register your company</a>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;