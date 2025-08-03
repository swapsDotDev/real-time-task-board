import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PencilIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const TaskActions = ({ task, onEdit, onDelete, onComment, className = "" }) => {
  const { user, isAdmin } = useAuth();

  // Check if user can edit this task
  const canEdit = () => {
    if (isAdmin()) return true;
    // Members can only edit tasks assigned to them
    return task.assigned_to?._id === user._id;
  };

  // Check if user can delete this task
  const canDelete = () => {
    if (isAdmin()) return true;
    // Members can only delete tasks they created
    return task.created_by?._id === user._id;
  };

  // Everyone can comment
  const canComment = () => true;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Comment button - available to all users */}
      {canComment() && onComment && (
        <button
          onClick={() => onComment(task)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="Add Comment"
        >
          <ChatBubbleLeftIcon className="h-4 w-4" />
        </button>
      )}

      {/* Edit button - Admin: all tasks, Member: only assigned tasks */}
      {canEdit() && onEdit && (
        <button
          onClick={() => onEdit(task)}
          className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
          title={isAdmin() ? "Edit Task (Admin)" : "Edit Assigned Task"}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      )}

      {/* Delete button - Admin: all tasks, Member: only created tasks */}
      {canDelete() && onDelete && (
        <button
          onClick={() => onDelete(task)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title={isAdmin() ? "Delete Task (Admin)" : "Delete Created Task"}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}

      {/* Role indicator */}
      {!canEdit() && !canDelete() && (
        <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded-full">
          View Only
        </span>
      )}
    </div>
  );
};

// Role-based permission helper component
export const RolePermissions = ({ children, requireAdmin = false, requireTaskAccess = null, task = null }) => {
  const { user, isAdmin } = useAuth();

  // Admin access check
  if (requireAdmin && !isAdmin()) {
    return null;
  }

  // Task-specific access check
  if (requireTaskAccess && task) {
    const hasAccess = (() => {
      if (isAdmin()) return true;
      
      switch (requireTaskAccess) {
        case 'edit':
          return task.assigned_to?._id === user._id;
        case 'delete':
          return task.created_by?._id === user._id;
        case 'view':
        case 'comment':
          return true;
        default:
          return false;
      }
    })();

    if (!hasAccess) return null;
  }

  return children;
};

// Role badge component
export const RoleBadge = ({ role, className = "" }) => {
  const badgeStyles = {
    admin: "bg-purple-100 text-purple-800 border-purple-200",
    member: "bg-blue-100 text-blue-800 border-blue-200"
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${badgeStyles[role] || 'bg-gray-100 text-gray-800 border-gray-200'} ${className}`}>
      {role === 'admin' ? '👑 Admin' : '👤 Member'}
    </span>
  );
};

export default TaskActions;
