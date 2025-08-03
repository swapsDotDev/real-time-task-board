import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { RoleBadge } from '../Tasks/TaskActions';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [managementData, setManagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks/admin/manage');
      setManagementData(response.data);
    } catch (err) {
      setError('Failed to fetch admin data');
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <p className="text-red-700">Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchAdminData}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const { tasks, summary } = managementData;

  const statsCards = [
    {
      title: 'Total Tasks',
      value: summary.total,
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      title: 'In Progress',
      value: summary.byStatus['In Progress'],
      icon: PlayCircleIcon,
      color: 'yellow'
    },
    {
      title: 'Completed',
      value: summary.byStatus['Done'],
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      icon: ExclamationTriangleIcon,
      color: 'red'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive task management overview</p>
        </div>
        <RoleBadge role="admin" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-6 border rounded-lg ${colorClasses[stat.color]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 opacity-75" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Management Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">All Tasks Management</h2>
          <p className="text-sm text-gray-600">Full administrative control over all tasks</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.slice(0, 10).map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{task.description}</p>
                      {task._metadata.isOverdue && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mt-1">
                          Overdue
                        </span>
                      )}
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
                        <p className="text-xs text-gray-500">{task.assigned_to?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {task.created_by?.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{task.created_by?.name}</p>
                        <p className="text-xs text-gray-500">{task.created_by?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {task._metadata.ageInDays} days
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                      <button className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                      <button className="text-green-600 hover:text-green-900 text-sm">Reassign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {tasks.length > 10 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing 10 of {tasks.length} tasks. 
              <button className="ml-2 text-blue-600 hover:text-blue-900">View all</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
