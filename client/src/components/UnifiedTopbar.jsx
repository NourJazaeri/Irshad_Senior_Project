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
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '../services/api';
import { Button } from '@/components/ui/button';

// Page title mapping
const getPageTitle = (pathname, userType) => {
  if (userType === 'admin') {
    switch (pathname) {
      case '/admin':
        return 'Home';
      case '/admin/content':
        return 'Content Library';
      case '/admin/profile':
        return 'Company Profile';
      case '/admin/users':
        return 'Users';
      default:
        // Check if it's a content detail or view page
        if (pathname.startsWith('/admin/content/')) {
          return 'Content Library';
        }
        return 'Admin Dashboard';
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
      case '/owner/settings':
        return 'Settings';
      default:
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
  }
  return 'Dashboard';
};

const getPageIcon = (pathname, userType) => {
  if (userType === 'admin') {
    switch (pathname) {
      case '/admin':
        return Home;
      case '/admin/content':
        return Library;
      case '/admin/profile':
        return Building;
      case '/admin/users':
        return Users;
      default:
        // Check if it's a content detail or view page
        if (pathname.startsWith('/admin/content/')) {
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
  className = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminData, setAdminData] = useState({
    firstName: 'Admin',
    lastName: 'User',
    name: 'Admin',
    email: 'admin@company.com',
    companyName: 'Your Company'
  });
  const [loading, setLoading] = useState(true);
  const logoImgRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname, userType);
  const PageIcon = getPageIcon(location.pathname, userType);

  // Fetch admin data from employee table
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        
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
            setAdminData({
              firstName: data.admin.firstName || 'Admin',
              lastName: data.admin.lastName || 'User',
              name: `${data.admin.firstName || ''} ${data.admin.lastName || ''}`.trim() || 'Admin',
              email: data.admin.email || 'admin@company.com',
              companyName: data.company?.name || 'Your Company'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        // Keep default values if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

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

  // Build breadcrumb from path
  const segments = location.pathname.split('/').filter(Boolean);
  const pretty = (seg) => seg.replace(/[-_]/g,' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <header className={cn(
      "bg-blue-50 border-b border-blue-200 shadow-sm w-full sticky top-0 z-50 font-sans antialiased",
      className
    )}>
      <div className="flex items-center justify-between px-12 py-4">
        {/* Left: Page Title with Icon */}
        <div className="flex items-center gap-4">
          <PageIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-wide text-foreground leading-tight m-0">
            {pageTitle}
          </h1>
        </div>

        {/* Company Logo at far right (bigger, crisper) */}
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
    </header>
  );
};

export default UnifiedTopbar;
