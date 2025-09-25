// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import OwnerLayout from './components/OwnerLayout.jsx';

import PendingCompanyRegistrations from './pages/PendingCompanyRegistrations.jsx';

import './styles/dashboard.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <OwnerLayout>
              <PendingCompanyRegistrations />
            </OwnerLayout>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
