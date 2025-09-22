/**
 * Authentication page that handles both login and registration.
 */

import React, { useState } from 'react';
import { Box, Container, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AppHeader } from '../components/layout/AppHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const AuthPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const switchToLogin = () => setTabValue(0);
  const switchToRegister = () => setTabValue(1);

  const handleLoginSuccess = () => {
    // Navigate to intended page or stay on current base URL
    const redirectTo = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    
    if (redirectTo && redirectTo !== '/auth') {
      navigate(redirectTo, { replace: true });
    } else {
      // Stay on the base URL or go to dashboard only if specifically requested
      navigate('/', { replace: true });
    }
  };

  const handleRegistrationSuccess = () => {
    // Same logic for registration
    const redirectTo = localStorage.getItem('redirectAfterLogin');
    localStorage.removeItem('redirectAfterLogin');
    
    if (redirectTo && redirectTo !== '/auth') {
      navigate(redirectTo, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <AppHeader />
      <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="authentication tabs"
          centered
        >
          <Tab label="Sign In" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
          <Tab label="Sign Up" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <LoginForm
          onSwitchToRegister={switchToRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <RegisterForm
          onSwitchToLogin={switchToLogin}
          onRegistrationSuccess={handleRegistrationSuccess}
        />
      </TabPanel>
    </Container>
    </>
  );
};