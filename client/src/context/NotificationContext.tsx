import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { VariantProps } from 'class-variance-authority';
import { toastVariants } from '@/components/ui/toast';

// Define a simplified user type for our notification context
interface NotificationUser {
  uid?: string;
  id?: number;
  email?: string;
  role?: string;
}

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
  userId?: number;
  entityId?: number;
  entityType?: string;
  isAdmin?: boolean;
  metadata?: any;
  read: boolean;
  createdAt: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionRequired?: boolean;
  actionType?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  // Initialize notifications from localStorage if available
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const storedNotifications = localStorage.getItem('loudfits_notifications');
    if (storedNotifications) {
      try {
        return JSON.parse(storedNotifications);
      } catch (e) {
        console.error('Error parsing stored notifications:', e);
        return [];
      }
    }
    return [];
  });
  
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Convert Firebase user to our simplified notification user
  const notificationUser: NotificationUser | null = currentUser ? {
    uid: currentUser.uid,
    id: (currentUser as any).id,
    email: currentUser.email || undefined,
    role: (currentUser as any).role === 'admin' || 
          (currentUser.email === 'admin@loudfits.com') ||
          (currentUser.email === 'rajeshmatta3636@gmail.com') 
          ? 'admin' : 'customer'
  } : null;
  
  // Calculate the number of unread notifications
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;
  
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      // Limit to most recent 100 notifications to prevent storage issues
      const notificationsToStore = notifications.slice(-100);
      localStorage.setItem('loudfits_notifications', JSON.stringify(notificationsToStore));
    } catch (e) {
      console.error('Error saving notifications to localStorage:', e);
    }
  }, [notifications]);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('Connected to notification server');
      setConnected(true);
      
      // Authenticate with the WebSocket server
      if (notificationUser) {
        ws.send(JSON.stringify({
          type: 'auth',
          data: {
            userId: notificationUser.uid || notificationUser.id,
            isAdmin: notificationUser.role === 'admin'
          }
        }));
      }
    };
    
    ws.onclose = () => {
      console.log('Disconnected from notification server');
      setConnected(false);
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        if (socket === ws) { // Only reconnect if this socket is still the current one
          setSocket(null);
        }
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'notification':
            handleNewNotification(data.data);
            break;
          case 'unread_notifications':
            if (Array.isArray(data.data)) {
              setNotifications(prev => {
                const existingIds = new Set(prev.map((n: Notification) => n.id));
                const newNotifications = data.data.filter((n: any) => !existingIds.has(n.id));
                return [...prev, ...newNotifications];
              });
            }
            break;
          case 'admin_notifications':
            if (Array.isArray(data.data)) {
              setNotifications(prev => {
                const existingIds = new Set(prev.map((n: Notification) => n.id));
                const newNotifications = data.data.filter((n: any) => !existingIds.has(n.id));
                return [...prev, ...newNotifications];
              });
            }
            break;
          case 'broadcast':
            handleNewNotification(data.data);
            break;
          case 'auth_confirmation':
            console.log('Authentication confirmed:', data);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(ws);
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentUser, notificationUser]);
  
  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && notificationUser) {
      socket.send(JSON.stringify({
        type: 'auth',
        data: {
          userId: notificationUser.uid || notificationUser.id,
          isAdmin: notificationUser.role === 'admin'
        }
      }));
    }
  }, [notificationUser, socket]);
  
  // Handle a new notification
  const handleNewNotification = (notification: Notification) => {
    // Check if this notification is already in the list
    setNotifications(prev => {
      if (prev.some((n: Notification) => n.id === notification.id)) {
        return prev;
      }
      
      // Format createdAt as a Date if it's a string
      if (typeof notification.createdAt === 'string') {
        notification.createdAt = new Date(notification.createdAt);
      }
      
      // Determine toast variant based on notification type and priority
      let variant: VariantProps<typeof toastVariants>['variant'] = 'default';
      
      // Handle critical alerts with destructive variant
      if (notification.type === NotificationType.PAYMENT_FAILED || 
          notification.type === NotificationType.ADMIN_ALERT ||
          notification.type === NotificationType.ERROR ||
          notification.type === NotificationType.OUT_OF_STOCK ||
          notification.priority === 'urgent' || 
          notification.priority === 'high') {
        variant = 'destructive';
      }
      
      // Handle positive notifications with success variant
      if (notification.type === NotificationType.PAYMENT_RECEIVED ||
          notification.type === NotificationType.ORDER_DELIVERED) {
        variant = 'success';
      }
      
      // Display a toast notification for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: variant,
        // Keep important notifications visible longer
        duration: (notification.priority === 'urgent' || notification.priority === 'high') ? 8000 : 5000
      });
      
      return [notification, ...prev];
    });
  };
  
  // Mark a notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    ));
    
    // Send a read receipt to the server
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'mark_read',
        data: {
          notificationId
        }
      }));
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
    
    // Send read receipts to the server
    if (socket && socket.readyState === WebSocket.OPEN) {
      notifications.forEach(notification => {
        if (!notification.read) {
          socket.send(JSON.stringify({
            type: 'mark_read',
            data: {
              notificationId: notification.id
            }
          }));
        }
      });
    }
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        connected
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}