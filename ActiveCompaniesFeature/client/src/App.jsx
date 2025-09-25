// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import OwnerLayout from "./pages/WebOwner/OwnerLayout.jsx";
import CompaniesPage from "./pages/WebOwner/Companies.jsx";
import CompanyDetails from "./pages/WebOwner/CompanyDetails.jsx";
import Dashboard from "./pages/WebOwner/Dashboard.jsx";
import Registrations from "./pages/WebOwner/Registrations.jsx";
import Reports from "./pages/WebOwner/Reports.jsx";
import "./styles/owner.css";
import "./styles/dashboard.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/owner/companies" replace />} />
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to="companies" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="companies/:id" element={<CompanyDetails />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/owner/companies" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
