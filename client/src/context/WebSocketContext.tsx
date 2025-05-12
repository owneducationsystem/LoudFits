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
    console.log('WebSocketProvider mounted, initializing global WebSocket service');
    
    // Configure the global WebSocket with better settings
    globalWebSocket.configure({
      reconnectInterval: 2000, // 2 seconds initial reconnect
      pingInterval: 15000,     // 15 seconds ping interval
      debug: true              // Enable debug logging
    });
    
    // Set up event listeners
    const events = globalWebSocket.getEventEmitter();
    
    // Define handlers as separate functions so we can reference them for cleanup
    const handleConnected = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Register with the server
      globalWebSocket.register({ 
        adminId: adminId, 
        role: 'admin' 
      });
    };
    
    const handleDisconnected = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      setRegistered(false);
    };
    
    const handleRegistered = (clientId: string) => {
      console.log(`WebSocket registered as ${clientId}`);
      setRegistered(true);
    };
    
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
    };
    
    // Register event handlers
    events.on('connected', handleConnected);
    events.on('disconnected', handleDisconnected);
    events.on('registered', handleRegistered);
    events.on('error', handleError);
    
    // Start connection
    globalWebSocket.connect();
    
    // Clean up on unmount
    return () => {
      // Remove event listeners
      events.removeListener('connected', handleConnected);
      events.removeListener('disconnected', handleDisconnected);
      events.removeListener('registered', handleRegistered);
      events.removeListener('error', handleError);
      // Don't disconnect as other components might be using it
    };
  }, []);
  
  // Update admin ID when it changes
  useEffect(() => {
    console.log('Setting admin ID in global WebSocket:', adminId);
    
    // Register with new admin ID if already connected
    if (globalWebSocket.isConnected()) {
      globalWebSocket.register({ 
        adminId: adminId, 
        role: 'admin' 
      });
    }
  }, [adminId]);
  
  // Send message via WebSocket
  const sendMessage = (type: string, data?: any) => {
    return globalWebSocket.send(type, data);
  };
  
  // Handle reconnection
  const reconnect = () => {
    console.log('Manual reconnection requested');
    globalWebSocket.connect();
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