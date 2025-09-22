import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  Dashboard,
  School,
  Group,
  MenuBook,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export interface AppHeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
  },
  {
    label: 'Content',
    path: '/content',
    icon: <MenuBook />,
  },
  {
    label: 'Collaboration',
    path: '/collaboration',
    icon: <Group />,
  },
  {
    label: 'Teacher Dashboard',
    path: '/teacher-dashboard',
    icon: <School />,
    roles: ['teacher'],
  },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuToggle,
  showMenuButton = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleNavigationClick = (path: string) => {
    navigate(path);
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const getFilteredNavigationItems = () => {
    return navigationItems.filter(item => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    });
  };

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem?.label || 'Language Learning Chat';
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        boxShadow: theme.custom.shadows.card,
        transition: theme.transitions.create(['background-color'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
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
      >
        {/* Menu button - always visible */}
        {showMenuButton && (
          <IconButton
            color="inherit"
            aria-label="open navigation menu"
            edge="start"
            onClick={onMenuToggle}
            sx={{
              mr: 2,
              transition: theme.transitions.create(['transform'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.short,
              }),
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* App branding and current page context */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: theme.typography.fontWeightMedium,
              color: 'inherit',
              textDecoration: 'none',
              mr: 2,
            }}
          >
            Language Learning Chat
          </Typography>
          
          {/* Current page indicator */}
          {!isMobile && location.pathname !== '/' && (
            <Chip
              label={getCurrentPageTitle()}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'inherit',
                fontWeight: theme.typography.fontWeightMedium,
              }}
            />
          )}
        </Box>



        {/* User info and profile menu */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* User greeting - hidden on mobile */}
            {!isMobile && (
              <Typography
                variant="body2"
                sx={{
                  mr: 2,
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              >
                Welcome, {user.full_name || user.username}
              </Typography>
            )}

            {/* User avatar and menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
              sx={{
                transition: theme.transitions.create(['transform'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.short,
                }),
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: theme.palette.secondary.main,
                  fontSize: '0.875rem',
                  fontWeight: theme.typography.fontWeightMedium,
                }}
              >
                {(user.full_name || user.username).charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* Profile menu */}
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
          sx={{
            '& .MuiPaper-root': {
              backgroundColor: theme.custom.colors.background.elevated,
              boxShadow: theme.custom.shadows.elevated,
              borderRadius: theme.shape.borderRadius * 2,
              mt: 1,
              minWidth: 200,
            },
          }}
        >
          {user && (
            <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
                {user.full_name || user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Chip
                label={user.role}
                size="small"
                sx={{
                  mt: 0.5,
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          )}
          
          <MenuItem
            onClick={handleProfileClick}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Person sx={{ mr: 2 }} />
            Profile Settings
          </MenuItem>
          
          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.5,
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.light + '20',
              },
            }}
          >
            <Logout sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;