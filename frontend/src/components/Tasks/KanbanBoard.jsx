//real-time-task-board\frontend\src\components\Tasks\KanbanBoard.jsx
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { 
  PlusIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import { tasksAPI, usersAPI } from '../../services/api';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import toast from 'react-hot-toast';

const KanbanBoard = () => {
  const { user } = useAuth();
  const { 
    tasks, 
    boardData,
    isLoading,
    fetchTasks,
    fetchBoardData,
    createTask,
    updateTask,
    deleteTask,
    moveTask
  } = useTasks();
  
  // State management
  const [users, setUsers] = useState([]);
  const [columns] = useState([
    { id: 'To Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Done', title: 'Done' }
  ]);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [modalInitialStatus, setModalInitialStatus] = useState('To Do');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Drag state
  const [activeTask, setActiveTask] = useState(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load initial data function
  const loadInitialData = async () => {
    try {
      // Load board data (organized by status)
      await fetchBoardData();
      
      // Load users
      const usersResponse = await usersAPI.getUsers();
      setUsers(usersResponse.data.users || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Get all tasks from boardData for filtering
  const allTasks = Object.values(boardData).flat();

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesAssignee = !filterAssignee || task.assigned_to?._id === filterAssignee;
    
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Group filtered tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter(task => task.status === column.id);
    return acc;
  }, {});

  // Drag handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const task = allTasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
  const { active, over } = event;

  // If nothing changed, clear overlay and exit
  if (!over || active.id === over.id) {
    setActiveTask(null);
    return;
  }

  const activeTask = allTasks.find(t => t._id === active.id);
  const newStatus = over.id;

  // Only update if the status is different
  if (columns.some(col => col.id === newStatus) && activeTask.status !== newStatus) {
    try {
      // Keep the DragOverlay visible until the optimistic update + refresh completes
      await moveTask(active.id, newStatus);
      await fetchBoardData(); // refresh data after move
      //toast.success(`Task moved to ${newStatus}`);
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error('Failed to move task');
    }
  }

  // Clear active task after processing so the overlay doesn't disappear too early
  setActiveTask(null);
};


  // Task management handlers
  const handleAddTask = (status = 'To Do') => {
    setEditingTask(null);
    setModalInitialStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (task) => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTask(task._id);
        toast.success('Task deleted successfully');
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleCommentTask = (task) => {
    // TODO: Implement comment modal/functionality
    console.log(`Opening comments for task: ${task.title}`);
    toast.info('Comments feature coming soon!');
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask._id, taskData);
        toast.success('Task updated successfully');
      } else {
        // Create new task
        await createTask(taskData);
        toast.success('Task created successfully');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPriority('');
    setFilterAssignee('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
  <div className="flex items-center justify-between mb-2">
    <h1 className="text-xl font-semibold text-gray-900">Kanban Board</h1>
    <button
      onClick={() => handleAddTask()}
      className="btn-primary flex items-center space-x-1 text-sm px-3 py-1.5"
    >
      <PlusIcon className="h-4 w-4" />
      <span>Add</span>
    </button>
  </div>

  {/* Search and Filters */}
  <div className="flex items-center space-x-2">
    {/* Search */}
    <div className="flex-1 max-w-md relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* Filter Toggle */}
    <button
      onClick={() => setShowFilters(!showFilters)}
      className={`btn-outline flex items-center space-x-1 text-sm px-3 py-1.5 ${showFilters ? 'bg-gray-100' : ''}`}
    >
      <FunnelIcon className="h-4 w-4" />
      <span>Filters</span>
    </button>

    {/* Settings */}
    <button className="btn-outline px-3 py-1.5">
      <AdjustmentsHorizontalIcon className="h-5 w-5" />
    </button>
  </div>

  {/* Filter Panel */}
  {showFilters && (
    <div className="mt-3 p-3 bg-gray-50 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Priority Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full btn-outline text-sm py-1.5"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Task Summary */}
  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600">
    <span>Total: {filteredTasks.length}</span>
    <span>To Do: {tasksByStatus['To Do']?.length || 0}</span>
    <span>In Progress: {tasksByStatus['In Progress']?.length || 0}</span>
    <span>Done: {tasksByStatus['Done']?.length || 0}</span>
    <span className="text-red-600">
      Overdue: {filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length}
    </span>
  </div>
</div>


      {/* Kanban Board */}
      <div className="flex-1 kanban-container bg-gray-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-columns flex space-x-6 p-6 h-full">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onCommentTask={handleCommentTask}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="scale-90 shadow-md rounded-md">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onComment={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="loading-spinner"></div>
              <span className="text-gray-600">Loading tasks...</span>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        users={users}
        initialStatus={modalInitialStatus}
      />
    </div>
  );
};

export default KanbanBoard;
