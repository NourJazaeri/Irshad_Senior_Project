// client/src/pages/AssignMembers.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getEmployeesByDepartment, finalizeGroup, getCurrentUser } from "../services/api.js";
import { Building2, UserCog, Users, UserCheck, Search, Loader2 } from "lucide-react";
import "../styles/assign-members.css";

export default function AssignMembers() {
  const params = useParams();
  // Accept either departmentName or departmentId in the URL
  const departmentNameParam = params.departmentName || params.departmentId || "";
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  // Get current user info
  const currentUser = getCurrentUser();

  // From the previous step (CreateGroupButton navigate state)
  const groupName = state?.groupName || "";
  const adminId = state?.adminId || currentUser?.id;
  const isEditMode = state?.isEditMode || false;
  const existingGroupId = state?.existingGroupId || null;
  const [departmentId, setDepartmentId] = useState(null);
  
  // Fix for URL parameter issue - if departmentNameParam is :departmentName, extract from URL
  let departmentName = state?.departmentName || departmentNameParam;
  
  // If departmentName is still :departmentName or contains :, try to extract from URL path
  if (departmentName === ":departmentName" || departmentName.includes(":")) {
    const pathParts = window.location.pathname.split("/");
    const departmentIndex = pathParts.findIndex(part => part === "departments");
    if (departmentIndex !== -1 && pathParts[departmentIndex + 1]) {
      departmentName = decodeURIComponent(pathParts[departmentIndex + 1]);
    } else {
      // Try alternative path patterns
      const adminIndex = pathParts.findIndex(part => part === "admin");
      if (adminIndex !== -1) {
        const adminDepartmentIndex = pathParts.findIndex((part, index) => index > adminIndex && part === "departments");
        if (adminDepartmentIndex !== -1 && pathParts[adminDepartmentIndex + 1]) {
          departmentName = decodeURIComponent(pathParts[adminDepartmentIndex + 1]);
        }
      }
    }
  }
  
  // Final fallback - if still no valid department name, try to extract from any part of the URL
  if (!departmentName || departmentName === ":departmentName" || departmentName.includes(":")) {
    const urlParts = window.location.pathname.split("/");
    // Look for any part that looks like a department name (not empty, not 'departments', not 'admin', not 'assign-members')
    const possibleDepartment = urlParts.find(part => 
      part && 
      part !== 'departments' && 
      part !== 'admin' && 
      part !== 'assign-members' && 
      part !== 'details' &&
      !part.includes(':') &&
      part.length > 2
    );
    if (possibleDepartment) {
      departmentName = decodeURIComponent(possibleDepartment);
    }
  }
  
  // Temporary fallback for testing - if still no valid department name, use a default
  if (!departmentName || departmentName === ":departmentName" || departmentName.includes(":")) {
    departmentName = "Human Resources"; // Default for testing
    console.log("⚠️ Using fallback department name:", departmentName);
  }
  
  // Debug logging
  console.log("🔍 AssignMembers Debug:", {
    params,
    departmentNameParam,
    state,
    departmentName,
    location: useLocation(),
    pathname: window.location.pathname,
    urlParts: window.location.pathname.split("/")
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Fetch department ID from department name
  useEffect(() => {
    const fetchDepartmentId = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        const response = await fetch(`${API_BASE}/api/departments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            const departments = data.departments;
            const foundDepartment = departments.find(dept => 
              dept.departmentName.toLowerCase() === departmentName.toLowerCase()
            );
            if (foundDepartment) {
              setDepartmentId(foundDepartment._id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching department ID:', err);
      }
    };

    if (departmentName && departmentName !== ":departmentName") {
      fetchDepartmentId();
    }
  }, [departmentName]);

  // selection mode: "supervisor" or "trainees"
  const [mode, setMode] = useState(null);

  // chosen members
  const [selectedSupervisor, setSelectedSupervisor] = useState(null); // single
  const [selectedTrainees, setSelectedTrainees] = useState([]); // array

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [emailResults, setEmailResults] = useState(null);

  // Handle success popup close
  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    setEmailResults(null);
    // Navigate back to department details
    navigate(`/admin/departments/${encodeURIComponent(departmentName)}/details`);
  };

  // Guard: if user refreshes and there was no state, push them back to Dept page
  // Only redirect if state was expected but completely missing (page refresh scenario)
  useEffect(() => {
    // Only redirect if this is a page refresh (no state at all from navigation)
    // AND we don't have the groupName which is critical
    // Don't redirect if state exists (even if empty object) or if groupName exists
    const isPageRefresh = !state && !groupName;
    
    // Only redirect on actual page refresh, not on normal navigation
    if (isPageRefresh && departmentNameParam) {
      console.log('Redirecting: page was refreshed without state');
      navigate(`/admin/departments/${encodeURIComponent(departmentNameParam)}/details`);
    }
  }, []); // Empty dependency array - only run once on mount

  // Load existing group data if in edit mode
  useEffect(() => {
    const loadExistingGroup = async () => {
      if (isEditMode && existingGroupId) {
        try {
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE}/api/groups/${existingGroupId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          
          if (data.ok) {
            // Set existing supervisor - use employeeId for checkbox matching
            if (data.supervisor) {
              setSelectedSupervisor({
                _id: data.supervisor.employeeId || data.supervisor.supervisorId, // Use Employee ID for matching with employee list
                fname: data.supervisor.name.split(' ')[0],
                lname: data.supervisor.name.split(' ')[1] || '',
                email: data.supervisor.email,
                supervisorId: data.supervisor.supervisorId // Keep supervisor ID for reference
              });
            }
            
            // Set existing trainees - use employeeId for checkbox matching
            if (data.members && data.members.length > 0) {
              const traineesList = data.members.map(member => ({
                _id: member.employeeId || member.traineeId, // Use Employee ID for matching with employee list
                fname: member.name.split(' ')[0],
                lname: member.name.split(' ')[1] || '',
                email: member.email,
                traineeId: member.traineeId // Keep trainee ID for reference
              }));
              setSelectedTrainees(traineesList);
            }
          }
        } catch (err) {
          console.error('Error loading existing group:', err);
        }
      }
    };
    
    loadExistingGroup();
  }, [isEditMode, existingGroupId]);

  // Load employees of this department
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        
        // Check if departmentName is valid
        if (!departmentName || departmentName === ":departmentName" || departmentName.includes(":")) {
          setErrorMsg("Invalid department name. Please navigate to this page from the department list.");
          setLoading(false);
          return;
        }
        
        console.log("🔍 Making API call with departmentName:", departmentName);
        const data = await getEmployeesByDepartment({
          departmentName,
          search,
        });
        if (active) setEmployees(data || []);
      } catch (err) {
        if (active) setErrorMsg(err?.message || "Failed to load employees");
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [departmentName, search]);

  // filter in-memory too (quick UX), in case backend returns the whole list
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(e =>
      `${e.fname} ${e.lname}`.toLowerCase().includes(q) ||
      (e.email || "").toLowerCase().includes(q) ||
      (e.position || "").toLowerCase().includes(q)
    );
  }, [employees, search]);

  const isChecked = (empId) => {
    if (mode === "supervisor") {
      return selectedSupervisor?._id === empId;
    }
    if (mode === "trainees") {
      return selectedTrainees.some(t => t._id === empId);
    }
    return false;
  };

  const toggleSelection = (emp) => {
    if (!mode) return;

    if (mode === "supervisor") {
      // only one allowed
      if (selectedSupervisor?._id === emp._id) {
        setSelectedSupervisor(null); // unselect
      } else {
        setSelectedSupervisor(emp);
      }
    } else if (mode === "trainees") {
      // multiple allowed
      const exists = selectedTrainees.some(t => t._id === emp._id);
      if (exists) {
        setSelectedTrainees(prev => prev.filter(t => t._id !== emp._id));
      } else {
        setSelectedTrainees(prev => [...prev].concat(emp));
      }
    }
  };

  const handleSubmitGroup = async () => {
    setErrorMsg("");

    console.log("📋 Current state:", {
      groupName,
      departmentName,
      adminId,
      selectedSupervisor,
      selectedTraineesCount: selectedTrainees.length
    });

    if (!groupName?.trim()) {
      setErrorMsg("Please provide a group name.");
      return;
    }
    if (!departmentName) {
      setErrorMsg("Department name is missing. Please go back and try again.");
      return;
    }
    if (!adminId) {
      setErrorMsg("Admin ID is missing. Please log in again.");
      return;
    }
    if (!selectedSupervisor?._id) {
      setErrorMsg("Please click '+ Assign Supervisor' button and select a supervisor before finalizing the group.");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && existingGroupId) {
        // Update existing group - only add new trainees
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        
        const payload = {
          traineeIds: selectedTrainees.map(t => t._id),
        };

        console.log("🔍 Updating group with trainees:", payload);
        
        const response = await fetch(`${API_BASE}/api/groups/${existingGroupId}/add-trainees`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update group');
        }

        // Navigate back to group details
        navigate(`/admin/groups/${existingGroupId}`);
      } else {
        // Create new group
        const payload = {
          groupName,
          departmentName,
          adminId,
          supervisorId: selectedSupervisor._id,
          traineeIds: selectedTrainees.map(t => t._id),
        };

        console.log("🔍 Sending payload to finalizeGroup:", payload);
        const res = await finalizeGroup(payload);
        
        // Show success popup with email information
        if (res.emailResults && res.emailResults.length > 0) {
          setEmailResults(res.emailResults);
          setShowSuccessPopup(true);
        } else {
          setEmailResults([]);
          setShowSuccessPopup(true);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to " + (isEditMode ? "update" : "create") + " group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assign-container">
      <div className="assign-header">
        <div className="assign-header-left">
          <div className="text-lg flex items-center">
            <span 
              className="cursor-pointer hover:text-gray-900" 
              style={{ color: '#6b7280' }}
              onClick={() => navigate('/admin')}
            >
              Departments
            </span>
            <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span 
              className="cursor-pointer hover:text-gray-900" 
              style={{ color: '#6b7280' }}
              onClick={() => navigate(`/admin/departments/${encodeURIComponent(departmentName)}/details`)}
            >
              {departmentName}
            </span>
            <span style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span style={{ color: '#111827', fontWeight: '700' }}>{groupName}</span>
          </div>
          <h2 className="assign-title mt-2">{isEditMode ? `Edit: ${groupName}` : (groupName || "New Group")}</h2>
        </div>

        <div className="assign-actions flex gap-3">
          {!isEditMode && (
            <button
              className={`bg-white hover:bg-blue-50 text-gray-700 border-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-md hover:scale-105 ${mode === "supervisor" ? "border-blue-600 text-blue-600 hover:border-blue-700" : "border-gray-300 hover:border-blue-400"}`}
              onClick={() => setMode(mode === "supervisor" ? null : "supervisor")}
            >
              + Assign Supervisor
            </button>
          )}
          <button
            className={`bg-white hover:bg-blue-50 text-gray-700 border-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-md hover:scale-105 ${mode === "trainees" ? "border-blue-600 text-blue-600 hover:border-blue-700" : "border-gray-300 hover:border-blue-400"}`}
            onClick={() => setMode(mode === "trainees" ? null : "trainees")}
          >
            + Add Trainees
          </button>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 hover:shadow-lg hover:scale-105"
            onClick={handleSubmitGroup}
            disabled={submitting}
            title={isEditMode ? "Update group members" : "Creates the group with selected supervisor & trainees"}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            {submitting ? "Updating..." : (isEditMode ? "Update Group" : "Finalize Group")}
          </button>
        </div>
      </div>

      {/* Selection summary */}
      <section className="summary-card">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5">
          <UserCog className="w-5 h-5 text-blue-600" />
          Group Assignment Summary
        </h3>
        <div className="summary-row">
          <div><b>Group:</b> <span style={{ color: '#111827', fontWeight: '700' }}>{groupName}</span></div>
          <div><b>Department:</b> <span style={{ color: '#059669', fontWeight: '600' }}>{departmentName}</span></div>
        </div>
        <div className="summary-row">
          <div>
            <b>Supervisor:</b>{" "}
            {selectedSupervisor ? (
              <span style={{ color: '#dc2626', fontWeight: '600' }}>
                👨‍💼 {selectedSupervisor.fname} {selectedSupervisor.lname}
              </span>
            ) : (
              <span style={{ color: '#dc2626' }}>None selected</span>
            )}
          </div>
          <div>
            <b>Trainees:</b>{" "}
            {selectedTrainees.length ? (
              <span style={{ color: '#059669', fontWeight: '600' }}>
                👥 {selectedTrainees.length} selected: {selectedTrainees.map(t => `${t.fname} ${t.lname}`).join(", ")}
              </span>
            ) : (
              <span style={{ color: '#dc2626' }}>None selected</span>
            )}
          </div>
        </div>
      </section>

      {/* Search + Table */}
      <section className="table-card">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-5">
          <Users className="w-5 h-5 text-blue-600" />
          Available Employees
        </h3>
        <div className="table-toolbar flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {mode ? (
            <div className="mode-pill">
              Selecting: <b>{mode === "supervisor" ? "Supervisor (1)" : "Trainees (multi)"}</b>
            </div>
          ) : (
            <div className="muted">💡 Choose an action above to start selecting</div>
          )}
        </div>

        {errorMsg && (
          <div className="error-banner">{errorMsg}</div>
        )}

        {loading ? (
          <div className="loading">Loading employees…</div>
        ) : (
          <div className="table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  <th style={{width: 50}}>Select</th>
                  <th>👤 Name</th>
                  <th>💼 Position</th>
                  <th>📞 Phone</th>
                  <th>📧 Email</th>
                  <th>🏢 Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      <div>
                        <h3>{loading ? '⏳ Loading employees...' : '🔍 No employees found'}</h3>
                        <p>{loading ? 'Please wait while we fetch the employee list' : 'Try adjusting your search criteria'}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map(emp => {
                  const fullName = `${emp.fname} ${emp.lname}`;
                  return (
                    <tr key={emp._id} className={isChecked(emp._id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked(emp._id)}
                          onChange={() => toggleSelection(emp)}
                          disabled={!mode}
                          title={mode ? `Select ${fullName}` : 'Choose a selection mode first'}
                        />
                      </td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>
                        {fullName}
                      </td>
                      <td style={{ color: '#475569' }}>{emp.position || "-"}</td>
                      <td style={{ color: '#6b7280' }}>{emp.phone || "-"}</td>
                      <td style={{ color: '#6b7280', fontSize: '13px' }}>{emp.email || "-"}</td>
                      <td style={{ color: '#059669', fontWeight: '500' }}>{emp.departmentName || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup">
            <div className="success-popup-header">
              <div className="success-icon">✅</div>
              <h3>Group Created Successfully!</h3>
            </div>
            
            <div className="success-popup-content">
              <p>Your group "<strong>{groupName}</strong>" has been created successfully.</p>
              
              {emailResults && emailResults.length > 0 ? (
                <div className="email-status">
                  <h4>📧 Email Status:</h4>
                  <div className="email-list">
                    {emailResults.map((result, index) => (
                      <div key={index} className={`email-item ${result.success ? 'success' : 'failed'}`}>
                        <span className="email-type">
                          {result.type === 'supervisor' ? '👨‍💼 Supervisor' : '👥 Trainee'}
                        </span>
                        <span className="email-address">{result.email}</span>
                        <span className="email-status-icon">
                          {result.success ? '✅' : '❌'}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="email-summary">
                    <p>
                      📧 Login credentials sent to <strong>{emailResults.filter(r => r.success).length}</strong> out of <strong>{emailResults.length}</strong> members.
                    </p>
                    {emailResults.some(r => !r.success) && (
                      <p className="warning">
                        ⚠️ Some emails failed to send. Members can still log in with their assigned credentials.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="email-status">
                  <p>📧 No new credentials were generated (existing members were assigned).</p>
                </div>
              )}
            </div>
            
            <div className="success-popup-actions">
              <button 
                onClick={handleSuccessPopupClose}
                className="success-popup-btn"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
