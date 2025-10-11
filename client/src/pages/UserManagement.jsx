import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchEmployees, fetchTrainees, fetchSupervisors } from '../services/api';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('employees');
  const [data, setData] = useState({
    employees: [],
    trainees: [],
    supervisors: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Pagination state
  const [page, setPage] = useState({ employees: 1, trainees: 1, supervisors: 1 });
  // Search state
  const [searchTerm, setSearchTerm] = useState({ employees: '', trainees: '', supervisors: '' });
  const rowsPerPage = 4; // Show only 4 names per page

  // Remove flex container, use normal block layout
  // Fix heading/description overlap

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
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

      setData({
        employees: employeesRes.success ? employeesRes.data || [] : [],
        trainees: traineesRes.success ? traineesRes.data || [] : [],
        supervisors: supervisorsRes.success ? supervisorsRes.data || [] : []
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
      
      let name, position;
      if (type === 'employees') {
        name = `${user.fname || ''} ${user.lname || ''}`.toLowerCase();
        position = (user.position || '').toLowerCase();
      } else {
        name = `${user.EmpObjectUserID?.fname || ''} ${user.EmpObjectUserID?.lname || ''}`.toLowerCase();
        position = (user.EmpObjectUserID?.position || '').toLowerCase();
      }
      
      const searchLower = currentSearchTerm.toLowerCase();
      return name.includes(searchLower) || position.includes(searchLower);
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
        {/* Search Bar */}
        <div style={{ marginBottom: '20px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder={`Search ${type} by name or position...`}
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
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
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
                fontSize: '14px'
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
            </tr>
          </thead>
          <tbody style={tbodyStyle}>
            {pagedUsers.map((user, index) => {
              let employeeId, fname, lname, email, position;
              if (type === 'employees') {
                employeeId = user._id;
                fname = user.fname;
                lname = user.lname;
                email = user.email;
                position = user.position;
              } else {
                employeeId = user.EmpObjectUserID?._id || user.EmpObjectUserID;
                fname = user.EmpObjectUserID?.fname || 'N/A';
                lname = user.EmpObjectUserID?.lname || '';
                email = user.loginEmail || user.EmpObjectUserID?.email || 'N/A';
                position = user.EmpObjectUserID?.position || 'N/A';
              }
              return (
                <tr key={employeeId || index} style={{ borderBottom: '1px solid #eee', display: 'table', width: '100%', tableLayout: 'fixed' }}>
                  <td style={{ padding: '12px', color: '#333' }}>
                    <Link 
                      to={employeeId ? `/admin/employees/${employeeId}?from=${type}` : '#'}
                      style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
                      onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {fname} {lname}
                    </Link>
                  </td>
                  <td style={{ padding: '12px', color: '#333' }}>{email}</td>
                  <td style={{ padding: '12px', color: '#333' }}>{position}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <button onClick={() => setPage(p => ({ ...p, [type]: Math.max(1, currentPage - 1) }))} disabled={currentPage === 1} style={{ marginRight: 8, padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', background: currentPage === 1 ? '#eee' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ alignSelf: 'center', fontWeight: 500 }}>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setPage(p => ({ ...p, [type]: Math.min(totalPages, currentPage + 1) }))} disabled={currentPage === totalPages} style={{ marginLeft: 8, padding: '6px 16px', borderRadius: 4, border: '1px solid #ccc', background: currentPage === totalPages ? '#eee' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
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
    <div style={{ padding: 0, maxWidth: '100vw', margin: 0, minHeight: 'unset', background: 'none' }}>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
          Management Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '1rem' }}>
          View and manage your team members
        </p>
      </div>

      {/* Tab Navigation (clean, single bar) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '2px solid #e5e7eb',
        background: 'white',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        padding: '0 24px',
        minHeight: '56px',
        marginBottom: 0,
        maxWidth: '1600px',
        marginLeft: 'auto',
        marginRight: 'auto',
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
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {tab.label}
            <span style={{ color: '#888', fontWeight: 400, marginLeft: 6 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Table container follows below */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '0',
        maxWidth: '1600px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: 0,
        minHeight: 'unset',
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