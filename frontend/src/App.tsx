import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ContentPage } from './pages/ContentPage';
import { CollaborationPage } from './pages/CollaborationPage';
import DashboardPage from './pages/DashboardPage';
import { ProfileForm } from './components/auth/ProfileForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { UserRole } from './types/auth';
import { theme } from './theme';
import './App.css';



// Wrapper component for protected routes with layout
const ProtectedRouteWithLayout: React.FC<{
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}> = ({ children, requiredRole, redirectTo = '/auth' }) => (
  <ProtectedRoute requiredRole={requiredRole} redirectTo={redirectTo}>
    <AppLayout>
      {children}
    </AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRouteWithLayout>
                    <DashboardPage />
                  </ProtectedRouteWithLayout>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRouteWithLayout>
                    <ProfileForm />
                  </ProtectedRouteWithLayout>
                }
              />
              
              <Route
                path="/content"
                element={
                  <ProtectedRouteWithLayout>
                    <ContentPage />
                  </ProtectedRouteWithLayout>
                }
              />
              
              <Route
                path="/collaboration"
                element={
                  <ProtectedRouteWithLayout>
                    <CollaborationPage />
                  </ProtectedRouteWithLayout>
                }
              />
              
              {/* Teacher-only routes example */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRouteWithLayout requiredRole={UserRole.TEACHER}>
                    <Box sx={{ p: 3 }}>
                      <h1>Teacher Dashboard</h1>
                      <p>This area is only accessible to teachers.</p>
                    </Box>
                  </ProtectedRouteWithLayout>
                }
              />
              
              {/* Default routes - show dashboard for authenticated users, auth for non-authenticated */}
              <Route path="/" element={
                <ProtectedRouteWithLayout redirectTo="/auth">
                  <DashboardPage />
                </ProtectedRouteWithLayout>
              } />
              
              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;