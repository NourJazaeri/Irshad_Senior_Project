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
    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
    if (!users || users.length === 0) {
      return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No {type} found</div>;
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
        <div style={{ marginBottom: '20px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#007bff';
              e.target.style.boxShadow = '0 2px 8px rgba(0,123,255,0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#ddd';
              e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            }}
            onMouseEnter={(e) => {
              if (document.activeElement !== e.target) {
                e.target.style.borderColor = '#c0c0c0';
              }
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.target) {
                e.target.style.borderColor = '#ddd';
              }
            }}
          />
          {searchTerm[type] && (
            <button
              onClick={() => {
                setSearchTerm(prev => ({ ...prev, [type]: '' }));
                setPage(prev => ({ ...prev, [type]: 1 }));
              }}
              style={{
                padding: '10px 15px',
                border: 'none',
                borderRadius: '8px',
                background: '#f8f9fa',
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
          <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            Found {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} for "{searchTerm[type]}"
          </div>
        )}

        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Position</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Department</th>
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
                  onClick={() => {
                    if (employeeId) {
                      navigate(`/admin/employees/${employeeId}?from=${type}`);
                    }
                  }}
                  style={{ 
                    borderBottom: '1px solid #eee', 
                    display: 'table', 
                    width: '100%', 
                    tableLayout: 'fixed',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9ff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
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
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', alignItems: 'center' }}>
          <button 
            onClick={() => setPage(p => ({ ...p, [type]: Math.max(1, currentPage - 1) }))} 
            disabled={currentPage === 1} 
            style={{ 
              marginRight: 8, 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: '1px solid #ccc', 
              background: currentPage === 1 ? '#eee' : '#fff', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.target.style.background = '#007bff';
                e.target.style.color = 'white';
                e.target.style.borderColor = '#007bff';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = currentPage === 1 ? '#eee' : '#fff';
              e.target.style.color = currentPage === 1 ? '#999' : 'inherit';
              e.target.style.borderColor = '#ccc';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', fontWeight: 500, padding: '0 16px' }}>Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setPage(p => ({ ...p, [type]: Math.min(totalPages, currentPage + 1) }))} 
            disabled={currentPage === totalPages} 
            style={{ 
              marginLeft: 8, 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: '1px solid #ccc', 
              background: currentPage === totalPages ? '#eee' : '#fff', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.target.style.background = '#007bff';
                e.target.style.color = 'white';
                e.target.style.borderColor = '#007bff';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = currentPage === totalPages ? '#eee' : '#fff';
              e.target.style.color = currentPage === totalPages ? '#999' : 'inherit';
              e.target.style.borderColor = '#ccc';
              e.target.style.transform = 'scale(1)';
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
      background: '#f9fafc',
      border: '1px solid #e2e6ef',
      borderRadius: '10px',
      padding: '40px 20px',
      margin: '10px 8px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
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
          borderRadius: '16px 16px 0 0',
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

        {/* Table container follows below */}
        <div style={{
          padding: '32px',
          background: 'white',
          borderRadius: '0 0 16px 16px',
        }}>
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
    </div>
  );
}