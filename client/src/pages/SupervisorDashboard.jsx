import React from "react";
import "../styles/admin-components.css";

function SupervisorDashboard() {
  return (
    <div className="admin-page">
      <div className="dashboard-header">
        <h1>Supervisor Dashboard</h1>
        <p>Use the sidebar to access ready templates</p>
      </div>

      <div className="empty-state" style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "#6b7280"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "20px" }}>📋</div>
        <h2 style={{ color: "#374151", marginBottom: "12px" }}>Welcome to Supervisor Panel</h2>
        <p style={{ fontSize: "16px", lineHeight: "1.5" }}>
          Click on "Ready Templates" in the sidebar to browse and use available templates.
        </p>
      </div>
    </div>
  );
}

export default SupervisorDashboard;
