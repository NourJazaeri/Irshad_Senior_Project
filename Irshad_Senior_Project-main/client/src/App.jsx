import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import CompanyRegistration from "./pages/CompanyRegistration.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import TraineeDashboard from "./pages/TraineeDashboard.jsx";
import WebOwnerDashboard from "./pages/WebOwnerDashboard.jsx";

// Import WebOwner layout and pages
import OwnerLayout from "./pages/OwnerLayout.jsx";
import CompaniesPage from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Dashboard from "./pages/WebOwnerDashboard.jsx";
import Registrations from "./pages/Registrations.jsx";
import Reports from "./pages/Reports.jsx";

// Import UsageReport pages
import ActivityLog from "./pages/ActivityLog.jsx";
import ReportCompanyDetails from "./pages/ReportCompanyDetails.jsx";

import "./App.css";
import "./styles/Registration.css";
import "./styles/login.css"; // Import last to override other styles
import "./styles/owner-components.css";

export default function App() {
  const location = useLocation();
  
  // Define routes that should NOT have Navbar and Footer
  const loginRoutes = ['/', '/login', '/auth'];
  const dashboardRoutes = ['/admin', '/supervisor', '/trainee', '/webowner'];
  const ownerRoutes = ['/owner'];
  const isLoginRoute = loginRoutes.includes(location.pathname);
  const isDashboardRoute = dashboardRoutes.includes(location.pathname);
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <>
      {!isLoginRoute && !isDashboardRoute && !isOwnerRoute && <Navbar />}
      <Routes>
        {/* Login Routes - Set as default page */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* Company Registration Routes */}
        <Route path="/registration" element={<CompanyRegistration />} />
        <Route path="/register" element={<CompanyRegistration />} />

        {/* Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/trainee" element={<TraineeDashboard />} />
        <Route path="/webowner" element={<Navigate to="/owner/dashboard" replace />} />

        {/* WebOwner Layout Routes (from ActiveCompaniesFeature) */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetails />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* UsageReport Routes */}
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/company-details/:companyId" element={<ReportCompanyDetails />} />

        {/* Additional Dashboard Routes */}
        <Route path="/companies" element={<div style={{padding: '20px'}}><h2>Companies Management</h2><p>This page will show all registered companies.</p></div>} />
        <Route path="/registrations" element={<div style={{padding: '20px'}}><h2>Registration Requests</h2><p>This page will show all pending registration requests.</p></div>} />
        <Route path="/settings" element={<div style={{padding: '20px'}}><h2>Settings</h2><p>This page will contain dashboard settings.</p></div>} />
      </Routes>
      {!isLoginRoute && !isOwnerRoute && <Footer />}
    </>
  );
}
