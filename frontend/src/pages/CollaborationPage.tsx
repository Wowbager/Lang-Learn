import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ClassForm } from '../components/collaboration/ClassForm';
import { ClassList } from '../components/collaboration/ClassList';
import { ClassDetail } from '../components/collaboration/ClassDetail';
import { JoinClassForm } from '../components/collaboration/JoinClassForm';
import { PermissionManager } from '../components/collaboration/PermissionManager';
import { collaborationService } from '../services/collaborationService';
import { ClassData, Permission, SharedContent } from '../types/collaboration';
import { AuthService } from '../services/authService';

type View = 'list' | 'create' | 'join' | 'detail' | 'edit' | 'permissions';

export const CollaborationPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedLearningSet, setSelectedLearningSet] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = AuthService.getStoredUser();
  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const classesData = await collaborationService.getUserClasses();
      setClasses(classesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassDetail = async (classData: ClassData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get detailed class info
      const detailedClass = await collaborationService.getClass(classData.id);
      setSelectedClass(detailedClass);
      
      // Get shared content for this class
      const allSharedContent = await collaborationService.getSharedContent();
      const classSharedContent = allSharedContent.filter(content => 
        content.shared_via === 'class' && content.class_name === classData.name
      );
      setSharedContent(classSharedContent);
      
      setCurrentView('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (classData: { name: string; description?: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.createClass(classData);
      await loadClasses();
      setCurrentView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClass = async (classData: { name: string; description?: string }) => {
    if (!selectedClass) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const updatedClass = await collaborationService.updateClass(selectedClass.id, classData);
      setSelectedClass(updatedClass);
      await loadClasses();
      setCurrentView('detail');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.deleteClass(classId);
      await loadClasses();
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
        setCurrentView('list');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinClass = async (inviteCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.joinClass(inviteCode);
      await loadClasses();
      setCurrentView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join class');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.removeStudent(selectedClass.id, studentId);
      await loadClassDetail(selectedClass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshareContent = async (learningSetId: string) => {
    if (!selectedClass) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.unshareContentFromClass(selectedClass.id, learningSetId);
      await loadClassDetail(selectedClass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unshare content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPermission = async (userId: string, role: 'viewer' | 'editor' | 'owner') => {
    if (!selectedLearningSet) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.grantPermission(userId, selectedLearningSet.id, role);
      const updatedPermissions = await collaborationService.getLearningSetPermissions(selectedLearningSet.id);
      setPermissions(updatedPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    if (!selectedLearningSet) return;
    
    try {
      setIsLoading(true);
      setError(null);
      await collaborationService.revokePermission(permissionId);
      const updatedPermissions = await collaborationService.getLearningSetPermissions(selectedLearningSet.id);
      setPermissions(updatedPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke permission');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <Paper elevation={1} sx={{ mb: 3 }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Classes & Collaboration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isTeacher ? 'Manage your classes and share content with students' : 'Join classes and access shared content'}
            </Typography>
          </Box>
          
          {currentView === 'list' && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!isTeacher && (
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setCurrentView('join')}
                >
                  Join Class
                </Button>
              )}
              {isTeacher && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCurrentView('create')}
                >
                  Create Class
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'create':
        return (
          <ClassForm
            onSubmit={handleCreateClass}
            onCancel={() => setCurrentView('list')}
            isLoading={isLoading}
          />
        );

      case 'edit':
        return selectedClass ? (
          <ClassForm
            onSubmit={handleUpdateClass}
            onCancel={() => setCurrentView('detail')}
            initialData={{
              name: selectedClass.name,
              description: selectedClass.description
            }}
            isLoading={isLoading}
          />
        ) : null;

      case 'join':
        return (
          <JoinClassForm
            onSubmit={handleJoinClass}
            onCancel={() => setCurrentView('list')}
            isLoading={isLoading}
          />
        );

      case 'detail':
        return selectedClass && currentUser ? (
          <ClassDetail
            classData={selectedClass}
            currentUserId={currentUser.id}
            sharedContent={sharedContent}
            onRemoveStudent={handleRemoveStudent}
            onUnshareContent={handleUnshareContent}
            onBack={() => setCurrentView('list')}
            isLoading={isLoading}
          />
        ) : null;

      case 'permissions':
        return selectedLearningSet && currentUser ? (
          <PermissionManager
            learningSetId={selectedLearningSet.id}
            learningSetName={selectedLearningSet.name}
            permissions={permissions}
            availableUsers={availableUsers}
            currentUserId={currentUser.id}
            onGrantPermission={handleGrantPermission}
            onRevokePermission={handleRevokePermission}
            onClose={() => setCurrentView('list')}
            isLoading={isLoading}
          />
        ) : null;

      default:
        return currentUser ? (
          <ClassList
            classes={classes}
            currentUserId={currentUser.id}
            onClassSelect={loadClassDetail}
            onEditClass={(classData) => {
              setSelectedClass(classData);
              setCurrentView('edit');
            }}
            onDeleteClass={handleDeleteClass}
            isLoading={isLoading}
          />
        ) : null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {renderHeader()}
        
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}
        
        <Box>
          {renderContent()}
        </Box>
      </Container>
    </Box>
  );
};