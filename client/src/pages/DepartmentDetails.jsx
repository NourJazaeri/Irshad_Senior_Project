import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import CreateGroupButton from "../components/CreateGroupButton";
import "../styles/department-details.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function DepartmentDetails() {
  const { departmentName } = useParams();
  const [department, setDepartment] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  // Fetch department details and groups
  useEffect(() => {
    const fetchDepartmentData = async () => {
    try {
        setLoading(true);
        
        // First, get all departments to find the one with matching name
        const departmentsResponse = await axios.get(`${API_BASE}/api/departments`, {
        headers: authHeaders(),
      });

        if (departmentsResponse.data.ok) {
          const departments = departmentsResponse.data.departments;
          const foundDepartment = departments.find(dept => 
            dept.departmentName.toLowerCase() === departmentName.toLowerCase()
          );

          if (foundDepartment) {
            setDepartment(foundDepartment);

            // Now fetch groups for this department
            const groupsResponse = await axios.get(
              `${API_BASE}/api/groups/by-department/${foundDepartment._id}`,
        { headers: authHeaders() }
      );

            if (groupsResponse.data.ok) {
              setGroups(groupsResponse.data.groups);
            }
          } else {
            setError("Department not found");
          }
        }
    } catch (err) {
        console.error("Error fetching department data:", err);
        setError("Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

    fetchDepartmentData();
  }, [departmentName]);

  const handleGroupUpdate = () => {
    // Refresh groups after any update
    if (department) {
      axios.get(
        `${API_BASE}/api/groups/by-department/${department._id}`,
        { headers: authHeaders() }
      ).then(response => {
        if (response.data.ok) {
          setGroups(response.data.groups);
        }
      }).catch(err => console.error("Error refreshing groups:", err));
    }
  };

  // Handle edit group
  const handleEditGroup = (group) => {
    setEditingGroup(group._id);
    setEditGroupName(group.groupName);
  };

  // Save edited group name
  const handleSaveEdit = async () => {
    if (!editGroupName.trim()) {
      alert("Group name cannot be empty");
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE}/api/groups/${editingGroup}`,
        { groupName: editGroupName.trim() },
        { headers: authHeaders() }
      );

      if (response.data.ok) {
        setEditingGroup(null);
        setEditGroupName("");
        handleGroupUpdate(); // Refresh the groups list
        alert("Group renamed successfully!");
      } else {
        alert("Failed to rename group");
      }
    } catch (err) {
      console.error("Error editing group:", err);
      alert("Failed to rename group");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditGroupName("");
  };

  // Handle delete group
  const handleDeleteGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?\n\nThis will:\n• Remove all trainees from this group\n• Make trainees available for other groups\n• Update department member count\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE}/api/groups/${groupId}`,
        { headers: authHeaders() }
      );

      // Debug: Log the full response
      console.log("Delete group response:", response.data);
      
      if (response.data.ok) {
        handleGroupUpdate(); // Refresh the groups list
        
        // Show detailed success message
        const details = response.data.details;
        let successMessage = "Group deleted successfully!";
        
        if (details && details.groupName) {
          successMessage = `Group "${details.groupName}" deleted successfully!`;
        }
        
        if (details && details.traineesUnassigned > 0) {
          successMessage += `\n\n✅ ${details.traineesUnassigned} trainee(s) have been unassigned and can now be added to other groups.`;
        }
        
        alert(successMessage);
      } else {
        alert(`Failed to delete group: ${response.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);
      
      if (err.response?.data?.message) {
        alert(`Failed to delete group: ${err.response.data.message}`);
      } else {
        alert("Failed to delete group");
      }
    }
  };

  if (loading) {
    return (
      <div className="department-container">
        <div className="loading">Loading department details...</div>
    </div>
  );
}

  if (error) {
  return (
      <div className="department-container">
        <div className="error">❌ {error}</div>
    </div>
  );
}

  return (
    <div className="department-container">
      <div className="department-header">
        <h1 className="department-title">Department: {department?.departmentName}</h1>
        <CreateGroupButton 
          departmentName={departmentName} 
          adminId={localStorage.getItem("userId")}
          onGroupCreated={handleGroupUpdate}
        />
      </div>

      <div className="groups-section">
        <h2>Groups ({groups.length})</h2>
        
        {groups.length > 0 ? (
          <div className="groups-grid">
            {groups.map((group) => (
              <div key={group._id} className="group-card">
                {editingGroup === group._id ? (
                  // Edit mode
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit();
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="edit-input"
                      placeholder="Enter group name"
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button 
                        className="btn-save" 
                        onClick={handleSaveEdit}
                      >
                        Save
                      </button>
                      <button 
                        className="btn-cancel" 
                        onClick={handleCancelEdit}
                      >
            Cancel
          </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <h3 className="group-name">{group.groupName}</h3>
                    <div className="group-info">
                      <div className="group-stat">
                        <span className="stat-icon">👥</span>
                        <span>{group.numOfMembers} Members</span>
                      </div>
                      <div className="group-stat">
                        <span className="stat-icon">👨‍💼</span>
                        <span>Supervisor: {group.supervisorName}</span>
                      </div>
                    </div>
                    <div className="group-actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEditGroup(group)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteGroup(group._id, group.groupName)}
                      >
            Delete
          </button>
        </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-groups">
            <div className="no-groups-icon">👥</div>
            <h3>No groups yet</h3>
            <p>Create your first group to start organizing this department</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DepartmentDetails;
