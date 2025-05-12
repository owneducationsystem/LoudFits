import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

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
  pingInterval?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  initialAdminId = 1,
  pingInterval = 15000,
}) => {
  const [adminId, setAdminId] = useState<number>(initialAdminId);
  const [connected, setConnected] = useState<boolean>(false);
  const [registered, setRegistered] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Send ping to keep connection alive
  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        sendMessage('ping', { id: adminId });
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  };
  
  // Send a message via WebSocket
  const sendMessage = (type: string, data?: any) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    try {
      const message = JSON.stringify({
        type,
        data: data || {},
        timestamp: new Date().toISOString()
      });
      
      socketRef.current.send(message);
      console.log(`Sent ${type} message:`, data);
    } catch (error) {
      console.error(`Error sending ${type} message:`, error);
    }
  };
  
  // Initialize WebSocket connection
  const initWebSocket = () => {
    // Close any existing connections
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (error) {
        console.error('Error closing existing WebSocket:', error);
      }
    }
    
    // Clear existing intervals
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Create new WebSocket connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Connection opened
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Register with server
        sendMessage('register', {
          id: adminId,
          role: 'admin'
        });
      };
      
      // Connection closed
      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setRegistered(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Auto-reconnect after delay
        setTimeout(() => {
          if (document.visibilityState !== 'hidden') {
            console.log('Auto-reconnecting...');
            initWebSocket();
          }
        }, 5000);
      };
      
      // Connection error
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Message received
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);
          
          // Registration confirmation
          if (message.type === 'registered') {
            console.log('Registration confirmed');
            setRegistered(true);
            
            // Start ping interval
            if (!pingIntervalRef.current) {
              pingIntervalRef.current = setInterval(sendPing, pingInterval);
              console.log(`Started ping interval (${pingInterval}ms)`);
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
      
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };
  
  // Handle reconnection
  const reconnect = () => {
    console.log('Manual reconnection requested');
    initWebSocket();
  };
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    console.log('WebSocketProvider mounted');
    initWebSocket();
    
    // Add document visibility change handler to reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we need to reconnect
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          console.log('Tab visible, reconnecting WebSocket');
          initWebSocket();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up on unmount
    return () => {
      console.log('WebSocketProvider unmounting');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (error) {
          console.error('Error closing WebSocket on unmount:', error);
        }
      }
    };
  }, []);
  
  // Re-register when adminId changes
  useEffect(() => {
    if (connected && socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('Admin ID changed, re-registering with new ID:', adminId);
      sendMessage('register', {
        id: adminId,
        role: 'admin'
      });
    }
  }, [adminId, connected]);
  
  return (
    <WebSocketContext.Provider value={{
      connected,
      registered,
      adminId,
      setAdminId,
      reconnect,
      sendMessage
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;