import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { adminAPI } from '../../lib/api';
import { RoleBadge } from '../Tasks/TaskActions';
import AdminTaskManager from './AdminTaskManager';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  Cog6ToothIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const AdminMainPanel = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [managementData, setManagementData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [managementResponse, usersResponse] = await Promise.all([
        adminAPI.getManagementData(),
        api.get('/users')
      ]);
      
      setManagementData(managementResponse.data);
      setUsers(usersResponse.data.users || []);
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
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const { tasks, summary } = managementData || { tasks: [], summary: {} };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'tasks', name: 'Task Management', icon: ListBulletIcon },
    { id: 'users', name: 'Users', icon: UsersIcon }
  ];

  const statsCards = [
    {
      title: 'Total Tasks',
      value: summary.total || 0,
      icon: ChartBarIcon,
      color: 'blue'
    },
    {
      title: 'In Progress',
      value: summary.byStatus?.['In Progress'] || 0,
      icon: PlayCircleIcon,
      color: 'yellow'
    },
    {
      title: 'Completed',
      value: summary.byStatus?.['Done'] || 0,
      icon: CheckCircleIcon,
      color: 'green'
    },
    {
      title: 'Overdue',
      value: summary.overdue || 0,
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Comprehensive task and user management</p>
          </div>
          <RoleBadge role="admin" />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content with Scrolling */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* Team Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <RoleBadge role={user.role} className="text-xs" />
                  </div>
                ))}
                {users.length > 5 && (
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View all {users.length} members
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-sm text-gray-500">
                        Assigned to: {task.assigned_to?.name || 'Unassigned'}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      task.status === 'Done' ? 'bg-green-100 text-green-800' :
                      task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Manage all tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="h-full">
          <AdminTaskManager 
            tasks={tasks} 
            users={users} 
            onDataChange={fetchData}
          />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="h-full flex flex-col">
          <div className="bg-white border rounded-lg overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600">Manage team members and their roles</p>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Tasks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const assignedTasks = tasks.filter(task => task.assigned_to?._id === user._id);
                    return (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.name?.[0] || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {assignedTasks.length} tasks
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminMainPanel;
