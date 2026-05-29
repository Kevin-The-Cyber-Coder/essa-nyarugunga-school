import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AcademicsPage from './pages/AcademicsPage';
import AdmissionsPage from './pages/AdmissionsPage';
import NewsPage from './pages/NewsPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import NotFoundPage from './pages/NotFoundPage';

// Portals
import PortalLogin from './portals/PortalLogin';
import SuperAdminDashboard from './portals/SuperAdminDashboard';
import AcademicAdminDashboard from './portals/AcademicAdminDashboard';
import TeacherDashboard from './portals/TeacherDashboard';
import StudentDashboard from './portals/StudentDashboard';
import ParentDashboard from './portals/ParentDashboard';
import AccountsAdminDashboard from './portals/AccountsAdminDashboard';
import DisciplineAdminDashboard from './portals/DisciplineAdminDashboard'; 
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/academics" element={<AcademicsPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
        
        {/* Portal Login */}
        <Route path="/portal/login" element={<PortalLogin />} />
        
        {/* Protected Routes - Super Admin */}
        <Route 
          path="/portal/super-admin" 
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Academic Admin */}
        <Route 
          path="/portal/academic-admin" 
          element={
            <ProtectedRoute allowedRoles={['academic_admin']}>
              <AcademicAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Accounts Admin - FIXED */}
        <Route 
          path="/portal/accounts-admin" 
          element={
            <ProtectedRoute allowedRoles={['accounts_admin']}>
              <AccountsAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Discipline Admin */}
        <Route 
          path="/portal/discipline-admin" 
          element={
            <ProtectedRoute allowedRoles={['discipline_admin']}>
              <DisciplineAdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Teacher */}
        <Route 
          path="/portal/teacher" 
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Student */}
        <Route 
          path="/portal/student" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Routes - Parent */}
        <Route 
          path="/portal/parent" 
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;