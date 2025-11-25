import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FolderOpen, UserCog, Building2, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Dashboard() {
  const navigate = useNavigate();

  // User name and company from localStorage
  const [userName, setUserName] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.firstName) {
          return userData.firstName;
        } else if (userData.email) {
          const namePart = userData.email.split('@')[0];
          return namePart.split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        }
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
    return 'Admin';
  });

  const [companyName, setCompanyName] = useState('Company');

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/company-profile/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        console.log('Company API response:', res.data);
        
        // The field is "name" not "companyName"
        if (res.data?.company?.name) {
          setCompanyName(res.data.company.name);
        } else if (res.data?.company?.companyName) {
          setCompanyName(res.data.company.companyName);
        } else if (res.data?.companyName) {
          setCompanyName(res.data.companyName);
        }
      } catch (err) {
        console.error('Error fetching company name:', err);
      }
    };
    fetchCompanyName();
  }, []);

  const dashboardCards = [
    {
      id: "departments",
      title: "Departments",
      description: "View and manage all company departments",
      icon: <Building2 className="w-12 h-12" />,
      route: "/admin",
    },
    {
      id: "content",
      title: "Content Library",
      description: "Access and organize company content",
      icon: <FolderOpen className="w-12 h-12" />,
      route: "/admin/content",
    },
    {
      id: "users",
      title: "Users Management",
      description: "Manage user accounts and permissions",
      icon: <UserCog className="w-12 h-12" />,
      route: "/admin/users",
    },
    {
      id: "profile",
      title: "Company Profile",
      description: "Update organization details and settings",
      icon: <Users className="w-12 h-12" />,
      route: "/admin/profile",
    },
  ];

  return (
    <div className="min-h-screen -mt-4">
      <div className="container mx-auto px-4 pb-4">
        {/* Company Card */}
        <div style={{ 
          marginBottom: '24px'
        }}>
          <div style={{ 
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: 0,
              flexShrink: 0,
              background: '#DBEAFE',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={32} color="#2563eb" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ 
                fontSize: '0.95rem', 
                marginBottom: '6px',
                color: '#64748b',
                marginTop: 0
              }}>
                Your Company
              </p>
              <p style={{ 
                fontSize: '1.125rem', 
                margin: 0,
                color: '#0b2f55',
                fontWeight: '600'
              }}>
                {companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards - Individual containers with equal wrapper */}
        <div className="w-full bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {dashboardCards.map((card) => (
              <Card
                key={card.id}
                onClick={() => navigate(card.route)}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] rounded-xl w-full"
              >
                <CardContent className="p-12 pt-16 flex flex-col items-center text-center space-y-8 min-h-[280px] justify-start">
                  <div className="p-8 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-300">
                    <div className="text-blue-600">{card.icon}</div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-2xl text-card-foreground">
                      {card.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
