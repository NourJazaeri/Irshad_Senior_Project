import React from "react";
import "../styles/login.css";

function SupervisorDashboard() {
  return (
    <div className="app-container">
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1 style={{ color: "#ffffff", fontSize: "2.5rem", marginBottom: "1rem" }}>Supervisor Dashboard</h1>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.2rem" }}>Welcome, Supervisor!</p>
      </div>
    </div>
  );
}

export default SupervisorDashboard;