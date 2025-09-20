import React, { useState } from 'react';
import { ClassData } from '../../types/collaboration';

interface Student {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface SharedContent {
  learning_set: {
    id: string;
    name: string;
    description?: string;
    created_by: string;
  };
  shared_via: string;
  class_name?: string;
  permission: string;
}

interface ClassDetailProps {
  classData: ClassData;
  currentUserId: string;
  sharedContent?: SharedContent[];
  onRemoveStudent?: (studentId: string) => void;
  onShareContent?: (learningSetId: string) => void;
  onUnshareContent?: (learningSetId: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const ClassDetail: React.FC<ClassDetailProps> = ({
  classData,
  currentUserId,
  sharedContent = [],
  onRemoveStudent,
  onShareContent,
  onUnshareContent,
  onBack,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'content'>('students');
  const isTeacher = classData.teacher_id === currentUserId;

  const tabs = [
    { id: 'students', name: 'Students', count: classData.students?.length || 0 },
    { id: 'content', name: 'Shared Content', count: sharedContent.length }
  ];

  return (
    <div className="class-detail">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
              {classData.description && (
                <p className="mt-1 text-sm text-gray-600">{classData.description}</p>
              )}
            </div>
          </div>
          
          {isTeacher && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Invite Code:</span>
                <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                  {classData.invite_code}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-4 sm:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'students' | 'content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6">
        {activeTab === 'students' && (
          <div className="students-tab">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {classData.students && classData.students.length > 0 ? (
                  <div className="space-y-3">
                    {classData.students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {student.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {student.full_name}
                            </p>
                            <p className="text-sm text-gray-500">@{student.username}</p>
                          </div>
                        </div>
                        
                        {isTeacher && onRemoveStudent && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${student.full_name} from this class?`)) {
                                onRemoveStudent(student.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Students can join using the invite code: <span className="font-mono">{classData.invite_code}</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-tab">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {sharedContent.length > 0 ? (
                  <div className="space-y-3">
                    {sharedContent.map((content) => (
                      <div
                        key={content.learning_set.id}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {content.learning_set.name}
                          </h4>
                          {content.learning_set.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {content.learning_set.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                              content.permission === 'owner' ? 'bg-purple-100 text-purple-800' :
                              content.permission === 'editor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {content.permission}
                            </span>
                            <span>Shared via {content.shared_via}</span>
                          </div>
                        </div>
                        
                        {isTeacher && onUnshareContent && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Unshare "${content.learning_set.name}" from this class?`)) {
                                onUnshareContent(content.learning_set.id);
                              }
                            }}
                            className="ml-4 text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Unshare
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No shared content</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Share learning sets with this class to help students practice.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};