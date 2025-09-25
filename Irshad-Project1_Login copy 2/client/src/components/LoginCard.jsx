import React, { useState } from "react";
import { loginUser } from "../services/api.js";

function LoginCard({ onLogin }) {
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

      console.log("Login response:", res); // Debug log

      if (res.success) {
        onLogin?.(res.user);
        localStorage.setItem("token", res.token);
        
        // Use the redirect URL from backend or fallback
        if (res.redirectTo) {
          window.location.href = res.redirectTo;
        } else {
          // Fallback redirects
          const redirectMap = {
            'Admin': '/admin',
            'Supervisor': '/supervisor', 
            'Trainee': '/trainee',
            'WebOwner': '/webowner'
          };
          window.location.href = redirectMap[res.user.role] || '/';
        }
      } else {
        setErrorMsg(res.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Network error - cannot connect to server");
    }

    setLoading(false);
  };

  return (
    <div className="card" role="group" aria-labelledby="signin-title">
      <h2 id="signin-title">Welcome to Irshad</h2>
      <div className="subtitle">Sign in to your account to continue</div>

      {errorMsg && (
        <div className="error-message" style={{color: "red", marginBottom: "1rem", fontWeight: "bold", textAlign: "center"}}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="label" htmlFor="role">Role</label>
          <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Admin">Admin</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Trainee">Trainee</option>
            <option value="WebOwner">Web Owner</option>
          </select>
        </div>

        <div className="form-row">
          <label className="label" htmlFor="email">Email</label>
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

        <div className="form-row password-field">
          <label className="label" htmlFor="pwd">Password</label>
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

        <div className="form-row">
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="links">
        <a href="#">Forgot your password?</a>
        <div className="link-inline">
          <span>Don't have a company account? </span>
          <a href="#">Register your company</a>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;