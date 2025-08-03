//real-time-task-board\frontend\src\components\Tasks\KanbanColumn.jsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusIcon } from '@heroicons/react/24/outline';
import TaskCard from './TaskCard';

const KanbanColumn = ({ 
  column, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onCommentTask 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  // Column colors
  const getColumnColors = (status) => {
    switch (status.toLowerCase().replace(' ', '-')) {
      case 'to-do':
        return {
          header: 'bg-slate-100 text-slate-800',
          border: 'border-slate-200',
          count: 'bg-slate-200 text-slate-700'
        };
      case 'in-progress':
        return {
          header: 'bg-blue-100 text-blue-800',
          border: 'border-blue-200',
          count: 'bg-blue-200 text-blue-700'
        };
      case 'done':
        return {
          header: 'bg-green-100 text-green-800',
          border: 'border-green-200',
          count: 'bg-green-200 text-green-700'
        };
      default:
        return {
          header: 'bg-gray-100 text-gray-800',
          border: 'border-gray-200',
          count: 'bg-gray-200 text-gray-700'
        };
    }
  };

  const colors = getColumnColors(column.title);

  return (
    <div className="bg-gray-50 rounded-md p-3 w-80 flex-shrink-0 flex flex-col text-sm">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${colors.header}`}>
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-sm">{column.title}</h2>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.count}`}>
            {tasks.length}
          </span>
        </div>
        
        {/* Add Task Button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
          title={`Add task to ${column.title}`}
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Drop Zone with Scrolling */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 rounded-lg transition-all duration-200 column-content
          ${isOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 'border-2 border-transparent'}
        `}
      >
        {/* Tasks */}
        <SortableContext items={tasks.map(task => task._id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 p-0.5">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onComment={onCommentTask}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <div className="w-12 h-12 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Drop tasks here or click + to add
                  </p>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Column Footer with Quick Stats */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-between text-xs text-gray-500">
            <div className="flex space-x-3">
              <span>High: {tasks.filter(t => t.priority === 'High').length}</span>
              <span>Med: {tasks.filter(t => t.priority === 'Medium').length}</span>
              <span>Low: {tasks.filter(t => t.priority === 'Low').length}</span>
            </div>
            <div>
              Overdue: {tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
