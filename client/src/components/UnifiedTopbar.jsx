import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronDown,
  LogOut,
  User,
  Building2,
  Home,
  Users,
  Library,
  Building,
  Bell,
  UserCog,
  Building2 as BuildingOffice,
  ClipboardList,
  MessageCircle,
  Bot,
  History,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '../services/api';
import { Button } from '@/components/ui/button';
import { NotificationBell } from './NotificationBell';

// Waving hand icon - simple and clear
const WavingHand = ({ className }) => (
  <span className={className} style={{ fontSize: '1.1em', lineHeight: '1' }}>👋</span>
);

// Page title mapping
const getPageTitle = (pathname, userType) => {
  if (userType === 'admin') {
    switch (pathname) {
      case '/admin/dashboard':
        return 'Dashboard';
      case '/admin':
        return 'Departments';
      case '/admin/users':
        return 'User Management';
      case '/admin/content':
        return 'Content Library';
      case '/admin/templates':
        return 'Content Library';
      case '/admin/profile':
        return 'Company Profile';
      case '/admin/my-profile':
        return 'My Profile';
      default:
        // Check if it's a group detail page
        if (pathname.match(/^\/admin\/groups\/\d+$/)) {
          return 'Groups';
        }
        // Check if it's a department detail page
        if (pathname.startsWith('/admin/departments/')) {
          return 'Groups';
        }
        // Check if it's a content detail or view page
        if (pathname.startsWith('/admin/content/')) {
          return 'Content Library';
        }
        // Check if it's an employee details page
        if (pathname.startsWith('/admin/employees/')) {
          return 'User Management';
        }
        // Check if it's a trainee or supervisor details page
        if (pathname.startsWith('/admin/trainees/') || pathname.startsWith('/admin/supervisors/')) {
          return 'User Management';
        }
        return 'Dashboard';
    }
  } else if (userType === 'webOwner') {
    switch (pathname) {
      case '/owner':
      case '/owner/dashboard':
        return 'Dashboard';
      case '/owner/companies':
        return 'Companies';
      case '/owner/registrations':
        return 'Registrations';
      case '/owner/activity-log':
        return 'Activity Report';
      case '/owner/my-profile':
        return 'My Profile';
      default:
        // Check if it's a company details page
        if (pathname.match(/^\/owner\/companies\/[^/]+$/)) {
          return 'Companies';
        }
        return 'Platform Management';
    }
  } else if (userType === 'usageReport') {
    switch (pathname) {
      case '/reports':
        return 'Usage Reports';
      case '/reports/analytics':
        return 'Analytics';
      case '/reports/export':
        return 'Export Data';
      default:
        return 'Usage Analytics';
    }
  } else if (userType === 'supervisor') {
    switch (pathname) {
      case '/supervisor':
        return 'Dashboard';
      case '/supervisor/groups':
        return 'Groups';
      case '/supervisor/content':
        return 'Content Library';
      case '/supervisor/templates':
        return 'Templates';
      case '/supervisor/profile':
        return 'My Profile';
      case '/supervisor/my-profile':
        return 'My Profile';
      default:
        // Check if it's a group detail page
        if (pathname.startsWith('/supervisor/groups/')) {
          return 'Group Details';
        }
        return 'Dashboard';
    }
  } else if (userType === 'trainee') {
    switch (pathname) {
      case '/trainee':
      case '/trainee/':
        return 'Home';
      case '/trainee/chatbot':
        return 'AI Assistant';
      case '/trainee/todo':
        return 'To Do List';
      case '/trainee/profile':
        return 'My Profile';
      case '/trainee/my-profile':
        return 'My Profile';
      default:
        if (pathname.startsWith('/trainee/content/')) {
          return 'Content';
        }
        return 'Home';
    }
  }
  return 'Dashboard';
};

