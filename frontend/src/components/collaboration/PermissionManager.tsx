import React, { useState, useEffect } from 'react';

export interface Permission {
  id: string;
  user_id: string;
  learning_set_id: string;
  role: 'viewer' | 'editor' | 'owner';
  granted_by: string;
  granted_at: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface PermissionManagerProps {
  learningSetId: string;
  learningSetName: string;
  permissions: Permission[];
  availableUsers: User[];
  currentUserId: string;
  onGrantPermission: (userId: string, role: 'viewer' | 'editor' | 'owner') => void;
  onRevokePermission: (permissionId: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  learningSetId,
  learningSetName,
  permissions,
  availableUsers,
  currentUserId,
  onGrantPermission,
  onRevokePermission,
  onClose,
  isLoading = false
}) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor' | 'owner'>('viewer');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users who don't already have permissions
  const usersWithPermissions = new Set(permissions.map(p => p.user_id));
  const availableUsersForGrant = availableUsers.filter(user => 
    !usersWithPermissions.has(user.id) && 
    user.id !== currentUserId &&
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGrantPermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedRole) {
      onGrantPermission(selectedUser, selectedRole);
      setSelectedUser('');
      setSelectedRole('viewer');
      setSearchTerm('');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.full_name : 'Unknown User';
  };

  const getUserUsername = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.username : 'unknown';
  };

  return (
    <div className="permission-manager">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Manage Permissions</h3>
              <p className="text-sm text-gray-600">{learningSetName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Grant Permission Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Grant New Permission</h4>
            <form onSubmit={handleGrantPermission} className="space-y-3">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                    disabled={isLoading}
                  />
                  {searchTerm && availableUsersForGrant.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded-md bg-white">
                      {availableUsersForGrant.slice(0, 5).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user.id);
                            setSearchTerm(user.full_name);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-gray-500">@{user.username}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'viewer' | 'editor' | 'owner')}
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  disabled={isLoading}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="submit"
                  disabled={!selectedUser || isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Grant
                </button>
              </div>
            </form>
          </div>

          {/* Current Permissions */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Current Permissions</h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {permissions.length > 0 ? (
                  <div className="space-y-2">
                    {permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-xs">
                                {getUserName(permission.user_id).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getUserName(permission.user_id)}
                            </p>
                            <p className="text-xs text-gray-500">
                              @{getUserUsername(permission.user_id)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(permission.role)}`}>
                            {permission.role}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm(`Revoke ${permission.role} access for ${getUserName(permission.user_id)}?`)) {
                                onRevokePermission(permission.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No additional permissions granted
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};