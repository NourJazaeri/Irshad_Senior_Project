import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx";
import TraineeDashboard from "./pages/TraineeDashboard.jsx";
import WebOwnerDashboard from "./pages/WebOwnerDashboard.jsx"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/supervisor" element={<SupervisorDashboard />} />
      <Route path="/trainee" element={<TraineeDashboard />} />
      <Route path="/webowner" element={<WebOwnerDashboard />} /> 
    </Routes>
  );
}

export default App;
