import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Protected pages
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import BusinessUnits from './pages/BusinessUnits';
import Sales from './pages/Sales';
import Cashflows from './pages/Cashflows';
import Renditions from './pages/Renditions';
import Goals from './pages/Goals';
import Bonuses from './pages/Bonuses';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// Error pages
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';
import ServerError from './pages/errors/ServerError';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/*" element={
            <PublicRoute>
              <Routes>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
              </Routes>
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/*" element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  {/* Dashboard - All users */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Admin Only Routes */}
                  <Route path="/companies" element={
                    <PrivateRoute requiredRole="admin">
                      <Companies />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/users" element={
                    <PrivateRoute requiredRole="admin">
                      <UserManagement />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/reports" element={
                    <PrivateRoute requiredRole="admin">
                      <Reports />
                    </PrivateRoute>
                  } />

                  {/* Admin & Manager Routes */}
                  <Route path="/business-units" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <BusinessUnits />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/cashflows" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <Cashflows />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/renditions" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <Renditions />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/goals" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <Goals />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/bonuses" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <Bonuses />
                    </PrivateRoute>
                  } />
                  
                  <Route path="/alerts" element={
                    <PrivateRoute requiredRoles={["admin", "manager"]}>
                      <Alerts />
                    </PrivateRoute>
                  } />

                  {/* All Users Routes */}
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Error Routes */}
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="/error" element={<ServerError />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}