import React, { useState } from "react";
import "../styles/login.css";
import UnifiedSidebar from "../components/UnifiedSidebar";
import UnifiedTopbar from "../components/UnifiedTopbar";

function TraineeDashboard() {
  // control sidebar collapsed state so layout can adjust
  const [collapsed, setCollapsed] = useState(false);

  // compute left margin for main content to account for sidebar width
  const mainMarginLeft = collapsed ? 64 : 288; // px (w-16 = 64, w-72 = 288)

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar (fixed) */}
      <UnifiedSidebar userType="trainee" collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar - moved to top of flex container */}
        <UnifiedTopbar userType="trainee" />

        {/* Main trainee content */}
        <main className="flex-1 p-6 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Trainee Dashboard</h1>
            <p className="text-gray-600 text-lg">Welcome, Trainee!</p>
          </div>

          {/* Placeholder for trainee widgets: KPIs, assigned content, upcoming deadlines */}
          <section className="mt-6">
            <div className="rounded-lg border border-gray-200 p-6 bg-white shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Assigned Content</h2>
              <p className="text-gray-600">No content to show yet. This area will list content assigned to the trainee.</p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default TraineeDashboard;