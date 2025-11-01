import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import CompanyRegistration from "./pages/CompanyRegistration.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CompanyProfile from "./pages/CompanyProfile.jsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import SupervisorLayout from "./pages/SupervisorLayout.jsx";
import SupervisorContentManagement from "./pages/SupervisorContentManagement.jsx";
import TraineeDashboard from "./pages/TraineeDashboard.jsx";
import TraineeLayout from "./pages/TraineeLayout.jsx";
import WebOwnerDashboard from "./pages/WebOwnerDashboard.jsx";
import UserManagement from "./pages/UserManagement.jsx";

// Import user detail pages
import EmployeeDetails from "./pages/EmployeeDetails.jsx";
import TraineeDetails from "./pages/TraineeDetails.jsx";
import SupervisorDetails from "./pages/SupervisorDetails.jsx";

// Import Content Management
import ContentManagement from "./pages/ContentManagement.jsx";
import ContentDetails from "./pages/ContentDetails.jsx";
import ContentView from "./pages/ContentView.jsx";

// Import Department and Group Management
import AdminHome from "./pages/AdminHome.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DepartmentDetails from "./pages/DepartmentDetails.jsx";
import AssignMembers from "./pages/AssignMembers.jsx";
import AdminGroupDetails from "./pages/AdminGroupDetails.jsx";
import SupervisorGroupDetails from './pages/SupervisorGroupDetails.jsx';

// Import Admin layout and pages
import AdminLayout from "./pages/AdminLayout.jsx";
import AdminTemplateManagement from "./pages/AdminTemplateManagement.jsx";

// Import Supervisor layout and pages
import SupervisorTemplateManagement from "./pages/SupervisorTemplateManagement.jsx";

// Import WebOwner layout and pages
import OwnerLayout from "./pages/OwnerLayout.jsx";
import CompaniesPage from "./pages/Companies.jsx";
import CompanyDetails from "./pages/CompanyDetails.jsx";
import Registrations from "./pages/Registrations.jsx";
import Reports from "./pages/Reports.jsx";

// Import UsageReport pages
import ActivityLog from "./pages/ActivityLog.jsx";
import ReportCompanyDetails from "./pages/ReportCompanyDetails.jsx";


import "./App.css";
import "./styles/Registration.css";
import "./styles/login.css"; // Import last to override other styles
import "./styles/owner-components.css";
import './styles/supervisor.css';

export default function App() {
  const location = useLocation();
  
  // Define routes that should NOT have Navbar and Footer
  const loginRoutes = ['/', '/login', '/auth'];
  const dashboardRoutes = ['/supervisor', '/trainee', '/webowner'];
  const adminRoutes = ['/admin'];
  const ownerRoutes = ['/owner'];
  const isLoginRoute = loginRoutes.includes(location.pathname);
  const isDashboardRoute = dashboardRoutes.includes(location.pathname) || location.pathname.startsWith('/supervisor');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <>
      {!isLoginRoute && !isDashboardRoute && !isAdminRoute && !isOwnerRoute && <Navbar />}
      <Routes>


        {/* Login Routes - Set as default page */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />

        {/* Company Registration Routes */}
        <Route path="/registration" element={<CompanyRegistration />} />
        <Route path="/register" element={<CompanyRegistration />} />

        {/* Admin Layout Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="content" element={<ContentManagement />} />
          <Route path="content/:id" element={<ContentDetails />} />
          <Route path="content/:id/view" element={<ContentView />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="departments/:departmentName/details" element={<DepartmentDetails />} />
          <Route path="departments/:departmentName/assign-members" element={<AssignMembers />} />
          <Route path="groups/:id" element={<AdminGroupDetails />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="employees/:id" element={<EmployeeDetails />} />
          <Route path="trainees/:id" element={<TraineeDetails />} />
          <Route path="supervisors/:id" element={<SupervisorDetails />} />
          <Route path="templates" element={<AdminTemplateManagement />} />
        </Route>

        {/* Supervisor Routes */}
        <Route path="/supervisor" element={<SupervisorLayout />}>
          <Route index element={<SupervisorDashboard />} />
          <Route path="empty" element={<div style={{padding: '20px'}}><h2>Dashboard</h2><p>This page is intentionally left empty.</p></div>} />
          <Route path="content" element={<SupervisorContentManagement />} />
          <Route path="content/:id" element={<ContentDetails />} />
          <Route path="content/:id/view" element={<ContentView />} />
          <Route path="templates" element={<SupervisorTemplateManagement />} />
          <Route path="groups/:id" element={<SupervisorGroupDetails />} />
        </Route>

        {/* Trainee Routes */}
        <Route path="/trainee" element={<TraineeLayout />}>
          <Route index element={<TraineeDashboard />} />
          <Route path="content/:id" element={<ContentView />} />
        </Route>
        <Route path="/webowner" element={<Navigate to="/owner/dashboard" replace />} />

        {/* WebOwner Layout Routes (from ActiveCompaniesFeature) */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<WebOwnerDashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetails />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<div style={{padding: '20px'}}><h2>Settings</h2><p>This page will contain platform settings.</p></div>} />
        </Route>

        {/* UsageReport Routes */}
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/company-details/:companyId" element={<ReportCompanyDetails />} />

        {/* Additional Dashboard Routes */}
        <Route path="/companies" element={<div style={{padding: '20px'}}><h2>Companies Management</h2><p>This page will show all registered companies.</p></div>} />
        <Route path="/registrations" element={<div style={{padding: '20px'}}><h2>Registration Requests</h2><p>This page will show all pending registration requests.</p></div>} />
        <Route path="/settings" element={<div style={{padding: '20px'}}><h2>Settings</h2><p>This page will contain dashboard settings.</p></div>} />
      </Routes>
      {!isLoginRoute && !isAdminRoute && !isOwnerRoute && !isDashboardRoute && <Footer />}
    </>
  );
}
