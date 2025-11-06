import React, { useState } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SidebarDemo = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userType, setUserType] = useState('admin');

  const userTypes = [
    { key: 'admin', label: 'Admin', description: 'Company management and content' },
    { key: 'webOwner', label: 'Web Owner', description: 'Platform management' },
    { key: 'usageReport', label: 'Usage Report', description: 'Analytics and reporting' }
  ];

  return (
    <div className="flex h-screen bg-background">
      <UnifiedSidebar 
        userType={userType} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Unified Sidebar Demo</h1>
            <p className="text-muted-foreground">
              A single, collapsible sidebar component that adapts to different user roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Type</CardTitle>
                <CardDescription>Switch between different user roles to see how the sidebar changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {userTypes.map((type) => (
                  <Button
                    key={type.key}
                    variant={userType === type.key ? 'default' : 'outline'}
                    onClick={() => setUserType(type.key)}
                    className="w-full justify-start"
                  >
                    <div className="text-left">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sidebar State</CardTitle>
                <CardDescription>Toggle the sidebar collapsed state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => setCollapsed(!collapsed)}
                  className="w-full"
                >
                  {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  Current state: <span className="font-medium">{collapsed ? 'Collapsed' : 'Expanded'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>What makes this sidebar special</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <strong>Dynamic Navigation:</strong> Menu items change based on user role
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <strong>Collapsible:</strong> Can be collapsed to save space
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <strong>Responsive:</strong> Mobile-friendly with overlay
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <strong>Consistent Styling:</strong> Uses your design system
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <strong>Single Component:</strong> Replaces 3 separate sidebar components
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SidebarDemo;
