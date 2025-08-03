import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API functions
export const adminAPI = {
  // Get admin management data
  getManagementData: () => api.get('/tasks/admin/manage'),
  
  // Create task as admin
  createTask: (taskData) => api.post('/tasks/admin/create', taskData),
  
  // Update any task as admin
  updateTask: (taskId, taskData) => api.put(`/tasks/admin/${taskId}`, taskData),
  
  // Delete any task as admin
  deleteTask: (taskId) => api.delete(`/tasks/admin/${taskId}`),
  
  // Reassign task as admin
  reassignTask: (taskId, assignedTo) => api.put(`/tasks/admin/${taskId}/reassign`, { assigned_to: assignedTo }),
};

// Member API functions
export const memberAPI = {
  // Get tasks assigned to current member
  getAssignedTasks: (params = {}) => api.get('/tasks/member/assigned', { params }),
  
  // Update assigned task as member (limited fields)
  updateAssignedTask: (taskId, taskData) => api.put(`/tasks/member/${taskId}`, taskData),
  
  // Add progress update to assigned task
  addProgress: (taskId, progressData) => api.post(`/tasks/member/${taskId}/progress`, progressData),
};

// General task API functions (existing functionality)
export const taskAPI = {
  // Get all tasks (filtered by role)
  getTasks: (params = {}) => api.get('/tasks', { params }),
  
  // Get task by ID
  getTask: (taskId) => api.get(`/tasks/${taskId}`),
  
  // Get tasks for board view
  getBoard: () => api.get('/tasks/board'),
  
  // Get task statistics
  getStats: () => api.get('/tasks/stats'),
  
  // Create task (general)
  createTask: (taskData) => api.post('/tasks', taskData),
  
  // Update task (with role-based restrictions)
  updateTask: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  
  // Delete task (with role-based restrictions)
  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  
  // Add comment to task
  addComment: (taskId, commentData) => api.post(`/tasks/${taskId}/comments`, commentData),
};

export default api;
