import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

// --- Auth & Registration ---
import LoginPage from "./pages/LoginPage.jsx";
import CompanyRegistration from "./pages/CompanyRegistration.jsx";

// --- Admin Layout & Pages ---
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import CompanyProfile from "./pages/CompanyProfile.jsx";
import DepartmentDetails from "./pages/DepartmentDetails.jsx"; // ✅ تمت الإضافة هنا

// --- Supervisor / Trainee / WebOwner ---
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import TraineeDashboard from "./pages/TraineeDashboard.jsx";

// --- WebOwner Layout & Pages ---
import OwnerLayout from "./pages/OwnerLayout.jsx";
import CompaniesPage from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Dashboard from "./pages/WebOwnerDashboard.jsx";
import Registrations from "./pages/Registrations.jsx";
import Reports from "./pages/Reports.jsx";

// --- Reports / Logs ---
import ActivityLog from "./pages/ActivityLog.jsx";
import ReportCompanyDetails from "./pages/ReportCompanyDetails.jsx";

// --- Styles ---
import "./App.css";
import "./styles/Registration.css";
import "./styles/login.css";
import "./styles/owner-components.css";

export default function App() {
  const location = useLocation();

  const loginRoutes = ["/", "/login", "/auth"];
  const dashboardRoutes = ["/supervisor", "/trainee", "/webowner"];
  const isLoginRoute = loginRoutes.includes(location.pathname);
  const isDashboardRoute = dashboardRoutes.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isOwnerRoute = location.pathname.startsWith("/owner");

  return (
    <>
      {/* Navbar يظهر فقط خارج صفحات اللوحات */}
      {!isLoginRoute && !isDashboardRoute && !isAdminRoute && !isOwnerRoute && <Navbar />}

      <Routes>
        {/* --- Login Routes --- */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* --- Company Registration --- */}
        <Route path="/registration" element={<CompanyRegistration />} />
        <Route path="/register" element={<CompanyRegistration />} />

        {/* --- Admin Layout --- */}
       <Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminHome />} />
  <Route path="company-profile" element={<CompanyProfile />} />
  <Route path="departments/:id" element={<DepartmentDetails />} />  
</Route>

        {/* --- Supervisor / Trainee Dashboards --- */}
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/trainee" element={<TraineeDashboard />} />

        {/* --- WebOwner Layout --- */}
        <Route path="/webowner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetails />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* --- Reports & Activity Log --- */}
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/company-details/:companyId" element={<ReportCompanyDetails />} />

        {/* --- Placeholder Pages --- */}
        <Route
          path="/companies"
          element={
            <div style={{ padding: "20px" }}>
              <h2>Companies Management</h2>
              <p>This page will show all registered companies.</p>
            </div>
          }
        />
        <Route
          path="/registrations"
          element={
            <div style={{ padding: "20px" }}>
              <h2>Registration Requests</h2>
              <p>This page will show all pending registration requests.</p>
            </div>
          }
        />
        <Route
          path="/settings"
          element={
            <div style={{ padding: "20px" }}>
              <h2>Settings</h2>
              <p>This page will contain dashboard settings.</p>
            </div>
          }
        />
      </Routes>

      {!isLoginRoute && !isAdminRoute && !isOwnerRoute && <Footer />}
    </>
  );
}
