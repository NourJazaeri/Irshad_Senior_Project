import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Library, 
  FileText, 
  Building2, 
  User, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  BarChart3,
  ClipboardList,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '../services/api';

// Navigation configurations for different user types
const navigationConfigs = {
  admin: {
    brand: { name: 'Irshad', subtitle: 'Logo' },
    user: { name: 'Admin', role: 'admin@company.com', avatar: 'A' },
    items: [
      { name: 'Home', href: '/admin', icon: Home },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Content Library', href: '/admin/content', icon: Library },
      { name: 'Company Profile', href: '/admin/profile', icon: Building },
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
  const [adminData, setAdminData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@company.com'
  });
  
  const config = navigationConfigs[userType] || navigationConfigs.admin;
  
  // Fetch admin data for admin user type
  useEffect(() => {
    if (userType === 'admin') {
      const fetchAdminData = async () => {
        try {
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
              setAdminData({
                firstName: data.admin.firstName || 'Admin',
                lastName: data.admin.lastName || 'User',
                email: data.admin.email || 'admin@company.com'
              });
            }
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      };

      fetchAdminData();
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

  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      
      if (sessionId) {
        await logoutUser(sessionId);
      }

      // Clear JWT and session data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if backend call fails, still clear local data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("user");
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
        collapsed ? 'w-16' : 'w-72',
        'fixed lg:relative h-screen z-40',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'bg-[#0A2C5C] text-[#e6eef5u ]',
        className
      )}>
        {/* Brand Section with Collapse Arrow */}
        <div className="p-4 border-b border-[#1e3a52] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logos/irshad-logo.png"
              alt="Irshad"
              className={cn('object-contain', collapsed ? 'h-8 w-8' : 'h-9 w-auto')}
              onError={(e)=>{ e.currentTarget.style.display='none'; }}
            />
            {!collapsed && (
              <span className="text-lg font-bold tracking-wide text-[#e6eef5]">Irshad</span>
            )}
          </div>
          {/* Desktop Collapse Toggle - Small Arrow */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#e6eef5] transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Removed hamburger toggle in favor of small arrow button above */}
        
        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-4 flex flex-col gap-3")}> 
          {config.items.map((item) => {
            // Only highlight the exact page you're on - no multiple highlights
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center rounded-lg transition-all duration-200 group text-[#e6eef5] no-underline',
                  collapsed ? 'justify-center px-2 py-3 my-1' : 'gap-4 px-5 py-4',
                  isActive
                    ? 'bg-white/15 text-[#e6eef5] shadow-sm'
                    : 'hover:bg-white/8 hover:text-white'
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("flex-shrink-0 w-6 h-6")} />
                {!collapsed && (
                  <span className="font-semibold text-base truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className={cn("border-t border-[#1e3a52]", collapsed ? "p-2" : "p-4")}> 
          <div className={cn("flex items-center", collapsed ? "justify-center py-2" : "gap-4 px-4 py-4")}> 
            <div 
              className="w-12 h-12 rounded-full bg-[#e6eef5] text-[#0A2C5C] flex items-center justify-center font-bold text-lg flex-shrink-0 relative group"
              title={collapsed ? (userType === 'admin' ? `${adminData.firstName} ${adminData.lastName} - ${adminData.email}` : `${config.user.name} - ${config.user.role}`) : undefined}
            >
              {userType === 'admin' ? adminData.firstName.charAt(0).toUpperCase() : config.user.avatar}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="font-semibold">
                    {userType === 'admin' ? `${adminData.firstName} ${adminData.lastName}` : config.user.name}
                  </div>
                  <div className="text-xs text-gray-300">
                    {userType === 'admin' ? adminData.email : config.user.role}
                  </div>
                  {/* Arrow pointing to avatar */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-base font-semibold truncate text-[#e6eef5]">
                  {userType === 'admin' ? `${adminData.firstName} ${adminData.lastName}` : config.user.name}
                </p>
                <p className="text-sm font-medium text-[#e6eef5]/75 truncate" title={userType === 'admin' ? adminData.email : config.user.role}>
                  {userType === 'admin' ? adminData.email : config.user.role}
                </p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center rounded-lg transition-all duration-200 text-[#e6eef5] hover:bg-white/10 group',
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
