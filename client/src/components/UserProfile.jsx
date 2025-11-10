import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Building2, Users, Shield, UserCircle } from 'lucide-react';
import { showToast } from '../utils/toast';
import '../styles/profile.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const UserProfile = ({ userRole }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    phone: '',
    email: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user || !user.id) {
        showToast('User not logged in', 'error');
        return;
      }

      const res = await fetch(`${API_BASE}/api/profile/${userRole}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setFormData({
          fname: data.profile.fname || '',
          lname: data.profile.lname || '',
          phone: data.profile.phone || '',
          email: data.profile.email || data.profile.loginEmail || ''
        });
      } else {
        showToast('Failed to load profile', 'error');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Error loading profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch(`${API_BASE}/api/profile/${userRole}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (data.success) {
        showToast('Profile updated successfully!', 'success');
        setEditing(false);
        fetchProfile();
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Error updating profile', 'error');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
      }

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await fetch(`${API_BASE}/api/profile/${userRole}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      
      if (data.success) {
        showToast('Password changed successfully!', 'success');
        setChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showToast('Error changing password', 'error');
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Personal Information */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <div className="profile-icon blue">
              <User size={24} />
            </div>
            <div>
              <h2>Personal Information</h2>
              <p>Your basic information and contact details</p>
            </div>
          </div>
        </div>

        <div className="profile-card-body">
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label>
                <User size={16} /> First Name
              </label>
              <input
                type="text"
                name="fname"
                value={formData.fname}
                onChange={handleInputChange}
                disabled={!editing}
                className="profile-input"
              />
            </div>

            <div className="profile-form-group">
              <label>
                <User size={16} /> Last Name
              </label>
              <input
                type="text"
                name="lname"
                value={formData.lname}
                onChange={handleInputChange}
                disabled={!editing}
                className="profile-input"
              />
            </div>

            {userRole !== 'WebOwner' && (
              <>
                <div className="profile-form-group">
                  <label>
                    <Phone size={16} /> Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="profile-input"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="profile-form-group">
                  <label>
                    <Briefcase size={16} /> Position <span className="read-only-badge">Read-only</span>
                  </label>
                  <input
                    type="text"
                    value={profile.position || 'N/A'}
                    disabled
                    className="profile-input read-only"
                  />
                </div>
              </>
            )}
          </div>

          <div className="profile-actions">
            {editing ? (
              <>
                <button className="btn-primary" onClick={handleSaveChanges}>
                  Save Changes
                </button>
                <button className="btn-secondary" onClick={() => {
                  setEditing(false);
                  setFormData({
                    fname: profile.fname || '',
                    lname: profile.lname || '',
                    phone: profile.phone || '',
                    email: profile.email || profile.loginEmail || ''
                  });
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                Edit Information
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account & Security */}
      <div className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-title">
            <div className="profile-icon green">
              <Shield size={24} />
            </div>
            <div>
              <h2>Account & Security</h2>
              <p>Manage your login credentials and security settings</p>
            </div>
          </div>
        </div>

        <div className="profile-card-body">
          <div className="profile-form-group">
            <label>
              <Mail size={16} /> Login Email
            </label>
            <div className="profile-email-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!editing}
                className="profile-input"
                placeholder="Enter email address"
              />
            </div>
            {!editing && (
              <p className="field-hint">This email is used for login and all notifications</p>
            )}
          </div>

          <div className="profile-actions" style={{ marginBottom: '24px' }}>
            {editing ? (
              <>
                <button className="btn-primary" onClick={handleSaveChanges}>
                  Save Email
                </button>
                <button className="btn-secondary" onClick={() => {
                  setEditing(false);
                  setFormData({
                    fname: profile.fname || '',
                    lname: profile.lname || '',
                    phone: profile.phone || '',
                    email: profile.email || profile.loginEmail || ''
                  });
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn-outline" onClick={() => setEditing(true)}>
                Edit Email
              </button>
            )}
          </div>

          <div className="password-section">
            {!changingPassword ? (
              <button className="btn-outline" onClick={() => setChangingPassword(true)}>
                <Shield size={16} /> Change Password
              </button>
            ) : (
              <div className="password-change-form">
                <h3>Change Password</h3>
                <div className="profile-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="profile-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div className="profile-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="profile-input"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="profile-actions">
                  <button className="btn-primary" onClick={handleChangePassword}>
                    Update Password
                  </button>
                  <button className="btn-secondary" onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Information */}
      {userRole !== 'WebOwner' && (
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-icon purple">
                <Building2 size={24} />
              </div>
              <div>
                <h2>System Information</h2>
                <p>Read-only information about your account</p>
              </div>
            </div>
          </div>

          <div className="profile-card-body">
            <div className="profile-form-grid">
              {profile.company && (
                <div className="profile-form-group">
                  <label>
                    <Building2 size={16} /> Company Name
                  </label>
                  <input
                    type="text"
                    value={profile.company.companyName || 'N/A'}
                    disabled
                    className="profile-input read-only"
                  />
                </div>
              )}

              {profile.group && (
                <div className="profile-form-group">
                  <label>
                    <Users size={16} /> Assigned Group
                  </label>
                  <input
                    type="text"
                    value={profile.group.groupName || 'N/A'}
                    disabled
                    className="profile-input read-only"
                  />
                </div>
              )}

              {profile.supervisor && (
                <div className="profile-form-group">
                  <label>
                    <User size={16} /> Supervisor
                  </label>
                  <input
                    type="text"
                    value={profile.supervisor || 'N/A'}
                    disabled
                    className="profile-input read-only"
                  />
                </div>
              )}

              {profile.department && userRole !== 'Admin' && (
                <div className="profile-form-group">
                  <label>
                    <Building2 size={16} /> Department
                  </label>
                  <input
                    type="text"
                    value={profile.department.departmentName || 'N/A'}
                    disabled
                    className="profile-input read-only"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
