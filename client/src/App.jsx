import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

// Pages
import { LoginPage } from './pages/LoginPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';
import { StudentDetailPage } from './pages/StudentDetailPage.jsx';
import { InvoicesPage } from './pages/InvoicesPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { FeeStructuresPage } from './pages/FeeStructuresPage.jsx';
import { AcademicPage } from './pages/AcademicPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { SchoolSettingsPage } from './pages/SchoolSettingsPage.jsx';
import { AuditLogsPage } from './pages/AuditLogsPage.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="fee-structures" element={<FeeStructuresPage />} />
              <Route path="academic" element={<AcademicPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="staff" element={<SchoolSettingsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
