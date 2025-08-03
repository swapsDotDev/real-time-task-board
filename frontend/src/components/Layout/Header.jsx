import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../contexts/TaskContext';
import { 
  Bell, 
  Search, 
  Plus, 
  LogOut, 
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/helpers';

const Header = () => {
  const { user, logout } = useAuth();
  const { connectedUsers } = useTasks();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">


            {/* Online Users */}
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {connectedUsers.slice(0, 3).map((user, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white"
                    title={user.name}
                  >
                    <span className="text-xs font-medium text-primary-600">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                ))}
                {connectedUsers.length > 3 && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-medium text-gray-600">
                      +{connectedUsers.length - 3}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {connectedUsers.length} online
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-400 hover:text-gray-600 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium">Notifications</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-500 text-center">No new notifications</p>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 mobile-hide">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {user?.email}
                    </div>
                    
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md mt-1">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                    
                    <button className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    
                    <hr className="my-1" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
