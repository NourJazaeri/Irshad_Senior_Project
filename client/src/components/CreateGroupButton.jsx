import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/modal.css";

function CreateGroupButton({ departmentName, adminId }) {
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const navigate = useNavigate();

  const handleNext = (e) => {
    e.preventDefault(); // ✅ prevents the form from refreshing the page

    if (!groupName.trim()) {
      alert("Please enter a group name.");
      return;
    }

    setShowModal(false); // ✅ close the popup

    // ✅ Navigate to Assign Members page
    navigate(`/admin/departments/${encodeURIComponent(departmentName)}/assign-members`, {
      state: { groupName, departmentName, adminId },
    });
  };

  return (
    <>
      {/* --- Create Button --- */}
      <button className="button-primary" onClick={() => setShowModal(true)}>
        + Create Group
      </button>

      {/* --- Popup Modal --- */}
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

                {/* ✅ This button triggers the handleNext onSubmit */}
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
