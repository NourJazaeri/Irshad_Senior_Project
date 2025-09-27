import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CompanyUsageHistory from './pages/CompanyUsageHistory.jsx'
import CompanyDetails from './pages/CompanyDetails.jsx'
import './App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CompanyUsageHistory />} />
        <Route path="/company-usage-history" element={<CompanyUsageHistory />} />
        <Route path="/company-details/:companyId" element={<CompanyDetails />} />
      </Routes>
    </Router>
  )
}
