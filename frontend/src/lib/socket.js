class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  connect(token) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    // Store current token for reconnection attempts
    this.currentToken = token;

    // Clean up any existing connection
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    // WebSocket connects to the base server URL with ws/wss protocol
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const protocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = apiUrl.replace(/^https?/, protocol).replace('/api', '');
    const socketUrl = `${baseUrl}/ws?token=${encodeURIComponent(token)}`;

    console.log('🔌 Connecting to WebSocket:', socketUrl.replace(/token=[^&]+/, 'token=[REDACTED]'));

    this.socket = new WebSocket(socketUrl);

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;
      
      // Handle different close codes
      if (event.code === 1008) {
        // Authentication failure - token revoked or invalid
        console.error('🚫 WebSocket authentication failed - token may be revoked');
        this.handleAuthenticationFailure();
      } else if (event.code !== 1000) {
        // Not a clean close, attempt reconnection
        this.handleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.isConnected = false;
    };

    this.socket.onmessage = (event) => {
      try {
        console.log('📨 Raw WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error, event.data);
      }
    };

    return this.socket;
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        // Get fresh token from localStorage
        const freshToken = localStorage.getItem('token');
        if (freshToken) {
          this.connect(freshToken);
        } else {
          console.error('No token available for reconnection');
          this.handleAuthenticationFailure();
        }
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.handleAuthenticationFailure();
    }
  }

  handleAuthenticationFailure() {
    console.error('🚫 WebSocket authentication failed - clearing local data');
    
    // Emit authentication failure event
    this.handleMessage({
      type: 'authenticationFailed',
      data: { message: 'WebSocket authentication failed, please login again' }
    });

    // Clear the connection
    this.disconnect();
  }

  handleMessage(message) {
    const { type, data } = message;
    const listeners = this.listeners.get(type);
    
    console.log(`📨 Received WebSocket message:`, type, data);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${type}:`, error, data);
        }
      });
    } else {
      console.warn(`No listeners for WebSocket event: ${type}`);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: event,
        ...data
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Method to update token for existing connection
  updateToken(newToken) {
    if (newToken && newToken !== this.currentToken) {
      console.log('🔄 Updating WebSocket token');
      this.currentToken = newToken;
      
      // Reconnect with new token if currently connected
      if (this.isConnected || this.socket) {
        this.disconnect();
        this.connect(newToken);
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Task-related methods
  joinTaskRoom(taskId) {
    this.emit('joinTaskRoom', { taskId });
  }

  leaveTaskRoom(taskId) {
    this.emit('leaveTaskRoom', { taskId });
  }

  // Typing indicators
  sendTyping(taskId, isTyping) {
    this.emit('typing', { taskId, isTyping });
  }

  // Status updates
  updateStatus(status) {
    this.emit('updateStatus', { status });
  }

  // Event listeners
  onTaskCreated(callback) {
    this.on('taskCreated', callback);
  }

  onTaskUpdated(callback) {
    this.on('taskUpdated', callback);
  }

  onTaskDeleted(callback) {
    this.on('taskDeleted', callback);
  }

  onCommentAdded(callback) {
    this.on('commentAdded', callback);
  }

  onTaskProgressUpdated(callback) {
    this.on('taskProgressUpdated', callback);
  }

  onTaskReassigned(callback) {
    this.on('taskReassigned', callback);
  }

  onConnectedUsers(callback) {
    this.on('connectedUsers', callback);
  }

  onNotification(callback) {
    this.on('notification', callback);
  }

  onUserTyping(callback) {
    this.on('userTyping', callback);
  }

  // Remove listeners
  removeAllListeners() {
    this.listeners.clear();
  }

  removeListener(event, callback) {
    this.off(event, callback);
  }
}

// Export singleton instance
export default new WebSocketService();
