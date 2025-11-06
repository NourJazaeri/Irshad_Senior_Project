import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User,
  Building2,
  Home,
  Users,
  Library,
  Building,
  UserCog,
  Building2 as BuildingOffice,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        if (pathname.match(/^\/admin\/groups\/\d+$/)) {
          return 'Departments';
        }
        if (pathname.startsWith('/admin/departments/')) {
          return 'Departments';
        }
        if (pathname.startsWith('/admin/content/')) {
          return 'Content Library';
        }
        if (pathname.startsWith('/admin/employees/')) {
          return 'User Management';
        }
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
      case '/owner/settings':
        return 'Settings';
      case '/owner/my-profile':
        return 'My Profile';
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
        if (pathname.startsWith('/supervisor/groups/')) {
          return 'Group Details';
        }
        return 'Dashboard';
    }
  } else if (userType === 'trainee') {
    switch (pathname) {
      case '/trainee':
      case '/trainee/':
        return 'Dashboard';
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
        return 'Dashboard';
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
        if (pathname.match(/^\/admin\/groups\/\d+$/)) {
          return BuildingOffice;
        }
        if (pathname.startsWith('/admin/departments/')) {
          return BuildingOffice;
        }
        if (pathname.startsWith('/admin/content/')) {
          return Library;
        }
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
      case '/owner/settings':
        return UserCog;
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
  className = ''
}) => {
  const location = useLocation();
  const logoImgRef = useRef(null);

  const pageTitle = getPageTitle(location.pathname, userType);
  const PageIcon = getPageIcon(location.pathname, userType);

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
          if (data[(y * width + x) * 4 + 3] !== 0) return false;
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
      // Silently ignore
    }
  };

  return (
    <header className={cn(
      "bg-blue-50 border-b border-blue-200 shadow-sm w-full sticky top-0 z-50 font-sans antialiased",
      className
    )}>
      <div className="flex items-center px-12 py-4">
        <div className="flex items-center gap-4">
          <PageIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-wide text-foreground leading-tight m-0">
            {pageTitle}
          </h1>
        </div>

        <div className="h-24 w-auto flex items-center justify-center overflow-visible ml-auto">
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
