import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Clock, CheckCircle } from "lucide-react";

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const [contentStats, setContentStats] = useState({
    totalContent: 0,
    recentContent: 0,
    pendingAssignments: 0,
    completedAssignments: 0
  });

  useEffect(() => {
    fetchContentStats();
  }, []);

  const fetchContentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
      
      const response = await fetch(`${API_BASE}/api/content`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content || [];
        
        // Calculate stats
        const totalContent = content.length;
        const recentContent = content.filter(item => {
          const createdAt = new Date(item.createdAt);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return createdAt > oneWeekAgo;
        }).length;

        setContentStats({
          totalContent,
          recentContent,
          pendingAssignments: 0, // You can implement this based on your requirements
          completedAssignments: 0 // You can implement this based on your requirements
        });
      }
    } catch (error) {
      console.error('Error fetching content stats:', error);
    }
  };

  const statCards = [
    {
      title: "Total Content",
      value: contentStats.totalContent,
      icon: FileText,
      color: "bg-blue-500",
      description: "Content items created"
    },
    {
      title: "Recent Content",
      value: contentStats.recentContent,
      icon: Clock,
      color: "bg-green-500",
      description: "Added this week"
    },
    {
      title: "Pending Assignments",
      value: contentStats.pendingAssignments,
      icon: Users,
      color: "bg-yellow-500",
      description: "Awaiting completion"
    },
    {
      title: "Completed",
      value: contentStats.completedAssignments,
      icon: CheckCircle,
      color: "bg-purple-500",
      description: "Successfully completed"
    }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Supervisor Dashboard</h1>
          <p className="text-xl text-muted-foreground">Manage and track your content assignments</p>
        </div>
        <Button
          onClick={() => navigate('/supervisor/content')}
          className="bg-primary hover:bg-primary-hover shadow-soft text-base font-semibold px-6 py-3"
        >
          <Plus className="w-5 h-5 mr-2" />
          Manage Content
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <IconComponent className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Recent Content</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/supervisor/content')}
            >
              View All
            </Button>
          </div>
          <p className="text-muted-foreground">
            You have created {contentStats.totalContent} content items. 
            {contentStats.recentContent > 0 && (
              <span className="text-green-600 font-medium"> {contentStats.recentContent} were added this week.</span>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/supervisor/content')}
              className="w-full justify-start"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Manage Content
            </Button>
            <Button
              onClick={() => navigate('/supervisor/content?action=add')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Content
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;