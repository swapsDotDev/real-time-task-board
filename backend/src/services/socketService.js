import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Store connected users
const connectedUsers = new Map();

// Handle socket connection
export const handleSocketConnection = (socket, io) => {
  console.log(`🔌 User connected: ${socket.user.name} (${socket.user.email})`);
  
  // Store user connection
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user.getPublicProfile(),
    connectedAt: new Date()
  });

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);
  
  // Join user to a general room for broadcasts
  socket.join('all_users');

  // Send connected users list to all clients
  broadcastConnectedUsers(io);

  // Handle joining task-specific rooms
  socket.on('joinTaskRoom', (taskId) => {
    socket.join(`task_${taskId}`);
    console.log(`📋 User ${socket.user.email} joined task room: ${taskId}`);
  });

  // Handle leaving task-specific rooms
  socket.on('leaveTaskRoom', (taskId) => {
    socket.leave(`task_${taskId}`);
    console.log(`📋 User ${socket.user.email} left task room: ${taskId}`);
  });

  // Handle real-time typing indicators for comments
  socket.on('typing', (data) => {
    socket.to(`task_${data.taskId}`).emit('userTyping', {
      user: socket.user.getPublicProfile(),
      taskId: data.taskId,
      isTyping: data.isTyping
    });
  });

  // Handle user status updates
  socket.on('updateStatus', (status) => {
    const userConnection = connectedUsers.get(socket.userId);
    if (userConnection) {
      userConnection.status = status;
      broadcastConnectedUsers(io);
    }
  });

  // Handle task assignment notifications
  socket.on('taskAssigned', (data) => {
    const { taskId, assignedUserId, taskTitle } = data;
    
    // Send notification to assigned user
    io.to(`user_${assignedUserId}`).emit('notification', {
      type: 'task_assigned',
      message: `You have been assigned to task: ${taskTitle}`,
      taskId,
      from: socket.user.getPublicProfile(),
      timestamp: new Date()
    });
  });

  // Handle task status change notifications
  socket.on('taskStatusChanged', (data) => {
    const { taskId, newStatus, taskTitle, assignedUserId, createdBy } = data;
    
    // Notify task creator if different from current user
    if (createdBy !== socket.userId) {
      io.to(`user_${createdBy}`).emit('notification', {
        type: 'task_status_changed',
        message: `Task "${taskTitle}" status changed to: ${newStatus}`,
        taskId,
        from: socket.user.getPublicProfile(),
        timestamp: new Date()
      });
    }

    // Notify assigned user if different from current user
    if (assignedUserId !== socket.userId && assignedUserId !== createdBy) {
      io.to(`user_${assignedUserId}`).emit('notification', {
        type: 'task_status_changed',
        message: `Task "${taskTitle}" status changed to: ${newStatus}`,
        taskId,
        from: socket.user.getPublicProfile(),
        timestamp: new Date()
      });
    }
  });

  // Handle comment notifications
  socket.on('commentAdded', (data) => {
    const { taskId, taskTitle, assignedUserId, createdBy } = data;
    
    // Notify task creator if different from current user
    if (createdBy !== socket.userId) {
      io.to(`user_${createdBy}`).emit('notification', {
        type: 'comment_added',
        message: `New comment on task: ${taskTitle}`,
        taskId,
        from: socket.user.getPublicProfile(),
        timestamp: new Date()
      });
    }

    // Notify assigned user if different from current user and creator
    if (assignedUserId !== socket.userId && assignedUserId !== createdBy) {
      io.to(`user_${assignedUserId}`).emit('notification', {
        type: 'comment_added',
        message: `New comment on task: ${taskTitle}`,
        taskId,
        from: socket.user.getPublicProfile(),
        timestamp: new Date()
      });
    }
  });

  // Handle private messages (for future use)
  socket.on('privateMessage', (data) => {
    const { recipientId, message } = data;
    
    io.to(`user_${recipientId}`).emit('privateMessage', {
      from: socket.user.getPublicProfile(),
      message,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.user.name} - Reason: ${reason}`);
    
    // Remove user from connected users
    connectedUsers.delete(socket.userId);
    
    // Broadcast updated connected users list
    broadcastConnectedUsers(io);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for user ${socket.user.email}:`, error);
  });

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to Real-Time Task Board',
    user: socket.user.getPublicProfile(),
    timestamp: new Date()
  });
};

// Broadcast connected users to all clients
const broadcastConnectedUsers = (io) => {
  const users = Array.from(connectedUsers.values()).map(conn => ({
    ...conn.user,
    status: conn.status || 'online',
    connectedAt: conn.connectedAt
  }));

  io.to('all_users').emit('connectedUsers', users);
};

// Utility function to send notification to specific user
export const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user_${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date()
  });
};

// Utility function to broadcast to all users
export const broadcastToAll = (io, event, data) => {
  io.to('all_users').emit(event, {
    ...data,
    timestamp: new Date()
  });
};

// Utility function to send to specific task room
export const sendToTaskRoom = (io, taskId, event, data) => {
  io.to(`task_${taskId}`).emit(event, {
    ...data,
    timestamp: new Date()
  });
};

// Get connected users (for API endpoints)
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values()).map(conn => ({
    ...conn.user,
    status: conn.status || 'online',
    connectedAt: conn.connectedAt
  }));
};

// Check if user is online
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

// Get user's socket ID
export const getUserSocketId = (userId) => {
  const connection = connectedUsers.get(userId.toString());
  return connection ? connection.socketId : null;
};
