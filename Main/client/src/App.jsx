import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Company Registration Routes */}
        <Route path="/" element={<CompanyRegistration />} />
        <Route path="/registration" element={<CompanyRegistration />} />
        <Route path="/register" element={<CompanyRegistration />} />
        
        {/* Login Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<LoginPage />} />
        
        {/* Dashboard Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/trainee" element={<TraineeDashboard />} />
        <Route path="/webowner" element={<WebOwnerDashboard />} />
      </Routes>
      <Footer />
    </>
  );
}