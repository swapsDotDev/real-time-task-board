import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  CalendarDaysIcon, 
  UserIcon, 
  ChatBubbleLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import TaskActions from './TaskActions';

const TaskCard = ({ task, onEdit, onDelete, onComment }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Priority colors
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Check if task is overdue
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  // Format date
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg border shadow-sm p-2 mb-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'rotate-3 scale-105 z-50' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
    >
      {/* Priority Badge */}
      {task.priority && (
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {isOverdue && (
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" title="Overdue" />
          )}
        </div>
      )}

      {/* Task Title */}
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div className={`flex items-center text-xs mb-3 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
          <CalendarDaysIcon className="h-4 w-4 mr-1" />
          <span>{formatDate(task.due_date)}</span>
          {isOverdue && <span className="ml-1 font-medium">(Overdue)</span>}
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Assigned User */}
        <div className="flex items-center text-xs text-gray-500">
          {task.assigned_to ? (
            <div className="flex items-center">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-2">
                {task.assigned_to.avatar ? (
                  <img
                    src={task.assigned_to.avatar}
                    alt={task.assigned_to.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <UserIcon className="h-3 w-3 text-indigo-600" />
                )}
              </div>
              <span className="truncate max-w-20">{task.assigned_to.name}</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>Unassigned</span>
            </div>
          )}
        </div>

        {/* Comments Count */}
        {task.comments && task.comments.length > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
            <span>{task.comments.length}</span>
          </div>
        )}

        {/* Task Actions */}
        <TaskActions
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onComment={onComment}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Created/Updated Info */}
      <div className="text-xs text-gray-400 mt-2 flex items-center">
        <ClockIcon className="h-3 w-3 mr-1" />
        <span>
          Created {new Date(task.createdAt).toLocaleDateString()}
          {task.created_by && ` by ${task.created_by.name}`}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
