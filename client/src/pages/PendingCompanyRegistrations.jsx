import { useEffect, useState } from 'react';
import '../styles/owner-components.css';

const API = import.meta.env.VITE_API || 'http://localhost:5000';

export default function PendingCompanyRegistrations() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const load = async (status = activeTab) => {
    try {
      // Try new API endpoint first
      console.log(`🔄 Loading ${status} requests from: ${API}/api/webowner/request-management?status=${status}`);
      let res = await fetch(`${API}/api/webowner/request-management?status=${status}`);
      
      if (!res.ok) {
        console.log('❌ New endpoint failed, trying old endpoint...');
        // Fallback to old endpoint
        res = await fetch(`${API}/api/company-registration-forms?status=${status}`);
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
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to perform this action.');
        return;
      }

      const res = await fetch(`${API}/api/webowner/request-management/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Request failed');
      }
      
      await load();
      alert(`${verb}d successfully.`);
    } catch (e) {
      console.error(`${verb} error:`, e);
      alert(`${verb} failed: ${e.message}. Please try again.`);
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
              <div className="meta-line">
                <span className="meta-label">Admin:</span> {a.email || a.loginEmail || a.LoginEmail || 'N/A'}
              </div>
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
            <div className="details-section">
              <h4>Company Information</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Company Name:</span>
                  <span className="detail-value">{c.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CRN:</span>
                  <span className="detail-value">{c.CRN || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tax Number:</span>
                  <span className="detail-value">{c.taxNo || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Industry:</span>
                  <span className="detail-value">{c.industry}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Company Size:</span>
                  <span className="detail-value">{c.size} employees</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Branches:</span>
                  <span className="detail-value">{c.branches || '-'}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{c.description || '-'}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="detail-label">LinkedIn:</span>
                  <span className="detail-value">
                    {c.linkedIn ? (
                      <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" className="detail-link">
                        {c.linkedIn}
                      </a>
                    ) : '-'}
                  </span>
                </div>
                {c.logoUrl && (
                  <div className="detail-item full-width logo-item">
                    <span className="detail-label">Company Logo:</span>
                    <div className="logo-container">
                      <img
                        src={`${API}${c.logoUrl}`}
                        alt="Company Logo"
                        className="company-logo"
                      />
                    </div>
                  </div>
                )}
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
    <div className="wo-details-container" style={{ maxWidth: '100%', padding: '0 16px' }}>
      {/* Main Container Card */}
      <div className="wo-details-card" style={{ padding: '32px', marginBottom: '24px', width: '100%' }}>
      {/* Tabs */}
        <div className="wo-tabs">
        <button 
            className={`wo-tab ${activeTab === 'pending' ? 'wo-tab--active' : ''}`}
          data-status="pending"
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button 
            className={`wo-tab ${activeTab === 'approved' ? 'wo-tab--active' : ''}`}
          data-status="approved"
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
            className={`wo-tab ${activeTab === 'rejected' ? 'wo-tab--active' : ''}`}
          data-status="rejected"
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
      </div>

      {items.length === 0 ? (
          <div className="reg-meta" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No {activeTab} requests.</div>
      ) : (
        <div className="reg-list">
          {items.map((r) => (
            <Card key={r._id} req={r} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
