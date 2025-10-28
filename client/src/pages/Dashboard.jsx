import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FolderOpen, UserCog, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

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
    <div className="min-h-screen">
      <div className="container mx-auto px-0 py-8">
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
