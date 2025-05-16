import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Types for notifications
export enum NotificationType {
  // Order related notifications
  ORDER_PLACED = 'order_placed',
  ORDER_UPDATED = 'order_updated',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ORDER_CANCELED = 'order_canceled',
  
  // Payment related notifications
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  
  // User related notifications
  USER_REGISTERED = 'user_registered',
  USER_UPDATED = 'user_updated',
  
  // Product related notifications
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_ADDED = 'product_added',
  STOCK_ALERT = 'stock_alert',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  
  // Admin notifications
  ADMIN_ALERT = 'admin_alert',
  ADMIN_LOGIN = 'admin_login',
  
  // System notifications
  SYSTEM = 'system',
  ERROR = 'error'
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
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Priority level for admin notifications
  actionRequired?: boolean; // Whether the notification requires action
  actionType?: string; // Type of action required (e.g., 'approve_order', 'check_stock')
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
  
  /**
   * Send an order notification to both user and admin
   * @param orderId Order ID
   * @param orderNumber Order number
   * @param userId User ID
   * @param status Order status
   * @param message Custom message (optional)
   */
  async sendOrderNotification(orderId: number, orderNumber: string, userId: number, status: string, message?: string) {
    // Create user notification
    const userTitle = status === 'placed' 
      ? 'Order Placed Successfully' 
      : `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    
    const userMessage = message || 
      (status === 'placed' 
        ? `Your order #${orderNumber} has been received and is being processed.`
        : `Your order #${orderNumber} has been updated to ${status}.`);
    
    // Determine notification type based on status
    let notificationType: NotificationType;
    switch(status.toLowerCase()) {
      case 'placed': notificationType = NotificationType.ORDER_PLACED; break;
      case 'shipped': notificationType = NotificationType.ORDER_SHIPPED; break;
      case 'delivered': notificationType = NotificationType.ORDER_DELIVERED; break;
      case 'canceled': notificationType = NotificationType.ORDER_CANCELED; break;
      default: notificationType = NotificationType.ORDER_UPDATED;
    }
    
    // Send to the user
    await this.sendUserNotification({
      type: notificationType,
      title: userTitle,
      message: userMessage,
      userId,
      entityId: orderId,
      entityType: 'order',
      metadata: { orderNumber, status },
      priority: 'medium',
      actionRequired: false
    });
    
    // Send to admin with higher priority for certain statuses
    const priority = status === 'placed' || status === 'canceled' ? 'high' : 'medium';
    
