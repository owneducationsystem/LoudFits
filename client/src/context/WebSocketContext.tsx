import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import globalWebSocket from '@/lib/globalWebSocket';

interface WebSocketContextType {
  connected: boolean;
  registered: boolean;
  adminId: number;
  setAdminId: (id: number) => void;
  reconnect: () => void;
  sendMessage: (type: string, data?: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  initialAdminId?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  initialAdminId = 1,
}) => {
  const [adminId, setAdminId] = useState<number>(initialAdminId);
  const [connected, setConnected] = useState<boolean>(false);
  const [registered, setRegistered] = useState<boolean>(false);
  
  // Set up WebSocket connection
  useEffect(() => {
    console.log('WebSocketProvider mounted, using global WebSocket');
    
    // Set the admin ID
    globalWebSocket.setAdminId(adminId);
    
    // Add status listener
    const handleStatusChange = (status: boolean) => {
      console.log('WebSocket connection status changed:', status);
      setConnected(status);
    };
    
    // Add message listener
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle registration confirmation
        if (message.type === 'registered') {
          console.log('Registration confirmed');
          setRegistered(true);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    // Register listeners
    globalWebSocket.addStatusChangeListener(handleStatusChange);
    globalWebSocket.addMessageListener(handleMessage);
    
    // Ensure connection is established
    globalWebSocket.initWebSocket();
    
    // Clean up on unmount
    return () => {
      console.log('WebSocketProvider unmounting, removing listeners');
      globalWebSocket.removeStatusChangeListener(handleStatusChange);
      globalWebSocket.removeMessageListener(handleMessage);
    };
  }, []);
  
  // Update admin ID when it changes
  useEffect(() => {
    console.log('Setting admin ID in global WebSocket:', adminId);
    globalWebSocket.setAdminId(adminId);
  }, [adminId]);
  
  // Send message via WebSocket
  const sendMessage = (type: string, data?: any) => {
    globalWebSocket.sendMessage(type, data);
  };
  
  // Handle reconnection
  const reconnect = () => {
    console.log('Manual reconnection requested');
    globalWebSocket.initWebSocket();
  };
  
  // Update local admin ID
  const handleSetAdminId = (id: number) => {
    setAdminId(id);
  };
  
  return (
    <WebSocketContext.Provider value={{
      connected,
      registered,
      adminId,
      setAdminId: handleSetAdminId,
      reconnect,
      sendMessage
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;