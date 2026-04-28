// src/App.jsx
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

// Portals
import PortalLogin from './portals/PortalLogin';
import StudentDashboard from './portals/StudentDashboard';
import TeacherDashboard from './portals/TeacherDashboard';
import ParentDashboard from './portals/ParentDashboard';
import SuperAdminDashboard from './portals/SuperAdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('portalToken');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) {
    return <Navigate to="/portal/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/portal/login" replace />;
  }
  
  return children;
};

import { Navigate } from 'react-router-dom';

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
        
        {/* Portal Login */}
        <Route path="/portal/login" element={<PortalLogin />} />
        
        {/* Protected Portal Routes */}
        <Route path="/portal/super-admin" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/portal/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/portal/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/portal/parent" element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;