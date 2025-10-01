import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  Dashboard,
  MenuBook,
  Group,
  School,
  Person,
  Chat,
  ExpandLess,
  ExpandMore,
  Home,
  NavigateNext,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: NavigationItem[];
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface NavigationProps {
  variant?: 'desktop' | 'mobile';
  onItemClick?: (item: NavigationItem) => void;
  showBreadcrumbs?: boolean;
  className?: string;
}

// Navigation items configuration
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <Dashboard />,
    description: 'Overview and quick access to features',
  },
  {
    id: 'content',
    label: 'Content',
    path: '/content',
    icon: <MenuBook />,
    description: 'Browse and manage learning materials',
  },
  {
    id: 'chat',
    label: 'Chat',
    path: '/chat',
    icon: <Chat />,
    description: 'Practice with AI language tutor',
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    path: '/collaboration',
    icon: <Group />,
    description: 'Join classes and collaborate with others',
  },
  {
    id: 'teacher-dashboard',
    label: 'Teacher Dashboard',
    path: '/teacher-dashboard',
    icon: <School />,
    roles: ['teacher'],
    description: 'Manage classes and student progress',
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: <Person />,
    description: 'Manage your account settings',
  },
];

export const Navigation: React.FC<NavigationProps> = ({
  variant = 'desktop',
  onItemClick,
  showBreadcrumbs = true,
  className,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  // Filter navigation items based on user role
  const getFilteredNavigationItems = (): NavigationItem[] => {
    return navigationItems.filter(item => {
      if (!item.roles) return true;
      return user && item.roles.includes(user.role);
    });
  };

  // Generate breadcrumbs based on current location
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/dashboard', icon: <Home /> }
    ];

    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      const item = navigationItems.find(nav => nav.path === currentPath);
      if (item) {
        breadcrumbs.push({
          label: item.label,
          path: currentPath,
          icon: item.icon,
        });
      }
    });

    return breadcrumbs;
  };

  // Handle navigation item click
  const handleItemClick = (item: NavigationItem, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Handle expandable items
    if (item.children && item.children.length > 0) {
      toggleExpanded(item.id);
      return;
    }

    try {
      // Navigate to the item
      navigate(item.path);
      
      // Call optional callback
      if (onItemClick) {
        onItemClick(item);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Gracefully handle navigation errors without breaking the UI
    }
  };

  // Toggle expanded state for items with children
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Check if item is currently active
  const isActiveItem = (item: NavigationItem): boolean => {
    return location.pathname === item.path;
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, item: NavigationItem) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleItemClick(item, event as any);
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPreviousItem();
        break;
      case 'ArrowRight':
        if (item.children && item.children.length > 0) {
          event.preventDefault();
          if (!expandedItems.has(item.id)) {
            toggleExpanded(item.id);
          }
        }
        break;
      case 'ArrowLeft':
        if (item.children && expandedItems.has(item.id)) {
          event.preventDefault();
          toggleExpanded(item.id);
        }
        break;
    }
  };

  // Focus management for keyboard navigation
  const focusNextItem = () => {
    const items = getFilteredNavigationItems();
    const currentIndex = items.findIndex(item => item.id === focusedItem);
    const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    setFocusedItem(items[nextIndex].id);
  };

  const focusPreviousItem = () => {
    const items = getFilteredNavigationItems();
    const currentIndex = items.findIndex(item => item.id === focusedItem);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    setFocusedItem(items[prevIndex].id);
  };

  // Auto-expand parent items of active page
  useEffect(() => {
    const findParentItem = (targetPath: string, items: NavigationItem[]): string | null => {
      for (const item of items) {
        if (item.children) {
          const childMatch = item.children.find(child => child.path === targetPath);
          if (childMatch) {
            return item.id;
          }
        }
      }
      return null;
    };

    const parentId = findParentItem(location.pathname, navigationItems);
    if (parentId) {
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(parentId);
        return newSet;
      });
    }
  }, [location.pathname]);

  // Render navigation item
  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const isActive = isActiveItem(item);
    const isExpanded = expandedItems.has(item.id);
    const isFocused = focusedItem === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItem
          disablePadding
          sx={{
            pl: depth * 2,
            transition: theme.transitions.create(['background-color', 'transform'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.short,
            }),
          }}
        >
          <ListItemButton
            onClick={(event) => handleItemClick(item, event)}
            onKeyDown={(event) => handleKeyDown(event, item)}
            onFocus={() => setFocusedItem(item.id)}
            onBlur={() => setFocusedItem(null)}
            selected={isActive}
            tabIndex={0}
            sx={{
              minHeight: 48,
              borderRadius: theme.shape.borderRadius,
              mx: 1,
              mb: 0.5,
              transition: theme.transitions.create(['all'], {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.short,
              }),
              backgroundColor: isActive 
                ? theme.palette.primary.main + '20'
                : 'transparent',
              color: isActive 
                ? theme.palette.primary.main 
                : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: isActive 
                  ? theme.palette.primary.main + '30'
                  : theme.palette.action.hover,
                transform: 'translateX(4px)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '30',
                },
              },
              ...(isFocused && {
                backgroundColor: theme.palette.action.focus,
              }),
            }}
            aria-label={`Navigate to ${item.label}${item.description ? `: ${item.description}` : ''}`}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-current={isActive ? 'page' : undefined}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive 
                  ? theme.palette.primary.main 
                  : theme.palette.text.secondary,
                transition: theme.transitions.create(['color'], {
                  easing: theme.transitions.easing.easeInOut,
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              {item.icon}
            </ListItemIcon>
            
            <ListItemText
              primary={item.label}
              secondary={variant === 'desktop' && !isMobile ? item.description : undefined}
              primaryTypographyProps={{
                fontWeight: isActive ? theme.typography.fontWeightMedium : theme.typography.fontWeightRegular,
                fontSize: '0.875rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
              }}
            />
            
            {hasChildren && (
              <Box
                sx={{
                  transition: theme.transitions.create(['transform'], {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.short,
                  }),
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {/* Render children with collapse animation */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavigationItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // Render breadcrumbs
  const renderBreadcrumbs = () => {
    if (!showBreadcrumbs || location.pathname === '/dashboard') return null;

    const breadcrumbs = generateBreadcrumbs();
    
    return (
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.custom.colors.background.subtle,
        }}
      >
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="navigation breadcrumbs"
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: theme.palette.text.secondary,
            },
          }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast || !crumb.path) {
              return (
                <Box
                  key={crumb.path || crumb.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: theme.palette.text.primary,
                    fontWeight: theme.typography.fontWeightMedium,
                  }}
                >
                  {crumb.icon && (
                    <Box sx={{ mr: 0.5, display: 'flex', fontSize: '1rem' }}>
                      {crumb.icon}
                    </Box>
                  )}
                  <Typography variant="body2" color="inherit">
                    {crumb.label}
                  </Typography>
                </Box>
              );
            }

            return (
              <Link
                key={crumb.path}
                component="button"
                variant="body2"
                onClick={() => navigate(crumb.path!)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: theme.palette.text.secondary,
                  textDecoration: 'none',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                    borderRadius: theme.shape.borderRadius,
                  },
                }}
                aria-label={`Navigate to ${crumb.label}`}
              >
                {crumb.icon && (
                  <Box sx={{ mr: 0.5, display: 'flex', fontSize: '1rem' }}>
                    {crumb.icon}
                  </Box>
                )}
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
    );
  };

  const filteredItems = getFilteredNavigationItems();

  return (
    <Box
      ref={navigationRef}
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.custom.colors.background.elevated,
      }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Breadcrumbs */}
      {renderBreadcrumbs()}

      {/* Navigation Items */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Fade in timeout={300}>
          <List
            sx={{
              pt: 2,
              pb: 1,
              '& .MuiListItemButton-root': {
                borderRadius: theme.shape.borderRadius,
              },
            }}
            role="menubar"
          >
            {filteredItems.map(item => renderNavigationItem(item))}
          </List>
        </Fade>
      </Box>

      {/* Footer section for additional info */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.custom.colors.background.subtle,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Language Learning Chat
        </Typography>
      </Box>
    </Box>
  );
};

export default Navigation;