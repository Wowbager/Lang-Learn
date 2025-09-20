import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ContentPage } from './pages/ContentPage';
import { CollaborationPage } from './pages/CollaborationPage';
import { ProfileForm } from './components/auth/ProfileForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserRole } from './types/auth';
import { theme } from './theme';
import './App.css';

// Temporary dashboard component
const Dashboard: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <h1>Language Learning Chat Dashboard</h1>
    <p>Welcome to your learning dashboard!</p>
    <p>This is a protected area that requires authentication.</p>
  </Box>
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
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfileForm />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/content"
                element={
                  <ProtectedRoute>
                    <ContentPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/collaboration"
                element={
                  <ProtectedRoute>
                    <CollaborationPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Teacher-only routes example */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute requiredRole={UserRole.TEACHER}>
                    <Box sx={{ p: 3 }}>
                      <h1>Teacher Dashboard</h1>
                      <p>This area is only accessible to teachers.</p>
                    </Box>
                  </ProtectedRoute>
                }
              />
              
              {/* Default routes - show dashboard for authenticated users, auth for non-authenticated */}
              <Route path="/" element={
                <ProtectedRoute redirectTo="/auth">
                  <Dashboard />
                </ProtectedRoute>
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