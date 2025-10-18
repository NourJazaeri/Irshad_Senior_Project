// client/src/pages/AssignMembers.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getEmployeesByDepartment, finalizeGroup } from "../services/api.js";
import "../styles/assign-members.css";

export default function AssignMembers() {
  const params = useParams();
  // Accept either departmentName or departmentId in the URL
  const departmentNameParam = params.departmentName || params.departmentId || "";
  const navigate = useNavigate();
  const { state } = useLocation() || {};

  // From the previous step (CreateGroupButton navigate state)
  const groupName = state?.groupName || "";
  const adminId = state?.adminId || localStorage.getItem("userId");
  
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

  // selection mode: "supervisor" or "trainees"
  const [mode, setMode] = useState(null);

  // chosen members
  const [selectedSupervisor, setSelectedSupervisor] = useState(null); // single
  const [selectedTrainees, setSelectedTrainees] = useState([]); // array

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Guard: if user refreshes and there was no state, push them back to Dept page
  useEffect(() => {
    // If required information is missing and there's no way to proceed, redirect back
    // but only when we have an identifier to go back to. Otherwise show an error.
    if ((!groupName || !departmentName || !adminId) && departmentNameParam) {
      navigate(`/admin/departments/${encodeURIComponent(departmentNameParam)}/details`);
    }
  }, [groupName, departmentName, adminId, navigate, departmentNameParam]);

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

    if (!groupName?.trim()) {
      setErrorMsg("Please provide a group name.");
      return;
    }
    if (!selectedSupervisor?._id) {
      setErrorMsg("Please assign a supervisor.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        groupName,
        departmentName,          // we’re using name (backend will resolve _id)
        adminId,
        supervisorId: selectedSupervisor._id,
        traineeIds: selectedTrainees.map(t => t._id),
      };

      const res = await finalizeGroup(payload);
      // Success UX
      alert("Group created successfully!");
      // Go back to department details
      navigate(`/admin/departments/${encodeURIComponent(departmentName)}/details`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="assign-container">
      <div className="assign-header">
        <div className="assign-header-left">
          <div className="breadcrumbs">
            Departments / {departmentName} / Assign Members
          </div>
          <h2 className="assign-title">{groupName || "New Group"}</h2>
        </div>

        <div className="assign-actions">
          <button
            className={`btn ${mode === "supervisor" ? "btn-dark" : "btn-light"}`}
            onClick={() => setMode(mode === "supervisor" ? null : "supervisor")}
          >
            {mode === "supervisor" ? "✓" : "👨‍💼"} Assign Supervisor
          </button>
          <button
            className={`btn ${mode === "trainees" ? "btn-dark" : "btn-light"}`}
            onClick={() => setMode(mode === "trainees" ? null : "trainees")}
          >
            {mode === "trainees" ? "✓" : "👥"} Add Trainees
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSubmitGroup}
            disabled={submitting}
            title="Creates the group with selected supervisor & trainees"
          >
            {submitting ? "⏳ Submitting..." : "🚀 Submit Group"}
          </button>
        </div>
      </div>

      {/* Selection summary */}
      <section className="summary-card">
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>
          📋 Group Assignment Summary
        </h3>
        <div className="summary-row">
          <div><b>Group:</b> <span style={{ color: '#1e40af', fontWeight: '600' }}>{groupName}</span></div>
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
              <span className="muted">❌ None selected</span>
            )}
          </div>
          <div>
            <b>Trainees:</b>{" "}
            {selectedTrainees.length ? (
              <span style={{ color: '#059669', fontWeight: '600' }}>
                👥 {selectedTrainees.length} selected: {selectedTrainees.map(t => `${t.fname} ${t.lname}`).join(", ")}
              </span>
            ) : (
              <span className="muted">❌ None selected</span>
            )}
          </div>
        </div>
      </section>

      {/* Search + Table */}
      <section className="table-card">
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>
          👥 Available Employees
        </h3>
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="🔍 Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
    </div>
  );
}
