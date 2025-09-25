import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import CompanyRegistration from "./pages/CompanyRegistration.jsx";
import Login from "./pages/Login.jsx";
import Footer from "./components/Footer.jsx";
import "./styles/Registration.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<CompanyRegistration />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}


