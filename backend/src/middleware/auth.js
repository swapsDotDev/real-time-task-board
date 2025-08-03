import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

// Middleware to authenticate JWT tokens
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.message === 'Token has been revoked') {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Middleware to check if user is admin or task owner/assignee
export const requireTaskAccess = (operation = 'read') => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id;
      const userId = req.user._id;
      const userRole = req.user.role;

      // Import Task model here to avoid circular dependency
      const Task = (await import('../models/Task.js')).default;
      const task = await Task.findById(taskId);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Admin can do anything
      if (userRole === 'admin') {
        req.task = task;
        return next();
      }

      // Role-based access control for members
      switch (operation) {
        case 'read':
        case 'view':
          // Members can view all tasks (for team collaboration)
          req.task = task;
          return next();

        case 'edit':
        case 'update':
          // Members can only edit tasks assigned to them
          if (task.assigned_to && task.assigned_to.toString() === userId.toString()) {
            req.task = task;
            return next();
          }
          return res.status(403).json({ 
            error: 'Members can only edit tasks assigned to them' 
          });

        case 'delete':
          // Members can only delete tasks they created
          if (task.created_by.toString() === userId.toString()) {
            req.task = task;
            return next();
          }
          return res.status(403).json({ 
            error: 'Members can only delete tasks they created' 
          });

        case 'comment':
          // Members can comment on any task (for team collaboration)
          req.task = task;
          return next();

        default:
          return res.status(403).json({ error: 'Access denied' });
      }

    } catch (error) {
      console.error('Task access middleware error:', error);
      return res.status(500).json({ error: 'Access check failed' });
    }
  };
};

// Socket.IO authentication middleware
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token, 'access');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return next(new Error('Invalid or inactive user'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};
