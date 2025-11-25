import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEmployees, fetchTrainees, fetchSupervisors } from '../services/api';

export default function UserManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('employees');
  const [data, setData] = useState({
    employees: [],
    trainees: [],
    supervisors: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authStatus, setAuthStatus] = useState(null);
  // Pagination state
  const [page, setPage] = useState({ employees: 1, trainees: 1, supervisors: 1 });
  // Search state
  const [searchTerm, setSearchTerm] = useState({ employees: '', trainees: '', supervisors: '' });
  const rowsPerPage = 15; // Show 15 names per page for better scrollability

  // Simple authentication check
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setAuthStatus({ success: false, message: 'No authentication token found' });
        return false;
      }

      setAuthStatus({ success: true, message: 'Authentication successful' });
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthStatus({ success: false, message: error.message });
      return false;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      setError('Authentication failed. Please log in as an Admin.');
      setLoading(false);
      return;
    }

    try {
      console.log('=== UserManagement: Fetching all user data ===');
      
      const [employeesRes, traineesRes, supervisorsRes] = await Promise.all([
        fetchEmployees(),
        fetchTrainees(),
        fetchSupervisors()
      ]);

      console.log('=== UserManagement: API Responses ===', {
        employees: employeesRes,
        trainees: traineesRes,
        supervisors: supervisorsRes
      });

      // Debug: Log the actual response structure
      console.log('=== DEBUGGING API RESPONSES ===');
      console.log('Employees response:', employeesRes);
      console.log('Employees success:', employeesRes?.success);
      console.log('Employees data:', employeesRes?.data);
      console.log('Employees count:', employeesRes?.count);

      const employeesData = employeesRes.success ? employeesRes.data || [] : [];
      const traineesData = traineesRes.success ? traineesRes.data || [] : [];
      const supervisorsData = supervisorsRes.success ? supervisorsRes.data || [] : [];
      
      // Debug: Log department information
      console.log('=== DEBUGGING DEPARTMENT DATA ===');
      if (traineesData.length > 0) {
        console.log('Sample trainee:', {
          email: traineesData[0].loginEmail,
          empObjectUserID: traineesData[0].EmpObjectUserID?._id,
          department: traineesData[0].EmpObjectUserID?.ObjectDepartmentID,
          departmentName: traineesData[0].EmpObjectUserID?.ObjectDepartmentID?.departmentName
        });
      }
      if (supervisorsData.length > 0) {
        console.log('Sample supervisor:', {
          email: supervisorsData[0].loginEmail,
          empObjectUserID: supervisorsData[0].EmpObjectUserID?._id,
          department: supervisorsData[0].EmpObjectUserID?.ObjectDepartmentID,
          departmentName: supervisorsData[0].EmpObjectUserID?.ObjectDepartmentID?.departmentName
        });
      }

      setData({
        employees: employeesData,
        trainees: traineesData,
        supervisors: supervisorsData
      });

      // Check for any errors
      const errors = [];
      if (!employeesRes.success) errors.push(`Employees: ${employeesRes.message}`);
      if (!traineesRes.success) errors.push(`Trainees: ${traineesRes.message}`);
      if (!supervisorsRes.success) errors.push(`Supervisors: ${supervisorsRes.message}`);
      
      if (errors.length > 0) {
        setError(errors.join('; '));
      }

    } catch (err) {
      console.error('=== UserManagement: Error fetching data ===', err);
      setError(`Failed to fetch user data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const renderTable = (users, type) => {
    if (loading) return (
      <div className="loading-state" style={{ padding: '40px' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading users...</p>
      </div>
    );
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!users || users.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '40px' }}>
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p>No {type} found</p>
        </div>
      );
    }

    // Filter users based on search term
    const currentSearchTerm = searchTerm[type] || '';
    const filteredUsers = users.filter(user => {
      if (!currentSearchTerm) return true;
      
      let name, position, department;
      if (type === 'employees') {
        name = `${user.fname || ''} ${user.lname || ''}`.toLowerCase();
        position = (user.position || '').toLowerCase();
        department = (user.ObjectDepartmentID?.departmentName || user.ObjectDepartmentID || '').toString().toLowerCase();
      } else {
        name = `${user.EmpObjectUserID?.fname || ''} ${user.EmpObjectUserID?.lname || ''}`.toLowerCase();
        position = (user.EmpObjectUserID?.position || '').toLowerCase();
        department = (user.EmpObjectUserID?.ObjectDepartmentID?.departmentName || user.EmpObjectUserID?.ObjectDepartmentID || '').toString().toLowerCase();
      }
      
      const searchLower = currentSearchTerm.toLowerCase();
      return name.includes(searchLower) || position.includes(searchLower) || department.includes(searchLower);
    });

    // Pagination logic
    const currentPage = page[type] || 1;
    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const pagedUsers = filteredUsers.slice(startIdx, endIdx);
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

    // Reset page to 1 if current page is beyond total pages
    if (currentPage > totalPages && totalPages > 0) {
      setPage(p => ({ ...p, [type]: 1 }));
    }

    const tableStyle = {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '10px',
      height: '100%',
      overflowY: 'auto',
      display: 'block'
    };

    const tbodyStyle = {
      display: 'block',
      height: '100%',
      overflowY: 'auto',
      width: '100%'
    };

    const theadStyle = {
      display: 'table',
      width: '100%',
      tableLayout: 'fixed'
    };

    // Always link to employee details page for all user types
    return (
      <>
        {/* Authentication Status */}
        {authStatus && !authStatus.success && (
          <div style={{ 
            padding: '15px', 
            marginBottom: '20px', 
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Authentication Status:</strong> {authStatus.message}
          </div>
        )}

        {/* Search Bar */}
        <div className="enhanced-card fade-in-up delay-0" style={{ marginBottom: '20px', marginTop: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${type} by name, position, or department...`}
            value={searchTerm[type] || ''}
            onChange={(e) => {
              setSearchTerm(prev => ({ ...prev, [type]: e.target.value }));
              setPage(prev => ({ ...prev, [type]: 1 })); // Reset to page 1 when searching
            }}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'transparent'
            }}
          />
          {searchTerm[type] && (
            <button
              onClick={() => {
                setSearchTerm(prev => ({ ...prev, [type]: '' }));
                setPage(prev => ({ ...prev, [type]: 1 }));
              }}
              className="btn-enhanced-secondary"
              style={{
                padding: '10px 15px',
                borderRadius: '8px',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#e9ecef';
                e.target.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#f8f9fa';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Results info */}
        {searchTerm[type] && (
          <div style={{ marginBottom: '15px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
            Found {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for "{searchTerm[type]}"
          </div>
        )}

        <div className="enhanced-card fade-in-up delay-1" style={{ overflow: 'hidden', borderRadius: '12px' }}>
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Name
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>
                <svg width="16" height="16" fill="none" stroke="#2563eb" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>
                <svg width="16" height="16" fill="none" stroke="#2563eb" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Position
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#1f2937' }}>
                <svg width="16" height="16" fill="none" stroke="#2563eb" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Department
              </th>
            </tr>
          </thead>
          <tbody style={tbodyStyle}>
            {pagedUsers.map((user, index) => {
              let employeeId, fname, lname, email, position, department;
              if (type === 'employees') {
                employeeId = user._id;
                fname = user.fname;
                lname = user.lname;
                email = user.email;
                position = user.position;
                // Get department from ObjectDepartmentID (can be populated object or just ID)
                if (user.ObjectDepartmentID) {
                  department = typeof user.ObjectDepartmentID === 'object' 
                    ? user.ObjectDepartmentID.departmentName 
                    : user.ObjectDepartmentID;
                } else {
                  department = null;
                }
              } else {
                employeeId = user.EmpObjectUserID?._id || user.EmpObjectUserID;
                fname = user.EmpObjectUserID?.fname || 'N/A';
                lname = user.EmpObjectUserID?.lname || '';
                email = user.loginEmail || user.EmpObjectUserID?.email || 'N/A';
                position = user.EmpObjectUserID?.position || 'N/A';
                // Get department from EmpObjectUserID.ObjectDepartmentID (can be populated object or just ID)
                if (user.EmpObjectUserID?.ObjectDepartmentID) {
                  const dept = user.EmpObjectUserID.ObjectDepartmentID;
                  department = typeof dept === 'object' && dept !== null
                    ? dept.departmentName 
                    : dept;
                } else {
                  department = null;
                }
              }
              return (
                <tr 
                  key={employeeId || index}
                  className="fade-in-up"
                  onClick={() => {
                    if (employeeId) {
                      navigate(`/admin/employees/${employeeId}?from=${type}`);
                    }
                  }}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb', 
                    display: 'table', 
                    width: '100%', 
                    tableLayout: 'fixed',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'transparent',
                    animationDelay: `${index * 0.05}s`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{ padding: '12px', color: '#333' }}>
                    <Link 
                      to={employeeId ? `/admin/employees/${employeeId}?from=${type}` : '#'}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
                      onMouseOver={(e) => e.target.style.color = '#0056b3'}
                      onMouseOut={(e) => e.target.style.color = '#007bff'}
                    >
                      {fname} {lname}
                    </Link>
                  </td>
                  <td style={{ padding: '12px', color: '#333', transition: 'color 0.2s ease' }}>{email}</td>
                  <td style={{ padding: '12px', color: '#333', transition: 'color 0.2s ease' }}>{position}</td>
                  <td style={{ padding: '12px', color: '#333', transition: 'color 0.2s ease' }}>
                    {department || <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setPage(p => ({ ...p, [type]: Math.max(1, currentPage - 1) }))} 
            disabled={currentPage === 1}
            className={currentPage === 1 ? '' : 'btn-enhanced-secondary'}
            style={{ 
              marginRight: 8, 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              background: currentPage === 1 ? '#f3f4f6' : '#fff', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 500, padding: '0 16px' }}>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => ({ ...p, [type]: Math.min(totalPages, currentPage + 1) }))} 
            disabled={currentPage === totalPages}
            className={currentPage === totalPages ? '' : 'btn-enhanced-secondary'}
            style={{ 
              marginLeft: 8, 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              background: currentPage === totalPages ? '#f3f4f6' : '#fff', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </>
    );
  };

  const tabs = [
    { id: 'employees', label: 'Employees', count: data.employees.length },
    { id: 'trainees', label: 'Trainees', count: data.trainees.length },
    { id: 'supervisors', label: 'Supervisors', count: data.supervisors.length }
  ];

  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    }}>
        {/* Tab Navigation (clean, single bar) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderBottom: '2px solid #e5e7eb',
          background: 'white',
          padding: '0 24px',
          minHeight: '56px',
          borderRadius: '12px 12px 0 0',
          margin: '-20px -20px 20px -20px',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#eaf4ff' : 'transparent',
                color: activeTab === tab.id ? '#1976d2' : '#333',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid #1976d2' : '3px solid transparent',
                fontWeight: 600,
                fontSize: '1.1rem',
                padding: '16px 32px',
                cursor: 'pointer',
                outline: 'none',
                borderRadius: '8px 8px 0 0',
                marginRight: 8,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = '#f0f4ff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {tab.label}
              <span style={{ color: '#888', fontWeight: 400, marginLeft: 6 }}>({tab.count})</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '8px' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: '#333', 
            margin: 0,
            textTransform: 'capitalize',
            lineHeight: 1.1
          }}>
            {activeTab}
          </h2>
          <span style={{ color: '#666', fontSize: '1rem', fontWeight: 400, marginBottom: 2 }}>
            {activeTab === 'employees' 
              ? 'List of all employees in the organization'
              : `List of all ${activeTab} with login credentials`
            }
          </span>
        </div>
        {renderTable(data[activeTab], activeTab)}
    </div>
  );
}