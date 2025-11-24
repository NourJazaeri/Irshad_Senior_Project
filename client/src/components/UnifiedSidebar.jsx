import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Library, 
  FileText, 
  Building2, 
  User, 
  Menu,
  LogOut,
  Settings,
  BarChart3,
  ClipboardList,
  Building,
  UserCog,
  FolderOpen,
  Building2 as BuildingOffice,
  MessageCircle,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '../services/api';
import { getCurrentUser } from '../utils/auth.js';

// Navigation configurations for different user types
const navigationConfigs = {
  admin: {
    brand: { name: 'Irshad', subtitle: 'Logo' },
    user: { name: 'Admin', role: 'admin@company.com', avatar: 'A' },
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { name: 'Departments', href: '/admin', icon: Building2 },
      { name: 'User Management', href: '/admin/users', icon: UserCog },
      { name: 'Content Library', href: '/admin/content', icon: FolderOpen },
      { name: 'Company Profile', href: '/admin/profile', icon: Users },
      { name: 'My Profile', href: '/admin/my-profile', icon: User },
    ]
  },
  webOwner: {
    brand: { name: 'StepIn', subtitle: 'Platform Management' },
    user: { name: 'Web Owner', role: 'Platform Owner', avatar: 'WO' },
    items: [
      { name: 'Dashboard', href: '/owner', icon: Home },
      { name: 'Companies', href: '/owner/companies', icon: Building2 },
      { name: 'Registrations', href: '/owner/registrations', icon: ClipboardList },
      { name: 'Settings', href: '/owner/settings', icon: Settings },
      { name: 'My Profile', href: '/owner/my-profile', icon: User },
    ]
  },
  usageReport: {
    brand: { name: 'StepIn', subtitle: 'Usage Analytics' },
    user: { name: 'Report User', role: 'Analyst', avatar: 'UR' },
    items: [
      { name: 'Usage Reports', href: '/reports', icon: BarChart3 },
      { name: 'Analytics', href: '/reports/analytics', icon: BarChart3 },
      { name: 'Export Data', href: '/reports/export', icon: FileText },
    ]
  },
  supervisor: {
    brand: { name: 'Irshad', subtitle: 'Supervisor Portal' },
    user: { name: 'Supervisor', role: 'supervisor@company.com', avatar: 'S' },
    items: [
      { name: 'Dashboard', href: '/supervisor/charts', icon: Home },
      { name: 'Groups', href: '/supervisor/groups', icon: Users },
      { name: 'Content Library', href: '/supervisor/content', icon: FolderOpen },
      { name: 'My Profile', href: '/supervisor/my-profile', icon: User },
      // Templates entry removed per requirements
    ]
  }
  ,
  // Trainee user type: show dashboard and todo list
  trainee: {
    brand: { name: 'Irshad', subtitle: 'Trainee' },
    user: { name: 'Trainee', role: 'trainee@company.com', avatar: 'T' },
    items: [
      { name: 'Dashboard', href: '/trainee', icon: Home },
      { name: 'AI Assistant', href: '/trainee/chatbot', icon: Bot },
      { name: 'To Do List', href: '/trainee/todo', icon: ClipboardList },
      { name: 'My Profile', href: '/trainee/my-profile', icon: User }
    ]
  }
};

