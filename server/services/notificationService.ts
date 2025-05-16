import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Types for notifications
export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_UPDATED = 'order_updated',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  USER_REGISTERED = 'user_registered',
  PRODUCT_UPDATED = 'product_updated',
  ADMIN_ALERT = 'admin_alert',
  SYSTEM = 'system'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId?: number; // If specific to a user
  entityId?: number; // e.g., order ID, product ID
  entityType?: string; // e.g., 'order', 'product'
  isAdmin?: boolean; // If intended for admin
  metadata?: any; // Additional data
  read?: boolean;
  createdAt: Date;
}

// Client connection types
interface ConnectedClient {
  socket: WebSocket;
  userId?: number;
  isAdmin?: boolean;
  lastActivity: Date;
}

// Main NotificationService class
class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ConnectedClient> = new Map();
  private notificationHistory: Map<number, Notification[]> = new Map(); // User ID -> notifications
  private adminNotifications: Notification[] = [];
  
  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    console.log('WebSocket notification server initialized');
    
    this.wss.on('connection', (socket) => {
      console.log('Client connected to notification service');
      
      // Add client to connected clients
      this.clients.set(socket, {
        socket,
        lastActivity: new Date()
      });
      
      // Handle authentication message
      socket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Handle authentication
          if (message.type === 'auth') {
            const clientInfo = this.clients.get(socket);
            if (clientInfo && message.data) {
              // Update client info with authentication data
              if (message.data.userId) {
                clientInfo.userId = parseInt(message.data.userId);
                
                // Send any unread notifications to this user
                this.sendUnreadNotifications(socket, clientInfo.userId);
              }
              
              if (message.data.isAdmin) {
                clientInfo.isAdmin = Boolean(message.data.isAdmin);
                
                // Send recent admin notifications
                if (clientInfo.isAdmin) {
                  this.sendAdminNotifications(socket);
                }
              }
              
              // Update client info
              clientInfo.lastActivity = new Date();
              this.clients.set(socket, clientInfo);
              
              console.log(`Client authenticated: userId=${clientInfo.userId}, isAdmin=${clientInfo.isAdmin}`);
              
              // Send confirmation
              socket.send(JSON.stringify({
                type: 'auth_confirmation',
                success: true,
                userId: clientInfo.userId,
                isAdmin: clientInfo.isAdmin
              }));
            }
          }
          
          // Handle read receipt
          if (message.type === 'mark_read') {
            const clientInfo = this.clients.get(socket);
            if (clientInfo && clientInfo.userId && message.data?.notificationId) {
              this.markNotificationAsRead(clientInfo.userId, message.data.notificationId);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log('Client disconnected from notification service');
        this.clients.delete(socket);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(socket);
      });
    });
    
    // Heartbeat to check client connections
    setInterval(() => {
      this.cleanupDisconnectedClients();
    }, 30000); // Check every 30 seconds
    
    return this;
  }
  
  /**
   * Send a notification to a specific user
   */
  async sendUserNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    if (!notification.userId) {
      throw new Error('userId is required for user notifications');
    }
    
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      createdAt: new Date(),
      read: false
    };
    
    // Store in history
    const userNotifications = this.notificationHistory.get(notification.userId) || [];
    userNotifications.push(fullNotification);
    
    // Limit history to 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.shift(); // Remove oldest
    }
    
    this.notificationHistory.set(notification.userId, userNotifications);
    
    // Send to connected clients with this userId
    this.clients.forEach((client, socket) => {
      if (client.userId === notification.userId && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'notification',
          data: fullNotification
        }));
      }
    });
    
    return fullNotification;
  }
  
  /**
   * Send a notification to all admin users
   */
  async sendAdminNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      createdAt: new Date(),
      read: false,
      isAdmin: true
    };
    
    // Store in admin history
    this.adminNotifications.push(fullNotification);
    
    // Limit admin history to 100 notifications
    if (this.adminNotifications.length > 100) {
      this.adminNotifications.shift(); // Remove oldest
    }
    
    // Send to all admin clients
    this.clients.forEach((client, socket) => {
      if (client.isAdmin && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'notification',
          data: fullNotification
        }));
      }
    });
    
    return fullNotification;
  }
  
  /**
   * Send a broadcast notification to all connected clients
   */
  async sendBroadcast(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      createdAt: new Date(),
      read: false
    };
    
    // Send to all connected clients
    this.clients.forEach((client, socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'broadcast',
          data: fullNotification
        }));
      }
    });
    
    return fullNotification;
  }
  
  /**
   * Send unread notifications to a user
   */
  private sendUnreadNotifications(socket: WebSocket, userId: number) {
    const userNotifications = this.notificationHistory.get(userId) || [];
    const unread = userNotifications.filter(n => !n.read);
    
    if (unread.length > 0 && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unread_notifications',
        data: unread
      }));
    }
  }
  
  /**
   * Send recent admin notifications
   */
  private sendAdminNotifications(socket: WebSocket) {
    // Get the 20 most recent admin notifications
    const recent = this.adminNotifications.slice(-20);
    
    if (recent.length > 0 && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'admin_notifications',
        data: recent
      }));
    }
  }
  
  /**
   * Mark a notification as read
   */
  private markNotificationAsRead(userId: number, notificationId: string) {
    const userNotifications = this.notificationHistory.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.notificationHistory.set(userId, userNotifications);
      }
    }
  }
  
  /**
   * Generate a unique notification ID
   */
  private generateNotificationId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Clean up disconnected clients
   */
  private cleanupDisconnectedClients() {
    const now = new Date();
    
    this.clients.forEach((client, socket) => {
      // Check if socket is closed or inactive for > 15 minutes
      if (socket.readyState !== WebSocket.OPEN || 
          now.getTime() - client.lastActivity.getTime() > 15 * 60 * 1000) {
        this.clients.delete(socket);
      }
    });
  }
  
  /**
   * Get the number of connected clients
   */
  getConnectedClientCount() {
    let regular = 0;
    let admin = 0;
    
    this.clients.forEach((client) => {
      if (client.isAdmin) {
        admin++;
      } else {
        regular++;
      }
    });
    
    return { regular, admin };
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();