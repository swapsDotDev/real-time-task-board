import api from '../lib/api';

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Tasks API
export const tasksAPI = {
  // Get all tasks with filters
  getTasks: (params = {}) => api.get('/tasks', { params }),
  
  // Get Kanban board data
  getBoard: (params = {}) => api.get('/tasks/board', { params }),
  
  // Get task statistics
  getStats: () => api.get('/tasks/stats'),
  
  // Get single task
  getTask: (id) => api.get(`/tasks/${id}`),
  
  // Create task
  createTask: (taskData) => api.post('/tasks', taskData),
  
  // Update task
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  
  // Delete task
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Add comment
  addComment: (id, commentData) => api.post(`/tasks/${id}/comments`, commentData),
};

// Users API
export const usersAPI = {
  // Get all users
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // Get current user's tasks
  getMyTasks: (params = {}) => api.get('/users/me/tasks', { params }),
  
  // Get user profile
  getUser: (id) => api.get(`/users/${id}`),
  
  // Get user's tasks
  getUserTasks: (id, params = {}) => api.get(`/users/${id}/tasks`, { params }),
  
  // Admin only endpoints
  updateUserRole: (id, roleData) => api.put(`/users/${id}/role`, roleData),
  updateUserStatus: (id, statusData) => api.put(`/users/${id}/status`, statusData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats/overview'),
};

// Generic API error handler
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { data, status } = error.response;
    return {
      message: data.error || data.message || 'An error occurred',
      status,
      details: data.details || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0,
      details: null,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      details: null,
    };
  }
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};
