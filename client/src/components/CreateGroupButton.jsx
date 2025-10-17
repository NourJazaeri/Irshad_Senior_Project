// client/src/components/CreateGroupButton.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/modal.css";

function CreateGroupButton({ departmentName, departmentId, adminId }) {
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    // Close modal
    setShowModal(false);

    // Choose which identifier to use in the URL (prefer id when available)
    const identifier = departmentId || departmentName || "";
    const encoded = encodeURIComponent(identifier);
    navigate(`/departments/${encoded}/assign-members`, {
      state: { groupName, departmentName, departmentId, adminId },
    });

  };

  return (
    <>
      <button className="button-primary" onClick={() => setShowModal(true)}>
        + Create Group
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Group</h3>
            <form onSubmit={handleNext}>
              <label>Group Name:</label>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="next-btn">
                  Next → Assign Members
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateGroupButton;