const getPageIcon = (pathname, userType) => {
  if (userType === 'admin') {
    switch (pathname) {
      case '/admin/dashboard':
        return Home;
      case '/admin':
        return BuildingOffice;
      case '/admin/users':
        return UserCog;
      case '/admin/content':
        return Library;
      case '/admin/templates':
        return Library;
      case '/admin/profile':
        return Building;
      case '/admin/my-profile':
        return User;
      default:
        // Check if it's a group detail page
        if (pathname.match(/^\/admin\/groups\/\d+$/)) {
          return BuildingOffice;
        }
        // Check if it's a department detail page
        if (pathname.startsWith('/admin/departments/')) {
          return BuildingOffice;
        }
        // Check if it's a content detail or view page
        if (pathname.startsWith('/admin/content/')) {
          return Library;
        }
        // Check if it's an employee, trainee, or supervisor details page
        if (pathname.startsWith('/admin/employees/') || pathname.startsWith('/admin/trainees/') || pathname.startsWith('/admin/supervisors/')) {
          return UserCog;
        }
        return Home;
    }
  } else if (userType === 'webOwner') {
    switch (pathname) {
      case '/owner':
      case '/owner/dashboard':
        return Home;
      case '/owner/companies':
        return Building2;
      case '/owner/registrations':
        return UserCog;
      case '/owner/activity-log':
        return History;
      case '/owner/my-profile':
        return User;
      default:
        return Home;
    }
  } else if (userType === 'supervisor') {
    switch (pathname) {
      case '/supervisor':
        return Home;
      case '/supervisor/groups':
        return Users;
      case '/supervisor/content':
        return Library;
      case '/supervisor/templates':
        return Library;
      case '/supervisor/profile':
        return User;
      case '/supervisor/my-profile':
        return User;
      default:
        // Check if it's a group detail page
        if (pathname.startsWith('/supervisor/groups/')) {
          return Users;
        }
        return Home;
    }
  } else if (userType === 'trainee') {
    switch (pathname) {
      case '/trainee':
      case '/trainee/':
        return Home;
      case '/trainee/chatbot':
        return Bot;
      case '/trainee/todo':
        return ClipboardList;
      case '/trainee/profile':
        return User;
      case '/trainee/my-profile':
        return User;
      default:
        if (pathname.startsWith('/trainee/content/')) {
          return Library;
        }
        return Home;
    }
  }
  return Home;
};

