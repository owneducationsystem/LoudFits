import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// Define a simplified user type for our notification context
interface NotificationUser {
  uid?: string;
  id?: number;
  email?: string;
  role?: string;
}

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
  userId?: number;
  entityId?: number;
  entityType?: string;
  isAdmin?: boolean;
  metadata?: any;
  read: boolean;
  createdAt: Date;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // Calculate the number of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
    
    const ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('Connected to notification server');
      setConnected(true);
      
      // Authenticate with the WebSocket server
      if (currentUser) {
        ws.send(JSON.stringify({
          type: 'auth',
          data: {
            userId: currentUser.uid || currentUser.id,
            isAdmin: currentUser.role === 'admin'
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
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'notification':
          handleNewNotification(data.data);
          break;
        case 'unread_notifications':
          if (Array.isArray(data.data)) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.id));
              const newNotifications = data.data.filter(n => !existingIds.has(n.id));
              return [...prev, ...newNotifications];
            });
          }
          break;
        case 'admin_notifications':
          if (Array.isArray(data.data)) {
            setNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.id));
              const newNotifications = data.data.filter(n => !existingIds.has(n.id));
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
    };
    
    setSocket(ws);
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentUser]);
  
  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
      socket.send(JSON.stringify({
        type: 'auth',
        data: {
          userId: currentUser.uid || currentUser.id,
          isAdmin: currentUser.role === 'admin'
        }
      }));
    }
  }, [currentUser, socket]);
  
  // Handle a new notification
  const handleNewNotification = (notification: Notification) => {
    // Check if this notification is already in the list
    setNotifications(prev => {
      if (prev.some((n: Notification) => n.id === notification.id)) {
        return prev;
      }
      
      // Display a toast notification for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === NotificationType.PAYMENT_FAILED ? 'destructive' : 
                  notification.type === NotificationType.ADMIN_ALERT ? 'destructive' : 'default',
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