import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  Toolbar,
  IconButton,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AppHeader } from './AppHeader';

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNavigation?: boolean;
}

interface LayoutState {
  sidebarOpen: boolean;
  currentPage: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = 'Language Learning Chat',
  showNavigation = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Layout state management
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarOpen: false,
    currentPage: '',
  });

  // Handle sidebar toggle
  const handleSidebarToggle = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      sidebarOpen: !prev.sidebarOpen,
    }));
  }, []);

  // Handle sidebar close
  const handleSidebarClose = useCallback(() => {
    setLayoutState(prev => ({
      ...prev,
      sidebarOpen: false,
    }));
  }, []);

  // Drawer width for desktop navigation
  const drawerWidth = 280;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Header */}
      {showNavigation && (
        <AppHeader
          onMenuToggle={handleSidebarToggle}
          showMenuButton={true}
        />
      )}

      {/* Navigation Drawer */}
      {showNavigation && (
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? layoutState.sidebarOpen : true}
          onClose={handleSidebarClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme.custom.colors.background.elevated,
              borderRight: `1px solid ${theme.palette.divider}`,
              ...(isMobile && {
                backgroundColor: theme.custom.colors.background.elevated,
              }),
            },
          }}
        >
          {/* Drawer Header */}
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-end' : 'center',
              px: theme.spacing(1),
              minHeight: '64px !important',
            }}
          >
            {isMobile && (
              <IconButton
                onClick={handleSidebarClose}
                aria-label="close navigation menu"
              >
                <CloseIcon />
              </IconButton>
            )}
          </Toolbar>
          
          {/* Navigation content will be added in future tasks */}
          <Box
            sx={{
              p: theme.spacing(2),
              color: theme.palette.text.secondary,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2">
              Navigation menu will be implemented in the next task
            </Typography>
          </Box>
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ...(showNavigation && {
            marginLeft: isMobile ? 0 : `${drawerWidth}px`,
          }),
        }}
      >
        {/* Toolbar spacer to push content below fixed AppBar */}
        {showNavigation && <Toolbar />}
        
        {/* Page Content Container */}
        <Container
          maxWidth="xl"
          sx={{
            flexGrow: 1,
            py: theme.custom.spacing.section / 8, // Convert to theme spacing units
            px: {
              xs: theme.spacing(2),
              sm: theme.spacing(3),
              md: theme.spacing(4),
            },
            backgroundColor: theme.custom.colors.background.subtle,
            minHeight: showNavigation ? 'calc(100vh - 64px)' : '100vh',
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default AppLayout;