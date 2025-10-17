// client/src/pages/DepartmentDetails.jsx
import React from "react";
import { useParams } from "react-router-dom";
import CreateGroupButton from "../components/CreateGroupButton";

function DepartmentDetails() {
  const { departmentName } = useParams(); // <-- name instead of id
  const userId = localStorage.getItem("userId");

  return (
    <div className="department-details-container">
      <div className="header">
        <h2>Department: {departmentName}</h2>
        {/* Pass departmentName instead of ID */}
        <CreateGroupButton departmentName={departmentName} adminId={userId} />
      </div>

      {/* Placeholder for future department info */}
      <div className="department-content">
        <p>Department details and list of groups will appear here.</p>
      </div>
    </div>
  );
}

export default DepartmentDetails;