export const UnifiedTopbar = ({ 
  userType = 'admin',
  companyName = 'Your Company',
  onMobileMenuToggle = () => {},
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    companyName: ''
  });
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const logoImgRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname, userType);
  const PageIcon = getPageIcon(location.pathname, userType);

  // Get username for trainee, supervisor, or webOwner from localStorage and API
  useEffect(() => {
    if (userType === 'trainee' || userType === 'supervisor' || userType === 'webOwner') {
      const fetchUserName = async () => {
        try {
          // First try to get from localStorage for immediate display
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            if (userData.firstName) {
              setUserName(userData.firstName);
            } else if (userData.email) {
              // Format email into display name: "ziad.alotaibi@..." -> "Ziad Alotaibi"
              const namePart = userData.email.split('@')[0];
              const formattedName = namePart.split('.')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
              setUserName(formattedName);
            }
          }

          // Then fetch from API for more accurate data
          const token = localStorage.getItem('token');
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
          
          const endpoint = userType === 'trainee' ? '/api/trainee/me' : 
                          userType === 'supervisor' ? '/api/supervisor/me' : 
                          '/api/webowner/me';
          
          const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const userData = userType === 'trainee' ? data.trainee : 
                            userType === 'supervisor' ? data.supervisor : 
                            data.webOwner;
            
            // Check both data.success and data.ok for API response format
            if ((data.success || data.ok) && userData) {
              const firstName = userData.firstName || '';
              const lastName = userData.lastName || '';
              
              // For webOwner, use full name if available, otherwise empty (don't use email fallback)
              if (userType === 'webOwner') {
                const fullName = `${firstName} ${lastName}`.trim();
                setUserName(fullName || firstName || '');
              } else {
                // For trainee/supervisor, use full name or formatted email
                const displayName = `${firstName} ${lastName}`.trim() || 
                  (userData.email ? userData.email.split('@')[0].split('.').map(part => 
                    part.charAt(0).toUpperCase() + part.slice(1)
                  ).join(' ') : (userType === 'trainee' ? 'Trainee' : 'Supervisor'));
                setUserName(displayName);
              }
            } else if (userData && (userData.firstName || userData.lastName)) {
              // Fallback: if userData exists but data.success/ok is false, still use the name
              const firstName = userData.firstName || '';
              const lastName = userData.lastName || '';
              if (userType === 'webOwner') {
                setUserName(`${firstName} ${lastName}`.trim() || firstName || '');
              } else {
                setUserName(`${firstName} ${lastName}`.trim() || (userData.email ? userData.email.split('@')[0] : ''));
              }
            }
          }
        } catch (e) {
          console.error(`Error fetching ${userType} name:`, e);
          // Keep localStorage value if API fails, or set default
          const storedUser = localStorage.getItem('user');
          if (!storedUser) {
            setUserName(userType === 'trainee' ? 'Trainee' : userType === 'supervisor' ? 'Supervisor' : 'Web Owner');
          }
        }
      };

      fetchUserName();
    }
  }, [userType]);

  // Fetch admin data from employee table (for admin) or profile API (for webOwner/trainee/supervisor)
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
        if (userType === 'admin') {
          // Fetch admin profile data
          const response = await fetch(`${API_BASE}/api/company-profile/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data.ok && data.admin) {
              const adminFirstName = data.admin.firstName || 'Admin';
              const adminLastName = data.admin.lastName || 'User';
              const fullName = `${adminFirstName} ${adminLastName}`.trim();
              setAdminData({
                firstName: adminFirstName,
                lastName: adminLastName,
                name: fullName || 'Admin',
                email: data.admin.email || 'admin@company.com',
                companyName: data.company?.name || 'Your Company'
              });
              // Set userName for admin welcome message
              setUserName(fullName);
            }
          }
        } else if (userType === 'webOwner' || userType === 'trainee' || userType === 'supervisor') {
          // Fetch profile data for webOwner/trainee/supervisor (same as sidebar)
          const endpoints = {
            'trainee': '/api/trainee/me',
            'supervisor': '/api/supervisor/me',
            'webOwner': '/api/webowner/me'
          };
          const endpoint = endpoints[userType];
          
          const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const profileMap = {
              'trainee': data.trainee,
              'supervisor': data.supervisor,
              'webOwner': data.webOwner
            };
            const profile = profileMap[userType];
            
            if ((data.ok || data.success) && profile) {
              const firstName = profile.firstName || '';
              const lastName = profile.lastName || '';
              
              console.log(`✅ ${userType} - Fetched profile:`, { firstName, lastName, email: profile.email });
              
              setAdminData({
                firstName: firstName,
                lastName: lastName,
                name: `${firstName} ${lastName}`.trim() || firstName,
                email: profile.email || ''
              });
              
              // Also update userName for welcome message
              if (userType === 'webOwner') {
                const fullName = `${firstName} ${lastName}`.trim() || firstName;
                console.log(`✅ webOwner - Setting userName to:`, fullName);
                setUserName(fullName || '');
              } else {
                const displayName = `${firstName} ${lastName}`.trim() || 
                  (profile.email ? profile.email.split('@')[0].split('.').map(part => 
                    part.charAt(0).toUpperCase() + part.slice(1)
                  ).join(' ') : '');
                setUserName(displayName);
              }
            } else {
              console.warn(`⚠️ ${userType} - Profile data missing or invalid:`, { data, profile });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Keep default values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [userType]);

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      // Reset chatbot conversation on logout (before clearing token)
      try {
        const { resetChatbot } = await import('../services/api');
        await resetChatbot();
      } catch (chatbotError) {
        console.warn('Failed to reset chatbot on logout:', chatbotError);
        // Continue with logout even if chatbot reset fails
      }
      
      if (sessionId) {
        await logoutUser(sessionId);
      }

      // Clear JWT and session data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
      
      // Clear chatbot conversation from sessionStorage
      sessionStorage.removeItem("chatbot_conversation");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
      sessionStorage.removeItem("chatbot_conversation");
      navigate("/login");
    }
  };

  // Trim transparent padding from company logo once it loads
  const handleLogoLoad = () => {
    const img = logoImgRef.current;
    if (!img) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let top = 0, left = 0, right = width, bottom = height;
      const isRowTransparent = (y) => {
        for (let x = 0; x < width; x++) {
          if (data[(y * width + x) * 4 + 3] !== 0) return false; // alpha channel
        }
        return true;
      };
      const isColTransparent = (x) => {
        for (let y = 0; y < height; y++) {
          if (data[(y * width + x) * 4 + 3] !== 0) return false;
        }
        return true;
      };

      while (top < bottom && isRowTransparent(top)) top++;
      while (bottom - 1 > top && isRowTransparent(bottom - 1)) bottom--;
      while (left < right && isColTransparent(left)) left++;
      while (right - 1 > left && isColTransparent(right - 1)) right--;

      const cropW = Math.max(1, right - left);
      const cropH = Math.max(1, bottom - top);
      const out = document.createElement('canvas');
      out.width = cropW;
      out.height = cropH;
      out.getContext('2d').drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
      img.src = out.toDataURL('image/png');
    } catch (e) {
      // If cross-origin or other errors happen, silently ignore
      // and keep original image
    }
  };

  return (
    <header className={cn(
      "bg-blue-50 border-b border-blue-200 shadow-sm w-full sticky top-0 z-50 font-sans antialiased",
      className
    )} style={{ width: '100%' }}>
      <div className="flex items-center justify-between px-4 lg:px-12 py-6 min-h-[80px] w-full">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-blue-100 transition-colors mr-3"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-primary" />
        </button>
        {/* Left: Page Title with Icon */}
        <div className="flex gap-4 items-start">
          <PageIcon className="w-8 h-8 text-primary flex-shrink-0" style={{ 
            marginTop: '0.5rem'
          }} />
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-wide text-foreground leading-tight m-0">
              {pageTitle}
            </h1>
            {(userType === 'trainee' || userType === 'supervisor' || userType === 'admin' || userType === 'webOwner') && (pageTitle === 'Dashboard' || pageTitle === 'Home') && (() => {
              // Determine display name based on user type
              let displayName = '';
              if (userType === 'webOwner') {
                // For webOwner, use adminData (fetched from API) or userName as fallback
                const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
                displayName = fullName || adminData.firstName || userName || '';
              } else if (userType === 'admin') {
                // For admin, use adminData
                const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
                displayName = fullName || adminData.firstName || 'Admin';
              } else {
                // For trainee/supervisor, use userName or adminData
                displayName = userName || (adminData.firstName && adminData.lastName 
                  ? `${adminData.firstName} ${adminData.lastName}`.trim() 
                  : adminData.firstName || 'User');
              }
              
              // Only show welcome message if we have a name
              return displayName ? (
                <p className="text-sm text-gray-600 mt-1 font-medium flex items-center gap-1.5">
                  <span>Welcome, {displayName}</span>
                  <WavingHand style={{ display: 'inline-block', marginLeft: '2px' }} />
                </p>
              ) : null;
            })()}
          </div>
        </div>

        {/* Right: Notification Bell (for trainees and supervisors) and Company Logo */}
        <div className="flex items-center gap-4">
          {/* Notification Bell for Trainees and Supervisors */}
          {(userType === 'trainee' || userType === 'supervisor') && (
            <div>
              <NotificationBell userType={userType} />
            </div>
          )}

          {/* Company Logo (bigger, crisper) */}
          <div className="h-24 w-auto flex items-center justify-center overflow-visible">
            <img
              ref={logoImgRef}
              src="/logos/majestic-logo.png"
              alt="Company"
              className="h-24 w-56 object-contain drop-shadow-sm"
              onLoad={handleLogoLoad}
              onError={(e)=>{ e.currentTarget.style.display='none'; }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default UnifiedTopbar;
