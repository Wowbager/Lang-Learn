import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  MenuBook,
  Group,
  TrendingUp,
  School,
  Person,
  ArrowForward,
  PlayArrow,
  Assignment,
  EmojiEvents,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  roles?: UserRole[];
}

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  progress?: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Feature cards for quick access
  const featureCards: FeatureCard[] = [
    {
      id: 'content',
      title: 'Learning Content',
      description: 'Browse and access learning materials, lessons, and resources',
      icon: <MenuBook />,
      path: '/content',
      color: '#1976d2',
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      description: 'Join classes, work with peers, and participate in group activities',
      icon: <Group />,
      path: '/collaboration',
      color: '#388e3c',
    },
    {
      id: 'teacher-dashboard',
      title: 'Teacher Tools',
      description: 'Manage classes, create content, and track student progress',
      icon: <School />,
      path: '/teacher-dashboard',
      color: '#f57c00',
      roles: [UserRole.TEACHER],
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Update your profile information and learning preferences',
      icon: <Person />,
      path: '/profile',
      color: '#7b1fa2',
    },
  ];

  // Mock learning statistics (in a real app, this would come from an API)
  const learningStats: StatCard[] = [
    {
      label: 'Lessons Completed',
      value: 12,
      icon: <Assignment />,
      color: '#1976d2',
      progress: 60,
    },
    {
      label: 'Current Streak',
      value: '5 days',
      icon: <TrendingUp />,
      color: '#388e3c',
    },
    {
      label: 'Achievements',
      value: 8,
      icon: <EmojiEvents />,
      color: '#f57c00',
    },
  ];

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT:
        return 'Student';
      case UserRole.TEACHER:
        return 'Teacher';
      case UserRole.PARENT:
        return 'Parent';
      default:
        return 'User';
    }
  };

  // Filter feature cards based on user role
  const availableFeatures = featureCards.filter(
    (feature) => !feature.roles || feature.roles.includes(user?.role || UserRole.STUDENT)
  );

  return (
    <Box 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4 }, 
        pt: { xs: 3, sm: 4 }, 
        maxWidth: 1200, 
        mx: 'auto',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              mr: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
              {getGreeting()}, {user?.full_name || user?.username}!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={getRoleDisplayName(user?.role || UserRole.STUDENT)}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
              {user?.grade_level && (
                <Chip
                  label={`Grade ${user.grade_level}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
          Ready to continue your learning journey? Explore your content, collaborate with others, and track your progress.
        </Typography>
      </Paper>

      {/* Learning Statistics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
          Your Progress
        </Typography>
        <Grid container spacing={2}>
          {learningStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={1}
                sx={{
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    elevation: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ pb: stat.progress !== undefined ? 1 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: `${stat.color}15`,
                        color: stat.color,
                        mr: 2,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                  {stat.progress !== undefined && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={stat.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: `${stat.color}15`,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: stat.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {stat.progress}% complete
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick Access Features */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Access
        </Typography>
        <Grid container spacing={3}>
          {availableFeatures.map((feature) => (
            <Grid item xs={12} sm={6} md={6} lg={3} key={feature.id}>
              <Card
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-4px)',
                  },
                }}
                onClick={() => handleFeatureClick(feature.path)}
              >
                <CardContent sx={{ flex: 1, pb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: `${feature.color}15`,
                        color: feature.color,
                        mr: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flex: 1 }}>
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 2, pt: 1 }}>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    sx={{
                      color: feature.color,
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: `${feature.color}08`,
                      },
                    }}
                    fullWidth
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Activity Section */}
      <Box>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
          Continue Learning
        </Typography>
        <Card elevation={1}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Recent Lesson: Spanish Conversation Basics
              </Typography>
              <Chip label="In Progress" color="primary" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Continue where you left off with interactive conversation practice and vocabulary building.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => navigate('/content')}
                sx={{ minWidth: 140 }}
              >
                Continue
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/content')}
                sx={{ minWidth: 140 }}
              >
                View All Lessons
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DashboardPage;