import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Button,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Key as KeyIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { ClassData } from '../../types/collaboration';

interface ClassListProps {
  classes: ClassData[];
  currentUserId: string;
  onClassSelect: (classData: ClassData) => void | Promise<void>;
  onEditClass?: (classData: ClassData) => void;
  onDeleteClass?: (classId: string) => void;
  isLoading?: boolean;
}

export const ClassList: React.FC<ClassListProps> = ({
  classes,
  currentUserId,
  onClassSelect,
  onEditClass,
  onDeleteClass,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (classes.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom color="text.primary">
          No classes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get started by creating a new class or joining one with an invite code.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {classes.map((classData) => {
        const isTeacher = classData.teacher_id === currentUserId;
        const studentCount = classData.students?.length || 0;

        return (
          <Grid item xs={12} md={6} lg={4} key={classData.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => onClassSelect(classData)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h3" sx={{ flexGrow: 1, mr: 1 }}>
                    {classData.name}
                  </Typography>
                  
                  {isTeacher && (onEditClass || onDeleteClass) && (
                    <Box>
                      {onEditClass && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClass(classData);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onDeleteClass && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${classData.name}"?`)) {
                              onDeleteClass(classData.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
                
                {classData.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {classData.description}
                  </Typography>
                )}
                
                <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                  <Chip
                    label={isTeacher ? 'Teacher' : 'Student'}
                    color={isTeacher ? 'primary' : 'secondary'}
                    size="small"
                  />
                  
                  {!classData.is_active && (
                    <Chip
                      label="Inactive"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {studentCount} student{studentCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  {isTeacher && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <KeyIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {classData.invite_code}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};