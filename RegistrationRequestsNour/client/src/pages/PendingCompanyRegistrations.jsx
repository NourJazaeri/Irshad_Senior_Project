import { useEffect, useState } from 'react';
import '../styles/dashboard.css';

const API = import.meta.env.VITE_API || 'http://localhost:5000';

export default function PendingCompanyRegistrations() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const load = async (status = activeTab) => {
    try {
      // Try new API endpoint first
      console.log(`🔄 Loading ${status} requests from: ${API}/api/owner/registration-requests?status=${status}`);
      let res = await fetch(`${API}/api/owner/registration-requests?status=${status}`);
      
      if (!res.ok) {
        console.log('❌ New endpoint failed, trying old endpoint...');
        // Fallback to old endpoint
        res = await fetch(`${API}/api/registration-requests?status=${status}`);
      }
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log(`📊 Received ${data.length} ${status} requests:`, data);
      setItems(Array.isArray(data) ? data : []);
      
      if (data.length === 0) {
        console.log('⚠️ No requests found. This could mean:');
        console.log('1. Database is empty');
        console.log('2. Wrong database/collection');
        console.log('3. Schema mismatch');
      }
    } catch (error) {
      console.error('❌ Error loading requests:', error);
      setItems([]);
      // Show user-friendly error
      alert(`Failed to load ${status} requests. Check if the server is running on ${API}`);
    }
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  const act = async (id, action) => {
    const verb = action === 'approve' ? 'Approve' : 'Reject';
    if (!window.confirm(`Are you sure you want to ${verb.toLowerCase()} this request?`)) return;

    setBusy(id);
    try {
      const res = await fetch(`${API}/api/owner/registration-requests/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Request failed');
      await load();
      alert(`${verb}d successfully.`);
    } catch (e) {
      alert(`${verb} failed. Please try again.`);
    } finally {
      setBusy(null);
    }
  };

  const Card = ({ req }) => {
    const c = req.application?.company || {};
    const a = req.application?.admin || {};
    const isOpen = openId === req._id;

    return (
      <div className="reg-card">
        <div className="reg-head">
          <div>
            <div className="reg-title">
              {c.name} <span className={`status status-${req.status}`}>({req.status})</span>
            </div>
            <div className="reg-meta">
              Admin: {a.email || a.loginEmail || a.LoginEmail || 'N/A'}
              <br />
              Industry: {c.industry} • Employees: {c.size}
              <br />
              Submitted: {new Date(req.submittedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="actions">
            <button className="btn" onClick={() => setOpenId(isOpen ? null : req._id)}>
              {isOpen ? 'Hide Details' : 'View Details'}
            </button>
            {req.status === 'pending' && (
              <>
                <button
                  className="btn btn-green"
                  disabled={busy === req._id}
                  onClick={() => act(req._id, 'approve')}
                >
                  {busy === req._id ? 'Approving…' : 'Approve'}
                </button>
                <button
                  className="btn btn-red"
                  disabled={busy === req._id}
                  onClick={() => act(req._id, 'reject')}
                >
                  {busy === req._id ? 'Rejecting…' : 'Reject'}
                </button>
              </>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="reg-details">
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--brand)' }}>Company Information</h4>
            <div className="grid-2">
              <div>
                <strong>CRN:</strong> {c.CRN || '-'}
              </div>
              <div>
                <strong>Tax No:</strong> {c.taxNo || '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Description:</strong> {c.description || '-'}
              </div>
              <div>
                <strong>Branches:</strong> {c.branches || '-'}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>LinkedIn:</strong> {c.linkedIn || '-'}
              </div>
              {c.logoUrl && (
                <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                  <img
                    src={`${API}${c.logoUrl}`}
                    alt="Company Logo"
                    style={{ maxHeight: 80, borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </div>
              )}
            </div>
            
            <h4 style={{ margin: '16px 0 12px 0', color: 'var(--brand)' }}>Admin Information</h4>
            <div className="grid-2">
              <div>
                <strong>Email:</strong> {a.email || a.loginEmail || a.LoginEmail || '-'}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'pending': return 'Pending Registrations';
      case 'approved': return 'Approved Registrations';
      case 'rejected': return 'Rejected Registrations';
      default: return 'Company Registrations';
    }
  };

  const getTabDescription = () => {
    switch (activeTab) {
      case 'pending': return 'Review and approve new company registrations.';
      case 'approved': return 'View all approved company registrations.';
      case 'rejected': return 'View all rejected company registrations.';
      default: return 'Review and approve new company registrations.';
    }
  };

  return (
    <>
      <section className="welcome">
        <h2>{getTabTitle()}</h2>
        <p>
          {getTabDescription()}
        </p>
      </section>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
      </div>

      {items.length === 0 ? (
        <div className="reg-meta">No {activeTab} requests.</div>
      ) : (
        <div className="reg-list">
          {items.map((r) => (
            <Card key={r._id} req={r} />
          ))}
        </div>
      )}
    </>
  );
}
