import React, { useState, useEffect } from 'react';
import { Building2, Calendar, Clock, User, CheckCircle, Search } from 'lucide-react';
import '../styles/owner-components.css';

export default function ActivityLog() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch companies data from Atlas database
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log('Fetching companies from API...');
        const response = await fetch('/api/company-registration-forms');
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
            let reviewedBy = '--';
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
            
            const submittedAtDate = regRequest.submittedAt ? new Date(regRequest.submittedAt) : null;
            const reviewedAtDate = regRequest.reviewedAt ? new Date(regRequest.reviewedAt) : null;
            
            return {
              _id: regRequest._id,
              companyName: companyData.name || '--',
              submittedAt: submittedAtDate ? submittedAtDate.toLocaleDateString() : '--',
              submittedAtRaw: submittedAtDate,
              reviewedAt: reviewedAtDate ? reviewedAtDate.toLocaleDateString() : '--',
              reviewedAtRaw: reviewedAtDate,
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

  // Calculate approval time (reviewedAt - submittedAt)
  const calculateApprovalTime = (submittedAt, reviewedAt) => {
    if (!submittedAt || !reviewedAt) {
      return '--';
    }

    try {
      const submitted = submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
      const reviewed = reviewedAt instanceof Date ? reviewedAt : new Date(reviewedAt);
      
      if (isNaN(submitted.getTime()) || isNaN(reviewed.getTime())) {
        return '--';
      }

      const diffMs = reviewed - submitted;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMinutes > 0 ? `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}` : ''}`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return 'Less than 1 minute';
      }
    } catch (error) {
      console.error('Error calculating approval time:', error);
      return '--';
    }
  };

  if (loading) {
    return (
      <div className="wo-page">
        <div className="wo-page-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wo-page">
      <div className="wo-page-content">
        <div className="wo-search-wrapper">
          <div className="wo-search-input-container">
            <Search className="wo-search-icon" />
            <input
              className="wo-search-input"
              placeholder="Search companies, status, or reviewer…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="wo-table-container">
          <table className="wo-table">
          <thead>
            <tr>
              <th title="The name of the company that submitted the registration request">
                <div className="wo-th-content">
                  <Building2 className="wo-th-icon" />
                  <span>Company Name</span>
                </div>
              </th>
              <th title="The date when the company registration form was submitted">
                <div className="wo-th-content">
                  <Calendar className="wo-th-icon" />
                  <span>Submitted At</span>
                </div>
              </th>
              <th title="The date when the registration request was reviewed by a web owner">
                <div className="wo-th-content">
                  <Calendar className="wo-th-icon" />
                  <span>Reviewed At</span>
                </div>
              </th>
              <th title="The time taken from submission to review">
                <div className="wo-th-content">
                  <Clock className="wo-th-icon" />
                  <span>Approval Time</span>
                </div>
              </th>
              <th title="The name of the web owner who reviewed the registration request">
                <div className="wo-th-content">
                  <User className="wo-th-icon" />
                  <span>Reviewed By</span>
                </div>
              </th>
              <th title="The current status of the registration request (Pending, Approved, or Rejected)">
                <div className="wo-th-content">
                  <CheckCircle className="wo-th-icon" />
                  <span>Status</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr key={company._id}>
                <td>
                  <div className="wo-company-name">{company.companyName}</div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {company.submittedAt || '--'}
                  </div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {company.reviewedAt || '--'}
                  </div>
                </td>
                <td>
                  <div className="wo-date-field">
                    {calculateApprovalTime(company.submittedAtRaw, company.reviewedAtRaw)}
                  </div>
                </td>
                <td>
                  <div className="wo-reviewer-field">
                    {company.reviewedBy || '--'}
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