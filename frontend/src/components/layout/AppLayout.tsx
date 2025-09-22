import React, { useState, useCallback } from 'react';
import {
  Box,
  useTheme,
  Drawer,
  Toolbar,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { AppHeader } from './AppHeader';
import { Navigation } from './Navigation';

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
  showNavigation = true,
}) => {
  const theme = useTheme();
  
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

  // Drawer width for navigation
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

      {/* Navigation Drawer - Always temporary (hamburger menu) */}
      {showNavigation && (
        <Drawer
          variant="temporary"
          open={layoutState.sidebarOpen}
          onClose={handleSidebarClose}
          ModalProps={{
            keepMounted: true, // Better open performance
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundColor: theme.custom.colors.background.elevated,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {/* Drawer Header */}
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: theme.spacing(1),
              minHeight: '64px !important',
            }}
          >
            <IconButton
              onClick={handleSidebarClose}
              aria-label="close navigation menu"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
          
          {/* Navigation Component */}
          <Navigation
            variant="mobile"
            onItemClick={handleSidebarClose}
            showBreadcrumbs={true}
          />
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
          width: '100%',
        }}
      >
        {/* Toolbar spacer to push content below fixed AppBar */}
        {showNavigation && (
          <Toolbar 
            sx={{ 
              minHeight: '64px !important',
              '@media (min-width:0px)': {
                minHeight: '64px',
              },
              '@media (min-width:600px)': {
                minHeight: '64px',
              },
            }} 
          />
        )}
        
        {/* Page Content Container */}
        <Box
          sx={{
            flexGrow: 1,
            backgroundColor: theme.custom.colors.background.subtle,
            minHeight: showNavigation ? 'calc(100vh - 64px)' : '100vh',
            width: '100%',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;