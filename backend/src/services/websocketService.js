import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import url from 'url';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.connectedUsers = new Map();
    this.taskRooms = new Map(); // Map of taskId -> Set of user connections
  }

  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.wss.on('connection', async (ws, req) => {
      try {
        // Extract token from query parameters
        const query = url.parse(req.url, true).query;
        const token = query.token;
        
        if (!token) {
          ws.close(1008, 'Authentication token required');
          return;
        }

        // Verify JWT token
        const decoded = verifyToken(token, 'access');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user || !user.isActive) {
          ws.close(1008, 'Invalid or inactive user');
          return;
        }

        // Attach user to request for handleConnection
        req.user = user;
        this.handleConnection(ws, req);
      } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    console.log('🔌 WebSocket server initialized');
  }

  handleConnection(ws, req) {
    const user = req.user;
    
    if (!user) {
      console.error('No user found in connection request');
      ws.close(1008, 'No user found');
      return;
    }

    const userId = user._id.toString();

    console.log(`🔌 User connected via WebSocket: ${user.name} (${user.email})`);

    // Store connection
    this.connectedUsers.set(userId, {
      ws,
      user: user.getPublicProfile(),
      connectedAt: new Date(),
      taskRooms: new Set()
    });

    // Send initial data
    this.sendToUser(userId, {
      type: 'connected',
      data: {
        message: 'Connected to WebSocket server',
        user: user.getPublicProfile()
      }
    });

    // Broadcast updated connected users list
    this.broadcastConnectedUsers();

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(userId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendToUser(userId, {
          type: 'error',
          data: { message: 'Invalid message format' }
        });
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(userId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${user.email}:`, error);
      this.handleDisconnection(userId);
    });
  }

  handleMessage(userId, message) {
    const { type, data } = message;
    const userConnection = this.connectedUsers.get(userId);

    if (!userConnection) {
      return;
    }

    switch (type) {
      case 'joinTaskRoom':
        this.joinTaskRoom(userId, data.taskId);
        break;

      case 'leaveTaskRoom':
        this.leaveTaskRoom(userId, data.taskId);
        break;

      case 'typing':
        this.handleTyping(userId, data);
        break;

      case 'ping':
        this.sendToUser(userId, { type: 'pong', data: { timestamp: Date.now() } });
        break;

      default:
        console.warn(`Unknown message type: ${type}`);
        this.sendToUser(userId, {
          type: 'error',
          data: { message: `Unknown message type: ${type}` }
        });
    }
  }

  handleDisconnection(userId) {
    const userConnection = this.connectedUsers.get(userId);
    
    if (userConnection) {
      console.log(`❌ User disconnected: ${userConnection.user.name}`);

      // Leave all task rooms
      userConnection.taskRooms.forEach(taskId => {
        this.leaveTaskRoom(userId, taskId, false);
      });

      // Remove from connected users
      this.connectedUsers.delete(userId);

      // Broadcast updated connected users list
      this.broadcastConnectedUsers();
    }
  }

  joinTaskRoom(userId, taskId) {
    const userConnection = this.connectedUsers.get(userId);
    if (!userConnection) return;

    // Add user to task room
    if (!this.taskRooms.has(taskId)) {
      this.taskRooms.set(taskId, new Set());
    }
    this.taskRooms.get(taskId).add(userId);
    userConnection.taskRooms.add(taskId);

    console.log(`📋 User ${userConnection.user.name} joined task room: ${taskId}`);

    this.sendToUser(userId, {
      type: 'joinedTaskRoom',
      data: { taskId, message: `Joined task room ${taskId}` }
    });
  }

  leaveTaskRoom(userId, taskId, sendConfirmation = true) {
    const userConnection = this.connectedUsers.get(userId);
    if (!userConnection) return;

    // Remove user from task room
    if (this.taskRooms.has(taskId)) {
      this.taskRooms.get(taskId).delete(userId);
      if (this.taskRooms.get(taskId).size === 0) {
        this.taskRooms.delete(taskId);
      }
    }
    userConnection.taskRooms.delete(taskId);

    console.log(`📋 User ${userConnection.user.name} left task room: ${taskId}`);

    if (sendConfirmation) {
      this.sendToUser(userId, {
        type: 'leftTaskRoom',
        data: { taskId, message: `Left task room ${taskId}` }
      });
    }
  }

  handleTyping(userId, data) {
    const userConnection = this.connectedUsers.get(userId);
    if (!userConnection) return;

    const { taskId, isTyping } = data;

    // Broadcast typing status to other users in the task room
    this.broadcastToTaskRoom(taskId, {
      type: 'userTyping',
      data: {
        user: userConnection.user,
        taskId,
        isTyping
      }
    }, userId); // Exclude the sender
  }

  // Broadcast methods
  broadcastConnectedUsers() {
    const connectedUsersList = Array.from(this.connectedUsers.values()).map(conn => conn.user);
    
    this.broadcast({
      type: 'connectedUsers',
      data: { users: connectedUsersList, count: connectedUsersList.length }
    });
  }

  broadcastToTaskRoom(taskId, message, excludeUserId = null) {
    const taskRoom = this.taskRooms.get(taskId);
    if (!taskRoom) return;

    taskRoom.forEach(userId => {
      if (userId !== excludeUserId) {
        this.sendToUser(userId, message);
      }
    });
  }

  broadcast(message) {
    this.connectedUsers.forEach((_, userId) => {
      this.sendToUser(userId, message);
    });
  }

  sendToUser(userId, message) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection && userConnection.ws.readyState === WebSocket.OPEN) {
      try {
        userConnection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to user ${userId}:`, error);
        this.handleDisconnection(userId);
      }
    }
  }

  // Public methods for broadcasting real-time updates
  broadcastTaskCreated(task, excludeUserId = null) {
    const message = {
      type: 'taskCreated',
      data: { task }
    };

    if (excludeUserId) {
      this.connectedUsers.forEach((_, userId) => {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      });
    } else {
      this.broadcast(message);
    }
  }

  broadcastTaskUpdated(task, changes = {}, excludeUserId = null) {
    const message = {
      type: 'taskUpdated',
      data: { task, changes }
    };

    // Send to task room and general broadcast
    this.broadcastToTaskRoom(task._id.toString(), message, excludeUserId);
    
    if (excludeUserId) {
      this.connectedUsers.forEach((_, userId) => {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      });
    } else {
      this.broadcast(message);
    }
  }

  broadcastTaskDeleted(taskId, excludeUserId = null) {
    const message = {
      type: 'taskDeleted',
      data: { taskId }
    };

    this.broadcastToTaskRoom(taskId, message, excludeUserId);
    
    if (excludeUserId) {
      this.connectedUsers.forEach((_, userId) => {
        if (userId !== excludeUserId) {
          this.sendToUser(userId, message);
        }
      });
    } else {
      this.broadcast(message);
    }
  }

  broadcastCommentAdded(taskId, comment, excludeUserId = null) {
    const message = {
      type: 'commentAdded',
      data: { taskId, comment }
    };

    this.broadcastToTaskRoom(taskId, message, excludeUserId);
  }

  // Get statistics
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeTaskRooms: this.taskRooms.size,
      totalConnections: Array.from(this.connectedUsers.values()).length
    };
  }

  // Broadcast progress update
  broadcastProgressUpdate(taskId, data) {
    this.broadcast({
      type: 'taskProgressUpdated',
      data: {
        taskId,
        ...data
      }
    });
  }

  // Close WebSocket server
  close() {
    if (this.wss) {
      this.wss.close();
      this.connectedUsers.clear();
      this.taskRooms.clear();
      console.log('🔌 WebSocket server closed');
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;
