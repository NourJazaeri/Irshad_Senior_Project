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
  // If state contains departmentName (preferred), use it; otherwise fall back
  const departmentName = state?.departmentName || departmentNameParam;

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
      navigate(`/departments/${encodeURIComponent(departmentNameParam)}/details`);
    }
  }, [groupName, departmentName, adminId, navigate, departmentNameParam]);

  // Load employees of this department
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
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
      navigate(`/departments/${encodeURIComponent(departmentName)}/details`);
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
        <div>
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
            Assign Supervisor
          </button>
          <button
            className={`btn ${mode === "trainees" ? "btn-dark" : "btn-light"}`}
            onClick={() => setMode(mode === "trainees" ? null : "trainees")}
          >
            Add Trainees
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSubmitGroup}
            disabled={submitting}
            title="Creates the group with selected supervisor & trainees"
          >
            {submitting ? "Submitting..." : "Submit Group"}
          </button>
        </div>
      </div>

      {/* Selection summary */}
      <section className="summary-card">
        <div className="summary-row">
          <div><b>Group:</b> {groupName}</div>
          <div><b>Department:</b> {departmentName}</div>
        </div>
        <div className="summary-row">
          <div>
            <b>Supervisor:</b>{" "}
            {selectedSupervisor
              ? `${selectedSupervisor.fname} ${selectedSupervisor.lname}`
              : <span className="muted">None selected</span>}
          </div>
          <div>
            <b>Trainees:</b>{" "}
            {selectedTrainees.length
              ? selectedTrainees.map(t => `${t.fname} ${t.lname}`).join(", ")
              : <span className="muted">None selected</span>}
          </div>
        </div>
      </section>

      {/* Search + Table */}
      <section className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {mode ? (
            <div className="mode-pill">
              Selecting: <b>{mode === "supervisor" ? "Supervisor (1)" : "Trainees (multi)"}</b>
            </div>
          ) : (
            <div className="muted">Choose an action to start selecting</div>
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
                  <th style={{width: 42}}></th>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted" style={{textAlign: "center"}}>
                      No employees found.
                    </td>
                  </tr>
                )}
                {filtered.map(emp => {
                  const fullName = `${emp.fname} ${emp.lname}`;
                  return (
                    <tr key={emp._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked(emp._id)}
                          onChange={() => toggleSelection(emp)}
                          disabled={!mode}
                          title={!mode ? "Choose an action above" : undefined}
                        />
                      </td>
                      <td>{fullName}</td>
                      <td>{emp.position || "-"}</td>
                      <td>{emp.phone || "-"}</td>
                      <td>{emp.email || "-"}</td>
                      <td>{emp.departmentName || "-"}</td>
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
