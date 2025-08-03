import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { memberAPI } from '../../lib/api';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  PlayCircleIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MemberTaskManager = () => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    description: '',
    actualHours: ''
  });
  const [progressData, setProgressData] = useState({
    progress: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssignedTasks();
  }, [filterStatus, filterPriority]);

  const fetchAssignedTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      
      const response = await memberAPI.getAssignedTasks(params);
      setAssignedTasks(response.data.tasks);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch assigned tasks');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await memberAPI.updateAssignedTask(selectedTask._id, formData);
      setShowEditModal(false);
      setSelectedTask(null);
      resetForm();
      
      // Update the task in local state
      setAssignedTasks(prev => prev.map(task => 
        task._id === selectedTask._id ? response.data.task : task
      ));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    try {
      await memberAPI.addProgress(selectedTask._id, progressData);
      setShowProgressModal(false);
      setSelectedTask(null);
      resetProgressForm();
      await fetchAssignedTasks(); // Refresh to show the new progress comment
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add progress update');
    }
  };

  const resetForm = () => {
    setFormData({
      status: '',
      description: '',
      actualHours: ''
    });
  };

  const resetProgressForm = () => {
    setProgressData({
      progress: '',
      notes: ''
    });
  };

  const openEditModal = (task) => {
    setSelectedTask(task);
    setFormData({
      status: task.status,
      description: task.description,
      actualHours: task.actualHours || ''
    });
    setShowEditModal(true);
  };

  const openProgressModal = (task) => {
    setSelectedTask(task);
    setShowProgressModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    return dueDate && new Date(dueDate) < new Date() && status !== 'Done';
  };

  // Calculate task statistics
  const taskStats = {
    total: assignedTasks.length,
    todo: assignedTasks.filter(t => t.status === 'To Do').length,
    inProgress: assignedTasks.filter(t => t.status === 'In Progress').length,
    done: assignedTasks.filter(t => t.status === 'Done').length,
    overdue: assignedTasks.filter(t => isOverdue(t.due_date, t.status)).length
  };

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Tasks</h1>
        <p className="text-gray-600">Tasks assigned to you - update status and add progress</p>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 bg-gray-500 rounded"></div>
            <div>
              <p className="text-sm text-gray-600">To Do</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.todo}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <PlayCircleIcon className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Done</p>
              <p className="text-2xl font-bold text-gray-900">{taskStats.done}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          {(filterStatus || filterPriority) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('');
                  setFilterPriority('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                Clear Filters
              </button>
            </div>
          )}
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

      {assignedTasks.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
          <p className="text-gray-600">You don't have any tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignedTasks.map((task) => (
            <div key={task._id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  <p className="text-gray-600 mt-1">{task.description}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created by:</span> {task.created_by?.name}
                </div>
                <div>
                  <span className="font-medium">Due date:</span> 
                  {task.due_date ? (
                    <span className={isOverdue(task.due_date, task.status) ? 'text-red-600 font-medium' : ''}>
                      {new Date(task.due_date).toLocaleDateString()}
                      {isOverdue(task.due_date, task.status) && ' (Overdue)'}
                    </span>
                  ) : (
                    'No due date'
                  )}
                </div>
                <div>
                  <span className="font-medium">Estimated:</span> {task.estimatedHours || 0}h
                  {task.actualHours && ` | Actual: ${task.actualHours}h`}
                </div>
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(task.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openProgressModal(task)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-4 w-4" />
                    <span>Add Progress</span>
                  </button>
                  <button
                    onClick={() => openEditModal(task)}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Update Task</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Task</h2>
            <p className="text-gray-600 mb-4">Update the status and details of your assigned task</p>
            
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Add or update task description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Hours</label>
                <input
                  type="number"
                  value={formData.actualHours}
                  onChange={(e) => setFormData({ ...formData, actualHours: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.5"
                  placeholder="Hours worked on this task"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTask(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Progress Update</h2>
            <p className="text-gray-600 mb-4">Share your progress on: <strong>{selectedTask.title}</strong></p>
            
            <form onSubmit={handleAddProgress} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                <input
                  type="number"
                  value={progressData.progress}
                  onChange={(e) => setProgressData({ ...progressData, progress: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  placeholder="e.g., 75"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
                <textarea
                  value={progressData.notes}
                  onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Describe what you've accomplished, any blockers, or next steps..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressModal(false);
                    setSelectedTask(null);
                    resetProgressForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberTaskManager;
