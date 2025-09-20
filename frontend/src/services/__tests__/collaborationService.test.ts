import { collaborationService } from '../collaborationService';
import { authService } from '../authService';

// Mock authService
jest.mock('../authService');
const mockAuthService = jest.mocked(authService);

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('CollaborationService', () => {
  const mockToken = 'mock-token';
  const baseUrl = 'http://localhost:8000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.getToken.mockReturnValue(mockToken);
  });

  describe('createClass', () => {
    it('creates a class successfully', async () => {
      const classData = { name: 'Test Class', description: 'Test Description' };
      const responseData = {
        id: '1',
        name: 'Test Class',
        description: 'Test Description',
        teacher_id: 'teacher1',
        invite_code: 'ABC12345',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.createClass(classData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify(classData),
        }
      );
      expect(result).toEqual(responseData);
    });

    it('throws error on failed request', async () => {
      const classData = { name: 'Test Class' };
      const errorResponse = { detail: 'Only teachers can create classes' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => errorResponse,
      } as Response);

      await expect(collaborationService.createClass(classData)).rejects.toThrow(
        'Only teachers can create classes'
      );
    });
  });

  describe('getUserClasses', () => {
    it('gets user classes successfully', async () => {
      const responseData = [
        {
          id: '1',
          name: 'Math Class',
          teacher_id: 'teacher1',
          invite_code: 'MATH1234',
          is_active: true,
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.getUserClasses();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('getClass', () => {
    it('gets class details successfully', async () => {
      const classId = '1';
      const responseData = {
        id: '1',
        name: 'Math Class',
        teacher_id: 'teacher1',
        invite_code: 'MATH1234',
        is_active: true,
        students: [],
        created_at: '2023-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.getClass(classId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('updateClass', () => {
    it('updates class successfully', async () => {
      const classId = '1';
      const updates = { name: 'Updated Class Name' };
      const responseData = {
        id: '1',
        name: 'Updated Class Name',
        teacher_id: 'teacher1',
        invite_code: 'MATH1234',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.updateClass(classId, updates);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify(updates),
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('deleteClass', () => {
    it('deletes class successfully', async () => {
      const classId = '1';
      const responseData = { message: 'Class deleted successfully' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.deleteClass(classId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('joinClass', () => {
    it('joins class successfully', async () => {
      const inviteCode = 'ABC12345';
      const responseData = { message: 'Successfully joined class: Math Class' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.joinClass(inviteCode);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ invite_code: inviteCode }),
        }
      );
      expect(result).toEqual(responseData);
    });

    it('throws error for invalid invite code', async () => {
      const inviteCode = 'INVALID1';
      const errorResponse = { detail: 'Invalid invite code or class not active' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      } as Response);

      await expect(collaborationService.joinClass(inviteCode)).rejects.toThrow(
        'Invalid invite code or class not active'
      );
    });
  });

  describe('removeStudent', () => {
    it('removes student successfully', async () => {
      const classId = '1';
      const studentId = 'student1';
      const responseData = { message: 'Student john removed from class' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.removeStudent(classId, studentId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}/students/${studentId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('shareContentWithClass', () => {
    it('shares content successfully', async () => {
      const classId = '1';
      const learningSetId = 'set1';
      const responseData = { message: 'Learning set shared with class' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.shareContentWithClass(classId, learningSetId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}/share/${learningSetId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('unshareContentFromClass', () => {
    it('unshares content successfully', async () => {
      const classId = '1';
      const learningSetId = 'set1';
      const responseData = { message: 'Learning set unshared from class' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.unshareContentFromClass(classId, learningSetId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes/${classId}/share/${learningSetId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('grantPermission', () => {
    it('grants permission successfully', async () => {
      const userId = 'user1';
      const learningSetId = 'set1';
      const role = 'viewer';
      const responseData = {
        id: 'perm1',
        user_id: userId,
        learning_set_id: learningSetId,
        role: role,
        granted_by: 'teacher1',
        granted_at: '2023-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.grantPermission(userId, learningSetId, role as any);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({
            user_id: userId,
            learning_set_id: learningSetId,
            role: role,
          }),
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('getLearningSetPermissions', () => {
    it('gets permissions successfully', async () => {
      const learningSetId = 'set1';
      const responseData = [
        {
          id: 'perm1',
          user_id: 'user1',
          learning_set_id: learningSetId,
          role: 'viewer',
          granted_by: 'teacher1',
          granted_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.getLearningSetPermissions(learningSetId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/permissions/learning-set/${learningSetId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('revokePermission', () => {
    it('revokes permission successfully', async () => {
      const permissionId = 'perm1';
      const responseData = { message: 'Permission revoked successfully' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.revokePermission(permissionId);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/permissions/${permissionId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('getSharedContent', () => {
    it('gets shared content successfully', async () => {
      const responseData = [
        {
          learning_set: {
            id: 'set1',
            name: 'Math Set',
            created_by: 'teacher1'
          },
          shared_via: 'class',
          class_name: 'Math Class',
          permission: 'viewer'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      const result = await collaborationService.getSharedContent();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/shared-content`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(collaborationService.getUserClasses()).rejects.toThrow('Network error');
    });

    it('handles response without error details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); },
        headers: new Headers(),
        statusText: 'Internal Server Error',
        type: 'basic',
        url: '',
        redirected: false,
        clone: jest.fn(),
        text: async () => '',
        blob: async () => new Blob(),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => new FormData(),
        body: null,
        bodyUsed: false,
        bytes: async () => new Uint8Array(),
      } as unknown as Response);

      await expect(collaborationService.getUserClasses()).rejects.toThrow('An error occurred');
    });

    it('handles requests without authentication token', async () => {
      mockAuthService.getToken.mockReturnValue(null);

      const classData = { name: 'Test Class' };
      const responseData = { id: '1', name: 'Test Class' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      } as Response);

      await collaborationService.createClass(classData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/collaboration/classes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classData),
        }
      );
    });
  });
});