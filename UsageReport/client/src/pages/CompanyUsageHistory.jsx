import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/dashboard.css';
import '../styles/UsagePage.css';

export default function CompanyUsageHistory() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Fetch companies data from Atlas database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log('Fetching companies from API...');
        const response = await fetch('/api/registration-requests/companies-with-status');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Result:', result);
        
        if (result.success && result.data && Array.isArray(result.data)) {
          console.log('Processed companies data:', result.data);
          setCompanies(result.data);
          setFilteredCompanies(result.data);
        } else {
          console.error('Invalid API response structure:', result);
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
      <div className="company-usage-history">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-root${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="main">
        <Topbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        
        <div className="company-usage-history">
          <div className="page-header">
            <p className="total-count">
              Total Companies: {companies.length}
            </p>
          </div>

          <div className="companies-table-container">
        <table className="companies-table">
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
                  <div className="company-info">
                    <div className="company-icon">🏢</div>
                    <div className="company-details">
                      <div className="company-name">{company.companyName}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="date-field">
                    {company.createdAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="date-field">
                    {company.submittedAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="date-field">
                    {company.reviewedAt || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className="reviewer-field">
                    {company.reviewedBy || 'N/A'}
                  </div>
                </td>
                <td>
                  <div className={`status-badge status-${(company.status || 'pending').toLowerCase()}`}>
                  
                    {formatStatus(company.status || 'Pending')}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCompanies.length === 0 && !loading && (
        <div className="no-results">
          <p>No companies found matching your search criteria.</p>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}