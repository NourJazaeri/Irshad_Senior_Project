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
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
        onClick={() => setShowModal(true)}
      >
        + Create Group
      </button>

      {/* --- Popup Modal --- */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#fff',
            padding: '32px',
            borderRadius: '16px',
            width: '600px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e5e7eb',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{
              marginBottom: '20px',
              fontWeight: '700',
              color: '#111827',
              fontSize: '20px'
            }}>
              Create New Group
            </h3>
            <form onSubmit={handleNext}>
              <input
                type="text"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  marginBottom: '20px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#f3f4f6',
                    color: '#111827',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.background = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}
                >
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
