import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import CompanyRegistration from "./pages/CompanyRegistration.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import TraineeDashboard from "./pages/TraineeDashboard.jsx";
import WebOwnerDashboard from "./pages/WebOwnerDashboard.jsx";

import "./App.css";
import "./styles/Registration.css";
import "./styles/login.css"; // Import last to override other styles

export default function App() {
  const location = useLocation();
  
  // Define routes that should NOT have Navbar and Footer
  const loginRoutes = ['/', '/login', '/auth'];
  const dashboardRoutes = ['/admin', '/supervisor', '/trainee', '/webowner'];
  const isLoginRoute = loginRoutes.includes(location.pathname);
  const isDashboardRoute = dashboardRoutes.includes(location.pathname);

  return (
    <>
      {!isLoginRoute && !isDashboardRoute && <Navbar />}
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
        <Route path="/webowner" element={<WebOwnerDashboard />} />

        {/* Additional Dashboard Routes */}
        <Route path="/companies" element={<div style={{padding: '20px'}}><h2>Companies Management</h2><p>This page will show all registered companies.</p></div>} />
        <Route path="/registrations" element={<div style={{padding: '20px'}}><h2>Registration Requests</h2><p>This page will show all pending registration requests.</p></div>} />
        <Route path="/history" element={<div style={{padding: '20px'}}><h2>Usage History</h2><p>This page will show platform usage history and reports.</p></div>} />
        <Route path="/settings" element={<div style={{padding: '20px'}}><h2>Settings</h2><p>This page will contain dashboard settings.</p></div>} />
      </Routes>
      {!isLoginRoute && <Footer />}
    </>
  );
}
