import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { adminAPI, taskAPI } from '../../lib/api';
import KanbanBoard from '../Tasks/KanbanBoard';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';


const AdminTaskManager = ({ tasks: initialTasks, users: initialUsers, onDataChange }) => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [users, setUsers] = useState(initialUsers || []);
  const [loading, setLoading] = useState(!initialTasks);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    assigned_to: '',
    due_date: '',
    tags: [],
    estimatedHours: ''
  });

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
    }
    if (initialUsers) {
      setUsers(initialUsers);
    }
  }, [initialTasks, initialUsers]);

  useEffect(() => {
    if (isAdmin() && !initialTasks) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, usersResponse] = await Promise.all([
        adminAPI.getManagementData(),
        api.get('/users')
      ]);
      
      setTasks(tasksResponse.data.tasks);
      setUsers(usersResponse.data.users || []);
      
      // Notify parent component of data change
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createTask(formData);
      setShowCreateModal(false);
      resetForm();
      
      // Add the new task to the local state
      setTasks(prev => [response.data.task, ...prev]);
      
      // Notify parent component
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.updateTask(selectedTask._id, formData);
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
      
      // Update the task in local state
      setTasks(prev => prev.map(task => 
        task._id === selectedTask._id ? response.data.task : task
      ));
      
      // Notify parent component
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await adminAPI.deleteTask(taskId);
        
        // Remove task from local state
        setTasks(prev => prev.filter(task => task._id !== taskId));
        
        // Notify parent component
        if (onDataChange) {
          onDataChange();
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  const handleReassignTask = async (taskId, newAssigneeId) => {
    try {
      const response = await adminAPI.reassignTask(taskId, newAssigneeId);
      
      // Update task in local state
      setTasks(prev => prev.map(task => 
        task._id === taskId ? response.data.task : task
      ));
      
      // Notify parent component
      if (onDataChange) {
        onDataChange();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reassign task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      assigned_to: '',
      due_date: '',
      tags: [],
      estimatedHours: ''
    });
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to._id,
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      tags: task.tags,
      estimatedHours: task.estimatedHours || ''
    });
    setShowEditModal(true);
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Create, edit, and manage all tasks</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableCellsIcon className="h-4 w-4" />
                <span className="text-sm">Table</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('kanban');
                  navigate('/board');
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span className="text-sm">Kanban</span>
              </button>

            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Content Area with Scrolling */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <div className="h-full">
            <KanbanBoard />
          </div>
        ) : (
          <div className="h-full overflow-auto bg-white border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.status === 'Done' ? 'bg-green-100 text-green-800' :
                          task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {task.assigned_to?.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{task.assigned_to?.name || 'Unassigned'}</p>
                            <select
                              value={task.assigned_to?._id || ''}
                              onChange={(e) => handleReassignTask(task._id, e.target.value)}
                              className="text-xs text-gray-500 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded"
                            >
                              <option value="">Unassigned</option>
                              {users.map(user => (
                                <option key={user._id} value={user._id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Edit Task"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Delete Task"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <TaskFormModal
          title="Create New Task"
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={handleCreateTask}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <TaskFormModal
          title="Edit Task"
          formData={formData}
          setFormData={setFormData}
          users={users}
          onSubmit={handleUpdateTask}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
            resetForm();
          }}
        />
      )}
    </div>
  );
};

// Task Form Modal Component
const TaskFormModal = ({ title, formData, setFormData, users, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.5"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {title.includes('Create') ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTaskManager;
