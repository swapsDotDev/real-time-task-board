import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import AdminMainPanel from '../../components/Admin/AdminMainPanel';
import MemberTaskManager from '../../components/Member/MemberTaskManager';
import { RoleBadge } from '../../components/Tasks/TaskActions';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { stats, fetchStats, isLoading } = useTasks();

  useEffect(() => {
    fetchStats();
  }, []);

  // Show admin dashboard for admin users
  if (isAdmin()) {
    return <AdminMainPanel />;
  }

  // Show member task manager for members
  if (user?.role === 'member') {
    return <MemberTaskManager />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Tasks',
      value: Object.values(stats.statusStats || {}).reduce((sum, count) => sum + count, 0),
      icon: CheckSquare,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'In Progress',
      value: stats.statusStats?.['In Progress'] || 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      title: 'Completed',
      value: stats.statusStats?.['Done'] || 0,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks || 0,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your tasks today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <RoleBadge role={user?.role} />
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Progress
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed this month</span>
              <span className="font-medium">
                {stats.monthlyCompletion?.completed || 0} / {stats.monthlyCompletion?.total || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${stats.monthlyCompletion?.rate || 0}%`
                }}
              />
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-primary-600">
                {stats.monthlyCompletion?.rate || 0}%
              </span>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Priority Distribution
          </h3>
          <div className="space-y-3">
            {[
              { priority: 'High', count: stats.priorityStats?.High || 0, color: 'bg-red-500' },
              { priority: 'Medium', count: stats.priorityStats?.Medium || 0, color: 'bg-yellow-500' },
              { priority: 'Low', count: stats.priorityStats?.Low || 0, color: 'bg-green-500' },
            ].map((item) => {
              const total = Object.values(stats.priorityStats || {}).reduce((sum, count) => sum + count, 0);
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              
              return (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {item.priority} Priority
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">
            Create New Task
          </button>
          <button className="btn-outline">
            View Kanban Board
          </button>
          <button className="btn-outline">
            Task Reports
          </button>
          <button className="btn-outline">
            Team Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
