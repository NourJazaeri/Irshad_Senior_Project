import React, { useState, useEffect } from 'react';
import '../styles/owner-components.css';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5002';

export default function ActivityLog() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch companies data from Atlas database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token'); // or however you store it

        const response = await fetch(`${API_BASE}/api/company-registration-forms`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const registrationRequests = await response.json();
        console.log('API Result:', registrationRequests);
        
        if (Array.isArray(registrationRequests)) {
          // Process registration requests into company data format
          const companiesData = registrationRequests.map(regRequest => {
            const companyData = regRequest.application?.company || {};
            const status = regRequest.status || 'pending';
            
            // Debug: Log the reviewedBy_userID data
            console.log('Debug - regRequest.reviewedBy_userID:', regRequest.reviewedBy_userID);
            console.log('Debug - typeof reviewedBy_userID:', typeof regRequest.reviewedBy_userID);
            
            // Extract reviewedBy information from populated data
            let reviewedBy = 'N/A';
            if (regRequest.reviewedBy_userID) {
              if (typeof regRequest.reviewedBy_userID === 'object') {
                // If populated, prioritize full name, fallback to email
                const fullName = `${regRequest.reviewedBy_userID.fname || ''} ${regRequest.reviewedBy_userID.lname || ''}`.trim();
                reviewedBy = fullName || regRequest.reviewedBy_userID.loginEmail || 'Web Owner';
                console.log('Debug - fullName:', fullName, 'loginEmail:', regRequest.reviewedBy_userID.loginEmail);
              } else {
                // If not populated, it's just the ID
                reviewedBy = 'Web Owner';
                console.log('Debug - reviewedBy_userID is just an ID:', regRequest.reviewedBy_userID);
              }
            } else {
              console.log('Debug - No reviewedBy_userID found');
            }
            
            return {
              _id: regRequest._id,
              companyName: companyData.name || 'N/A',
              createdAt: regRequest.createdAt ? 
                new Date(regRequest.createdAt).toLocaleDateString() : 'N/A',
              submittedAt: regRequest.submittedAt ? 
                new Date(regRequest.submittedAt).toLocaleDateString() : 'N/A',
              reviewedAt: regRequest.reviewedAt ? 
                new Date(regRequest.reviewedAt).toLocaleDateString() : 'N/A',
              reviewedBy: reviewedBy,
              status: status
            };
          });
          
          console.log('Processed companies data:', companiesData);
          setCompanies(companiesData);
          setFilteredCompanies(companiesData);
        } else {
          console.error('Invalid API response structure:', registrationRequests);
          setCompanies([]);
          setFilteredCompanies([]);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
        setFilteredCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies based on search term
  useEffect(() => {
    let filtered = companies;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.reviewedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  }, [searchTerm, companies]);

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="wo-page">
        <div className="wo-page-header">
          <h2 className="wo-h2">Activity Log</h2>
          <p className="wo-subtle">View detailed activity logs and company registration history</p>
        </div>
        <div className="wo-page-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wo-page">
      <div className="wo-page-header">
        <h2 className="wo-h2">Activity Log</h2>
        <p className="wo-subtle">View detailed activity logs and company registration history</p>
      </div>

      <div className="wo-page-content">
        <input
          className="wo-search-input"
          placeholder="Search companies…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="wo-page-stats">
          <p className="wo-subtle">Total Companies: {companies.length}</p>
        </div>

        <div className="wo-table-container">
          <table className="wo-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Created At</th>
              <th>Submitted At</th>
              <th>Reviewed At</th>
              <th>Reviewed By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr key={company._id}>
                <td>
                  <div className="wo-company-info">
                    <div className="wo-company-icon">🏢</div>
                    <div className="wo-company-details">
                      <div className="wo-company-name">{company.companyName}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {company.createdAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {company.submittedAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {company.reviewedAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="wo-reviewer-field">
                    {company.reviewedBy || 'N/A'}
                  </div>
                </td>
                <td>
                  <span className={`status status-${(company.status || 'pending').toLowerCase()}`}>
                    {formatStatus(company.status || 'Pending')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
            </table>
          </div>

        {filteredCompanies.length === 0 && !loading && (
          <div className="wo-empty">
            <p>No companies found matching your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}