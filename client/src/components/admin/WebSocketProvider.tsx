import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

// Define the shape of the WebSocket context
interface WebSocketContextType {
  isConnected: boolean;
  hasMessages: boolean;
  sendMessage: (type: string, data: any) => boolean;
  getMessagesByType: (type: string) => any[];
  clearMessages: () => void;
}

// Create the context with a default value
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Props for the WebSocket provider component
interface WebSocketProviderProps {
  children: ReactNode;
  adminId: number;
}

/**
 * Provider component that wraps your app and makes WebSocket available to any
 * child component via the useWebSocket hook.
 */
export const AdminWebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  adminId
}) => {
  const { toast } = useToast();
  
  // Use our WebSocket hook
  const { 
    isConnected, 
    messages, 
    sendMessage, 
    getMessagesByType,
    clearMessages
  } = useWebSocket({
    // Connect handler
    onOpen: () => {
      // Register as admin with server
      sendMessage('register', { id: adminId, role: 'admin' });
      console.log('WebSocket connection established - Admin panel');
    },
    // Error handler
    onError: () => {
      toast({
        title: 'Connection Error',
        description: 'Could not connect to real-time updates server',
        variant: 'destructive'
      });
    }
  });
  
  // Process incoming messages that need admin attention
  React.useEffect(() => {
    // Look for admin-specific events
    const adminOrderMessages = getMessagesByType('admin_order_updated');
    const adminPaymentMessages = getMessagesByType('admin_payment_updated');
    
    // Process the latest message if there are any
    if (adminOrderMessages.length > 0 || adminPaymentMessages.length > 0) {
      const allMessages = [...adminOrderMessages, ...adminPaymentMessages];
      // Sort by timestamp (newest first)
      const sortedMessages = allMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Get the latest message
      const latestMessage = sortedMessages[0];
      
      if (latestMessage) {
        const { type, data } = latestMessage;
        
        // Only notify once per message type and ID
        const msgKey = `${type}-${data.order?.id || data.payment?.id}`;
        const hasNotified = sessionStorage.getItem(msgKey);
        
        if (!hasNotified) {
          // Create notification based on message type
          if (type === 'admin_order_updated') {
            toast({
              title: 'Order Update',
              description: `Order #${data.order.orderNumber} status: ${data.order.status}`,
            });
          } else if (type === 'admin_payment_updated') {
            toast({
              title: 'Payment Update',
              description: `Payment for order #${data.order?.orderNumber || data.payment.merchantTransactionId} is ${data.payment.status}`,
              variant: data.payment.status === 'completed' ? 'default' : 'destructive'
            });
          }
          
          // Mark as notified
          sessionStorage.setItem(msgKey, 'true');
        }
      }
    }
  }, [messages, getMessagesByType, toast]);

  // The context value that will be provided to consumers
  const contextValue: WebSocketContextType = {
    isConnected,
    hasMessages: messages.length > 0,
    sendMessage,
    getMessagesByType,
    clearMessages
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use the WebSocket context
 */
export const useAdminWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useAdminWebSocket must be used within an AdminWebSocketProvider');
  }
  return context;
};