import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/sonner';

interface SocketServiceOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onError?: (error: any) => void;
  onTyping?: (data: { user: string }) => void;
  onStopTyping?: (data: { user: string }) => void;
  onStatus?: (data: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private options: SocketServiceOptions = {};

  constructor() {
    this.socket = null;
  }

  connect(token: string, options: SocketServiceOptions = {}) {
    if (this.socket && this.socket.connected) {
      
      return;
    }

    this.options = options;
    
   const baseURL = import.meta.env.VITE_WSS_URL || 'http://localhost:5000';

// Update this code to include the path parameter
  this.socket = io(baseURL, {
    query: { token },
    path: '/api/socket.io',  // Add this line to match your Nginx proxy configuration
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    timeout: 10000
  });
    this.registerEvents();

    return this.socket;
  }

  private registerEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      
      if (this.options.onConnect) {
        this.options.onConnect();
      }
    });

    this.socket.on('disconnect', () => {
      
      if (this.options.onDisconnect) {
        this.options.onDisconnect();
      }
    });

    this.socket.on('message', (data) => {
      
      if (this.options.onMessage) {
        this.options.onMessage(data);
      }
    });

    this.socket.on('typing', (data) => {
      if (this.options.onTyping) {
        this.options.onTyping(data);
      }
    });

    this.socket.on('stop_typing', (data) => {
      if (this.options.onStopTyping) {
        this.options.onStopTyping(data);
      }
    });

    this.socket.on('status', (data) => {
      console.log('Status event received:', data);
      if (this.options.onStatus) {
        // Backend sends: { user: "John", message: "has joined the chat", timestamp: "..." }
        // Create a complete status message combining user and message
        this.options.onStatus({
          user: data.user,
          message: `${data.user} ${data.message}`,
          timestamp: data.timestamp
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      } else {
        toast.error('Connection Error', {
          description: error.message || 'Failed to connect to chat server'
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (this.options.onError) {
        this.options.onError({ message: 'Connection failed. Please try again.' });
      } else {
        toast.error('Connection Error', {
          description: 'Failed to connect to chat server. Please try again.'
        });
      }
    });
  }

  joinRoom(projectId: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    
    this.socket.emit('join', { project_id: projectId });
  }

  leaveRoom(projectId: string) {
    if (!this.socket) return;
    
    
    this.socket.emit('leave', { project_id: projectId });
  }

  sendMessage(projectId: string, content: string) {
    if (!this.socket) {
      console.error('Socket not connected');
      return false;
    }

    
    this.socket.emit('message', { project_id: projectId, content });
    return true;
  }

  sendTypingStart(projectId: string) {
    if (!this.socket) return;
    
    this.socket.emit('typing', { project_id: projectId });
  }
  
  sendTypingStop(projectId: string) {
    if (!this.socket) return;
    
    this.socket.emit('stop_typing', { project_id: projectId });
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