export const UnifiedSidebar = ({ 
  userType = 'admin', 
  collapsed = false, 
  setCollapsed = () => {},
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logoImgRef = React.useRef(null);
  
  // Initialize from localStorage immediately to prevent flash
  const getInitialUserData = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        return {
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || ''
        };
      }
    } catch (e) {
      console.error('Error reading initial user data:', e);
    }
    return {
      firstName: '',
      lastName: '',
      email: ''
    };
  };
  
  const [adminData, setAdminData] = useState(getInitialUserData());
  
  const config = navigationConfigs[userType] || navigationConfigs.admin;
  
  // Fetch user data for all user types
  useEffect(() => {
    console.log('🔍 UnifiedSidebar useEffect triggered for userType:', userType);
    
    // Helper function to format display names from email
    const formatDisplayName = (email) => {
      if (!email) return userType;
      return email.split('@')[0]
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    };

    const fetchAdminData = async () => {
      try {
        // First try localStorage for immediate display
        const storedUser = localStorage.getItem('user');
        console.log('👤 Admin - Stored user:', storedUser);
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            console.log('✅ Admin - Parsed userData:', userData);
            setAdminData({
              firstName: userData.firstName || formatDisplayName(userData.email),
              lastName: userData.lastName || '',
              email: userData.email || 'admin@company.com'
            });
          } catch (e) {
            console.error('Error parsing stored admin user:', e);
          }
        }

        // Then fetch from API for complete data
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

        const response = await fetch(`${API_BASE}/api/company-profile/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.admin) {
            // Use firstName from API if available, otherwise format from email
            const displayName = data.admin.firstName || formatDisplayName(data.admin.email);
            setAdminData({
              firstName: displayName,
              lastName: data.admin.lastName || '',
              email: data.admin.email || 'admin@company.com'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };

    if (userType === 'admin') {
      fetchAdminData();
    }

    // For trainee, supervisor, or webOwner
    if (['trainee', 'supervisor', 'webOwner'].includes(userType)) {
      const fetchUserData = async () => {
        try {
          // First try to get user from localStorage
          const storedUser = localStorage.getItem('user');
          console.log(`👤 ${userType} - Stored user:`, storedUser);
          let userData = null;

          if (storedUser) {
            try {
              userData = JSON.parse(storedUser);
              console.log(`✅ ${userType} - Parsed user data:`, userData);
              
              // Set initial state from localStorage
              // For webOwner, don't use email as fallback - wait for API response
              const displayData = {
                firstName: userData.firstName || (userType === 'webOwner' ? '' : formatDisplayName(userData.email)),
                lastName: userData.lastName || '',
                email: userData.email || `${userType.toLowerCase()}@company.com`
              };
              console.log(`🎯 ${userType} - Setting adminData to:`, displayData);
              setAdminData(displayData);
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }

          // Then try to get richer profile data from API
          const token = localStorage.getItem('token');
          const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
          const endpoints = {
            'trainee': '/api/trainee/me',
            'supervisor': '/api/supervisor/me',
            'webOwner': '/api/webowner/me'
          };
          const endpoint = endpoints[userType];

          const resp = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!resp.ok) {
            console.warn(`❌ ${userType} - Failed to fetch profile from API:`, resp.status, resp.statusText);
            const errorText = await resp.text().catch(() => '');
            console.warn('Error response:', errorText);
            return; // Keep the localStorage data
          }

          const data = await resp.json();
          console.log(`📥 ${userType} - API response:`, data);
          const profileMap = {
            'trainee': data.trainee,
            'supervisor': data.supervisor,
            'webOwner': data.webOwner
          };
          const profile = profileMap[userType];
          console.log(`👤 ${userType} - Profile data:`, profile);
          
          if (data && data.ok && profile) {
            // For webOwner, ensure we use firstName and lastName from the API
            const firstName = profile.firstName || (userData?.firstName) || '';
            const lastName = profile.lastName || (userData?.lastName) || '';
            
            console.log(`✅ ${userType} - Setting name:`, { firstName, lastName });
            
            // Only use email fallback for non-webOwner users
            const finalFirstName = firstName || (userType === 'webOwner' ? '' : formatDisplayName(profile.email || userData?.email || ''));
            
            setAdminData({
              firstName: finalFirstName,
              lastName: lastName,
              email: profile.email || userData?.email || `${userType.toLowerCase()}@company.com`
            });
          } else if (userData) {
            // If API fails but we have localStorage data, use it
            // For webOwner, don't use email as fallback
            const displayName = userData.firstName || (userType === 'webOwner' ? '' : formatDisplayName(userData.email));
            setAdminData({
              firstName: displayName || (userType === 'webOwner' ? '' : 'Trainee'),
              lastName: userData.lastName || '',
              email: userData.email || `${userType.toLowerCase()}@company.com`
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };

      fetchUserData();
    }
  }, [userType]);
  
  const checkIsActive = (path, exact = true) => {
    if (exact) {
      // Only highlight if we're exactly on that path
      return location.pathname === path;
    } else {
      // For paths that should be highlighted when we're on a sub-route
      return location.pathname.startsWith(path);
    }
  };

  // Trim transparent padding from Irshad logo once it loads
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
      const TRANSPARENCY_THRESHOLD = 10; // Consider pixels with alpha < 10 as transparent
      
      const isRowTransparent = (y) => {
        for (let x = 0; x < width; x++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > TRANSPARENCY_THRESHOLD) return false; // alpha channel
        }
        return true;
      };
      const isColTransparent = (x) => {
        for (let y = 0; y < height; y++) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > TRANSPARENCY_THRESHOLD) return false;
        }
        return true;
      };

      // More aggressive trimming - remove all transparent rows/cols
      while (top < bottom && isRowTransparent(top)) top++;
      while (bottom - 1 > top && isRowTransparent(bottom - 1)) bottom--;
      while (left < right && isColTransparent(left)) left++;
      while (right - 1 > left && isColTransparent(right - 1)) right--;

      // Add small padding back (optional - comment out for maximum trimming)
      // const padding = 2;
      // top = Math.max(0, top - padding);
      // left = Math.max(0, left - padding);
      // bottom = Math.min(height, bottom + padding);
      // right = Math.min(width, right + padding);

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
      console.error('Logo trimming error:', e);
    }
  };

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
      sessionStorage.removeItem("chatbot_messages");
      sessionStorage.removeItem("chatbot_conversation_id");
      sessionStorage.removeItem("chatbot_conversation");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
      sessionStorage.removeItem("chatbot_messages");
      sessionStorage.removeItem("chatbot_conversation_id");
      sessionStorage.removeItem("chatbot_conversation");
      navigate("/login");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Button - 3 Line Hamburger */}
      <button 
        className="mobile-menu-btn lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#0A2C5C] text-[#e6eef5] rounded-lg flex items-center justify-center shadow-lg"
        onClick={toggleMobileMenu}
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={cn("w-full h-0.5 bg-[#e6eef5] transition-all duration-300", isMobileMenuOpen && "rotate-45 translate-y-1.5")}></span>
          <span className={cn("w-full h-0.5 bg-[#e6eef5] transition-all duration-300", isMobileMenuOpen && "opacity-0")}></span>
          <span className={cn("w-full h-0.5 bg-[#e6eef5] transition-all duration-300", isMobileMenuOpen && "-rotate-45 -translate-y-1.5")}></span>
        </div>
      </button>

      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        'fixed lg:relative h-screen z-40',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'bg-[#0A2C5C] text-[#e6eef5u ]',
        className
      )}>
        {/* Brand Section with Collapse Arrow */}
        <div className="border-b border-[#1e3a52] flex items-center justify-between" style={{ minHeight: '64px', paddingTop: '16px', paddingBottom: '22px', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}>
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center overflow-visible">
              <img
                ref={logoImgRef}
                src="/logos/irshad-logo2.png"
                alt="Irshad"
                className={cn('drop-shadow-sm object-contain h-12 w-auto', collapsed && 'opacity-0 pointer-events-none')}
                onLoad={handleLogoLoad}
                onError={(e)=>{ 
                  // If logo not found, hide image and show text fallback
                  e.currentTarget.style.display='none';
                  if (!e.currentTarget.parentElement.querySelector('.logo-fallback')) {
                    const textFallback = document.createElement('span');
                    textFallback.className = 'logo-fallback text-lg font-bold tracking-wide text-[#e6eef5]';
                    textFallback.textContent = 'Irshad';
                    e.currentTarget.parentElement.appendChild(textFallback);
                  }
                }}
              />
            </div>
          </div>
          {/* Desktop Collapse Toggle - Three Dashes */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-0 border-0 bg-transparent text-[#e6eef5] hover:text-white transition-colors flex items-center"
            style={{ background: 'none', alignSelf: 'flex-start', transform: 'translateY(16px)' }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" style={{ background: 'transparent' }}>
              <line x1="4" y1="8" x2="20" y2="8"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="16" x2="20" y2="16"></line>
            </svg>
          </button>
        </div>
        
        {/* Removed hamburger toggle in favor of small arrow button above */}
        
        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-4 flex flex-col gap-3")}> 
          {config.items.map((item) => {
            // Only highlight the exact page you're on - no multiple highlights
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMobileMenuOpen(false);
                  
                  // Navigate to the route
                  navigate(item.href);
                }}
                className={cn(
                  'flex items-center rounded-lg transition-all duration-200 group text-[#e6eef5] no-underline border-none bg-transparent cursor-pointer w-full text-left',
                  collapsed ? 'justify-center px-2 py-3 my-1' : 'gap-4 px-5 py-4',
                  isActive
                    ? 'bg-white/15 text-[#e6eef5] shadow-sm'
                    : 'hover:bg-white/8 hover:text-white'
                )}
                title={collapsed ? item.name : undefined}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 10
                }}
              >
                <item.icon className={cn("flex-shrink-0 w-6 h-6")} />
                {!collapsed && (
                  <span className="font-semibold text-base truncate">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className={cn("border-t border-[#1e3a52]", collapsed ? "p-2" : "p-4")}> 
          <div className={cn("flex items-center", collapsed ? "justify-center py-2" : "gap-4 px-4 py-4")}> 
            <div 
              className="w-12 h-12 rounded-full bg-[#e6eef5] text-[#0A2C5C] flex items-center justify-center font-bold text-lg flex-shrink-0 relative group"
              title={collapsed ? (() => {
                if (['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType)) {
                  const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
                  if (userType === 'webOwner') {
                    return fullName || config.user.name;
                  }
                  return fullName || adminData.email?.split('@')[0] || (userType === 'admin' ? 'Admin' : userType === 'trainee' ? 'Trainee' : 'Supervisor');
                }
                return `${config.user.name} - ${config.user.role}`;
              })() : undefined}
            >
              {(['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType)) 
                ? ((adminData.firstName?.charAt(0) || adminData.lastName?.charAt(0) || adminData.email?.charAt(0) || 'T')).toUpperCase()
                : config.user.avatar}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="font-semibold">
                    {['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType) 
                      ? (() => {
                          const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
                          // For webOwner, only show full name if we have it
                          if (userType === 'webOwner') {
                            return fullName || (adminData.firstName ? adminData.firstName : '');
                          }
                          return fullName || adminData.email?.split('@')[0] || config.user.name;
                        })()
                      : config.user.name}
                  </div>
                  <div className="text-xs text-gray-300">
                    {['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType) ? userType.charAt(0).toUpperCase() + userType.slice(1) : config.user.role}
                  </div>
                  {/* Arrow pointing to avatar */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-base font-semibold truncate text-[#e6eef5]">
                  {(['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType)) 
                    ? (() => {
                        const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
                        // For webOwner, only show full name if we have it, otherwise show empty string (will be updated when API loads)
                        if (userType === 'webOwner') {
                          // Only show name if we have firstName or lastName, don't fall back to config
                          return fullName || (adminData.firstName ? adminData.firstName : '');
                        }
                        return fullName || adminData.email?.split('@')[0] || config.user.name;
                      })()
                    : config.user.name}
                </p>
                <p className="text-sm font-medium text-[#e6eef5]/75 truncate" title={(['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType)) ? userType.charAt(0).toUpperCase() + userType.slice(1) : config.user.role}>
                  {(['admin', 'trainee', 'supervisor', 'webOwner'].includes(userType)) ? userType.charAt(0).toUpperCase() + userType.slice(1) : config.user.role}
                </p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
              className={cn(
                'w-full flex items-center rounded-lg transition-all duration-200 text-[#e6eef5] hover:text-white group bg-transparent hover:bg-transparent',
                collapsed ? 'justify-center py-2' : 'gap-4 px-5 py-4'
              )}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            {!collapsed && <span className="font-semibold text-base">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default UnifiedSidebar;
