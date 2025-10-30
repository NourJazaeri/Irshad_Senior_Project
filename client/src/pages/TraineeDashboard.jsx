import React from "react";
import { Link } from "react-router-dom";
import "../styles/login.css";

function TraineeDashboard() {
  return (
    <div className="app-container">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ color: "#ffffff", fontSize: "2.5rem", marginBottom: "1rem" }}>Trainee Dashboard</h1>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.2rem" }}>Welcome, Trainee!</p>
        <div style={{ marginTop: "2rem" }}>
          <Link to="/trainee/todo" style={{
            display: "inline-block",
            padding: "10px 16px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600
          }}>
            To-Do List
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TraineeDashboard;