import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import globalWebSocket from '@/lib/globalWebSocket';

interface WebSocketContextType {
  connected: boolean;
  registered: boolean;
  adminId: number;
  setAdminId: (id: number) => void;
  reconnect: () => void;
  sendMessage: (type: string, data?: any) => boolean;
  disabled: boolean;
  connectionError: string | null;
}

// Create the context with safe default values
const defaultContextValue: WebSocketContextType = {
  connected: false,
  registered: false,
  adminId: 1,
  setAdminId: () => {},
  reconnect: () => {},
  sendMessage: () => false,
  disabled: false,
  connectionError: null
};

const WebSocketContext = createContext<WebSocketContextType>(defaultContextValue);

// Safe hook with error handling
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    console.error('useWebSocket was called outside of WebSocketProvider');
    return defaultContextValue;
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
  const [disabled, setDisabled] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);
  
  // Set up WebSocket connection with error boundaries
  useEffect(() => {
    try {
      console.log('WebSocketProvider mounted, initializing global WebSocket service');
      
      // Configure the global WebSocket with safer settings
      globalWebSocket.configure({
        reconnectInterval: 5000, // 5 seconds initial reconnect for more stability
        pingInterval: 30000,     // 30 seconds ping interval to reduce network traffic
        debug: true              // Enable debug logging
      });
      
      // Set up event listeners with error handling
      const events = globalWebSocket.getEventEmitter();
      
      // Define handlers as separate functions so we can reference them for cleanup
      const handleConnected = () => {
        try {
          console.log('WebSocket connected');
          setConnected(true);
          setConnectionError(null);
          
          // Register with the server
          try {
            globalWebSocket.register({
              adminId: adminId, 
              role: 'admin' 
            });
          } catch (err) {
            console.error('Error during registration', err);
          }
        } catch (err) {
          console.error('Error in connected handler', err);
        }
      };
      
      const handleDisconnected = () => {
        try {
          console.log('WebSocket disconnected');
          setConnected(false);
          setRegistered(false);
        } catch (err) {
          console.error('Error in disconnected handler', err);
        }
      };
      
      const handleRegistered = (clientId: string) => {
        try {
          console.log(`WebSocket registered as ${clientId}`);
          setRegistered(true);
        } catch (err) {
          console.error('Error in registered handler', err);
        }
      };
      
      const handleError = (error: any) => {
        try {
          console.error('WebSocket error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown WebSocket error';
          setConnectionError(errorMessage);
          
          // If we encounter too many errors, disable WebSockets
          if (errorMessage.includes('Failed to construct') || errorMessage.includes('INVALID_STATE_ERR')) {
            console.warn('Disabling WebSocket due to critical error');
            setDisabled(true);
          }
        } catch (err) {
          console.error('Error in error handler', err);
        }
      };
      
      // Only attempt connection if not disabled
      if (!disabled) {
        try {
          // Register event handlers
          events.on('connected', handleConnected);
          events.on('disconnected', handleDisconnected);
          events.on('registered', handleRegistered);
          events.on('error', handleError);
          
          // Start connection
          globalWebSocket.connect();
          setHasInitialized(true);
        } catch (err) {
          console.error('Failed to initialize WebSocket', err);
          setConnectionError('Failed to initialize WebSocket connection');
          setDisabled(true);
        }
        
        // Clean up on unmount
        return () => {
          try {
            // Remove event listeners
            events.removeListener('connected', handleConnected);
            events.removeListener('disconnected', handleDisconnected);
            events.removeListener('registered', handleRegistered);
            events.removeListener('error', handleError);
            // Don't disconnect as other components might be using it
          } catch (err) {
            console.error('Error during WebSocket cleanup', err);
          }
        };
      }
    } catch (err) {
      console.error('Critical error in WebSocketProvider', err);
      setDisabled(true);
      setConnectionError('WebSocket initialization failed');
    }
  }, [disabled]);
  
  // Update admin ID when it changes (with error handling)
  useEffect(() => {
    if (disabled || !hasInitialized) return;
    
    try {
      console.log('Setting admin ID in global WebSocket:', adminId);
      
      // Register with new admin ID if already connected
      if (globalWebSocket.isConnected()) {
        globalWebSocket.register({ 
          adminId: adminId, 
          role: 'admin' 
        });
      }
    } catch (err) {
      console.error('Error updating admin ID', err);
    }
  }, [adminId, disabled, hasInitialized]);
  
  // Send message via WebSocket (with error handling)
  const sendMessage = (type: string, data?: any): boolean => {
    if (disabled || !hasInitialized) return false;
    
    try {
      return globalWebSocket.send(type, data);
    } catch (err) {
      console.error('Error sending WebSocket message', err);
      return false;
    }
  };
  
  // Handle reconnection (with error handling)
  const reconnect = () => {
    if (disabled || !hasInitialized) return;
    
    try {
      console.log('Manual reconnection requested');
      globalWebSocket.connect();
    } catch (err) {
      console.error('Error during manual reconnection', err);
    }
  };
  
  // Update local admin ID
  const handleSetAdminId = (id: number) => {
    setAdminId(id);
  };
  
  // Enable manual re-enabling of WebSockets
  const enableWebSocket = () => {
    setDisabled(false);
  };
  
  return (
    <WebSocketContext.Provider value={{
      connected,
      registered,
      adminId,
      setAdminId: handleSetAdminId,
      reconnect,
      sendMessage,
      disabled,
      connectionError
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;