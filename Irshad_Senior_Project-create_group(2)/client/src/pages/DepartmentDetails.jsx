// client/src/pages/DepartmentDetails.jsx
import React from "react";
import { useParams } from "react-router-dom";
import CreateGroupButton from "../components/CreateGroupButton";
import "../styles/department-details.css";

function DepartmentDetails() {
  const { departmentName } = useParams(); // <-- name instead of id
  const userId = localStorage.getItem("userId");

  // Debug logging
  console.log("DepartmentDetails - departmentName:", departmentName);
  console.log("DepartmentDetails - userId:", userId);

  return (
    <div className="department-container">
      <div className="department-header">
        <h1 className="department-title">Department: {departmentName}</h1>
        {/* Pass departmentName instead of ID */}
        <CreateGroupButton departmentName={departmentName} adminId={userId} />
      </div>

      {/* Placeholder for future department info */}
      <div className="groups-section">
        <p>Department details and list of groups will appear here.</p>
        <p><strong>Debug Info:</strong> Department name from URL: "{departmentName}"</p>
      </div>
    </div>
  );
}

export default DepartmentDetails;