    await this.sendAdminNotification({
      type: notificationType,
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}: #${orderNumber}`,
      message: `Order #${orderNumber} has been ${status}. Customer ID: ${userId}`,
      entityId: orderId,
      entityType: 'order',
      metadata: { orderNumber, status, userId },
      priority,
      actionRequired: status === 'placed',
      actionType: status === 'placed' ? 'process_order' : undefined
    });
    
    // Also broadcast this notification to make sure all clients receive it
    await this.sendBroadcast({
      type: notificationType,
      title: `Order Update: #${orderNumber}`,
      message: `Order #${orderNumber} status: ${status}`,
      entityId: orderId,
      entityType: 'order',
      metadata: { orderNumber, status, userId },
      priority: 'medium'
    });
    
    return true;
  }
  
  /**
   * Send payment notification to both user and admin
   * @param paymentId Payment ID
   * @param orderId Order ID
   * @param orderNumber Order number
   * @param userId User ID
   * @param amount Payment amount
   * @param success Whether payment was successful
   */
  async sendPaymentNotification(
    paymentId: number, 
    orderId: number, 
    orderNumber: string, 
    userId: number, 
    amount: number,
    success: boolean
  ) {
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
    
    const notificationType = success 
      ? NotificationType.PAYMENT_RECEIVED 
      : NotificationType.PAYMENT_FAILED;
    
    // Send to user
    await this.sendUserNotification({
      type: notificationType,
      title: success ? 'Payment Successful' : 'Payment Failed',
      message: success 
        ? `Your payment of ${formattedAmount} for order #${orderNumber} was successful.` 
        : `Your payment of ${formattedAmount} for order #${orderNumber} failed. Please try again or contact support.`,
      userId,
      entityId: orderId,
      entityType: 'payment',
      metadata: { orderNumber, amount, paymentId },
      priority: success ? 'medium' : 'high',
      actionRequired: !success,
      actionType: !success ? 'retry_payment' : undefined
    });
    
    // Send to admin
    await this.sendAdminNotification({
      type: notificationType,
      title: success ? `Payment Received: #${orderNumber}` : `Payment Failed: #${orderNumber}`,
      message: success 
        ? `Payment of ${formattedAmount} received for order #${orderNumber}. Customer ID: ${userId}` 
        : `Payment of ${formattedAmount} failed for order #${orderNumber}. Customer ID: ${userId}`,
      entityId: orderId,
      entityType: 'payment',
      metadata: { orderNumber, amount, paymentId, userId },
      priority: success ? 'medium' : 'high',
      actionRequired: !success,
      actionType: !success ? 'check_payment' : undefined
    });
    
    // Also broadcast this notification to make sure all clients receive it
    await this.sendBroadcast({
      type: notificationType,
      title: success ? `Payment Successful: Order #${orderNumber}` : `Payment Failed: Order #${orderNumber}`,
      message: success 
        ? `Payment of ${formattedAmount} for order #${orderNumber} was successful.` 
        : `Payment of ${formattedAmount} for order #${orderNumber} failed.`,
      entityId: orderId,
      entityType: 'payment',
      metadata: { orderNumber, amount, paymentId, userId, success },
      priority: success ? 'medium' : 'high'
    });
    
    return true;
  }

  /**
   * Send a stock alert notification to admins
   * @param productId Product ID
   * @param productName Product name
   * @param currentStock Current stock level
   * @param threshold Threshold that triggered the alert
   */
  async sendStockAlert(productId: number, productName: string, currentStock: number, threshold: number = 5) {
    let priority: 'low' | 'medium' | 'high' | 'urgent';
    let type = NotificationType.STOCK_ALERT;
    
    // Determine priority based on stock level
    if (currentStock === 0) {
      priority = 'urgent';
      type = NotificationType.OUT_OF_STOCK;
    } else if (currentStock <= 2) {
      priority = 'high';
      type = NotificationType.LOW_STOCK;
    } else if (currentStock <= threshold) {
      priority = 'medium';
      type = NotificationType.LOW_STOCK;
    } else {
      priority = 'low';
    }
    
    return this.sendAdminNotification({
      type,
      title: currentStock === 0 ? 'Product Out of Stock!' : 'Low Stock Alert',
      message: currentStock === 0 
        ? `Product "${productName}" (ID: ${productId}) is now out of stock and needs immediate attention.`
        : `Product "${productName}" (ID: ${productId}) is running low with only ${currentStock} items left.`,
      entityId: productId,
      entityType: 'product',
      priority,
      actionRequired: true,
      actionType: 'restock_product',
      metadata: {
        productId,
        currentStock,
        threshold
      }
    });
  }
  
  /**
   * Send an order status update to both admin and customer
   * @param orderId Order ID
   * @param orderNumber Order number
   * @param userId User ID
   * @param status New order status
   * @param additionalInfo Additional information
   */
  async sendOrderStatusUpdate(orderId: number, orderNumber: string, userId: number, status: string, additionalInfo?: string) {
    let type: NotificationType;
    let title: string;
    let adminTitle: string;
    
    // Determine notification type based on status
    switch (status.toLowerCase()) {
      case 'shipped':
        type = NotificationType.ORDER_SHIPPED;
        title = 'Your Order Has Shipped';
        adminTitle = 'Order Shipped';
        break;
      case 'delivered':
        type = NotificationType.ORDER_DELIVERED;
        title = 'Your Order Has Been Delivered';
        adminTitle = 'Order Delivered';
        break;
      case 'cancelled':
      case 'canceled':
        type = NotificationType.ORDER_CANCELED;
        title = 'Your Order Has Been Cancelled';
        adminTitle = 'Order Cancelled';
        break;
      default:
        type = NotificationType.ORDER_UPDATED;
        title = 'Your Order Status Has Been Updated';
        adminTitle = 'Order Updated';
    }
    
    // Send to customer
    const userMessage = `Your order #${orderNumber} has been ${status.toLowerCase()}${additionalInfo ? '. ' + additionalInfo : '.'}`;
    await this.sendUserNotification({
      type,
      title,
      message: userMessage,
      userId,
      entityId: orderId,
      entityType: 'order',
      metadata: {
        orderId,
        orderNumber,
        status
      }
    });
    
    // Send to admin
    const adminMessage = `Order #${orderNumber} has been ${status.toLowerCase()}${additionalInfo ? '. ' + additionalInfo : '.'}`;
    return this.sendAdminNotification({
      type,
      title: adminTitle,
      message: adminMessage,
      entityId: orderId,
      entityType: 'order',
      priority: 'medium',
      metadata: {
        orderId,
        orderNumber,
        userId,
        status
      }
    });
  }
  
  /**
   * Send a legacy payment notification 
   * @param orderId Order ID
   * @param orderNumber Order number
   * @param userId User ID
   * @param status Payment status
   * @param amount Payment amount
   * @param paymentMethod Payment method
   */
  async sendPaymentStatusNotification(orderId: number, orderNumber: string, userId: number, status: string, amount: string, paymentMethod: string) {
    const isSuccess = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid';
    // Convert string amount to number, handling currency formatting
    let numericAmount = 0;
    try {
      numericAmount = parseFloat(amount.replace(/[^\d.-]/g, ''));
    } catch (e) {
      console.error('Error parsing amount:', amount, e);
      numericAmount = 0; // Fallback
    }
    
    // Use the numeric payment notification method
    return this.sendPaymentNotification(
      0, // No payment ID available for legacy methods
      orderId,
      orderNumber,
      userId,
      numericAmount,
      isSuccess
    );
  }
  
  /**
   * Send a notification about new user registration
   * @param userId User ID
   * @param username Username
   * @param email Email
   */
  async sendUserRegistrationNotification(userId: number, username: string, email: string) {
    // Send to admin dashboard
    await this.sendAdminNotification({
      type: NotificationType.USER_REGISTERED,
      title: 'New User Registration',
      message: `New user registered: ${username} (${email})`,
      entityId: userId,
      entityType: 'user',
      priority: 'low',
      metadata: {
        userId,
        username,
        email,
        timestamp: new Date().toISOString()
      }
    });

    // Also update dashboard metrics (non-blocking)
    this.updateDashboardMetrics('users').catch(err => {
      console.error('Failed to update dashboard metrics after user registration:', err);
    });
    
    return true;
  }
  
  /**
   * Update specific dashboard metrics in real-time
   * @param metricType Type of metric to update (orders, revenue, users, stock)
   */
  async updateDashboardMetrics(metricType: 'orders' | 'revenue' | 'users' | 'stock' | 'all' = 'all') {
    try {
      let metricsData: any = {};
      
      // Get metrics based on the requested type
      if (metricType === 'orders' || metricType === 'all') {
        const totalOrders = await this.storage.countOrders();
        const pendingOrders = await this.getPendingOrdersCount();
        metricsData.totalOrders = totalOrders;
        metricsData.pendingOrders = pendingOrders;
      }
      
      if (metricType === 'revenue' || metricType === 'all') {
        const todayRevenue = await this.getTodayRevenue();
        metricsData.todayRevenue = todayRevenue;
      }
      
      if (metricType === 'users' || metricType === 'all') {
        const totalUsers = await this.storage.countUsers();
        metricsData.totalUsers = totalUsers;
      }
      
      if (metricType === 'stock' || metricType === 'all') {
        const lowStockCount = await this.getLowStockCount();
        metricsData.lowStockProducts = lowStockCount;
      }
      
      // Add timestamp
      metricsData.updatedAt = new Date().toISOString();
      
      // Send to all admin clients
      this.sendAdminDashboardUpdate(metricsData);
      
      return true;
    } catch (error) {
      console.error('Error updating dashboard metrics:', error);
      return false;
    }
  }
  
  /**
   * Get a count of pending orders
   */
  private async getPendingOrdersCount(): Promise<number> {
    try {
      // This is simplified - add actual implementation based on your storage layer
      const allOrders = await this.storage.getAllOrders();
      return allOrders.filter(order => 
        order.status === 'pending' || 
        order.status === 'processing'
      ).length;
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return 0;
    }
  }
  
  /**
   * Get today's revenue
   */
  private async getTodayRevenue(): Promise<string> {
    try {
      // This is simplified - add actual implementation based on your storage layer
      const allOrders = await this.storage.getAllOrders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && order.status !== 'canceled';
      });
      
      const totalRevenue = todayOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total.toString());
      }, 0);
      
      return totalRevenue.toFixed(2);
    } catch (error) {
      console.error('Error calculating today revenue:', error);
      return '0.00';
    }
  }
  
  /**
   * Get count of products with low stock
   */
  private async getLowStockCount(): Promise<number> {
    try {
      // This is simplified - add actual implementation based on your storage layer
      const allProducts = await this.storage.getAllProducts();
      return allProducts.filter(product => 
        product.stockQuantity !== null && 
        product.stockQuantity !== undefined && 
        product.stockQuantity <= 5
      ).length;
    } catch (error) {
      console.error('Error getting low stock products count:', error);
      return 0;
    }
  }
  
  /**
   * Send a real-time dashboard update notification
   * @param data Dashboard update data
   */
  async sendAdminDashboardUpdate(data: {
    totalOrders?: number;
    pendingOrders?: number;
    todayRevenue?: string;
    totalUsers?: number;
    lowStockProducts?: number;
    updatedAt?: string;
  }) {
    // Broadcast to all admin clients
    this.clients.forEach((client, socket) => {
      if (client.isAdmin && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'dashboard_update',
          data
        }));
      }
    });
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();