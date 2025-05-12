import { useState, useEffect, useCallback } from 'react';

interface AdminWebSocketOptions {
  reconnectInterval?: number;
  autoConnect?: boolean;
  adminId?: number;
}

interface UseAdminWebSocketReturn {
  connected: boolean;
  registered: boolean;
  send: (type: string, data?: any) => void;
  reconnect: () => void;
  setAdminId: (id: number) => void;
}

/**
 * Hook for WebSocket communication in admin pages
 */
export function useAdminWebSocket({
  reconnectInterval = 5000,
  autoConnect = true,
  adminId = 1
}: AdminWebSocketOptions = {}): UseAdminWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [registered, setRegistered] = useState<boolean>(false);
  const [currentAdminId, setCurrentAdminId] = useState<number>(adminId);
  const [reconnectTimer, setReconnectTimer] = useState<number | null>(null);
  const [pingInterval, setPingInterval] = useState<number | null>(null);
  
  /**
   * Setup WebSocket connection
   */
  const connect = useCallback(() => {
    // Clear existing socket
    if (socket) {
      socket.close();
    }
    
    // Clear timers
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      setReconnectTimer(null);
    }
    
    if (pingInterval) {
      window.clearInterval(pingInterval);
      setPingInterval(null);
    }
    
    // Create new WebSocket connection
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const newSocket = new WebSocket(wsUrl);
      setSocket(newSocket);
      
      // Setup event handlers
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Register with server
        send(newSocket, 'register', {
          id: currentAdminId,
          role: 'admin'
        });
        
        // Start ping interval
        const interval = window.setInterval(() => {
          send(newSocket, 'ping', { id: currentAdminId });
        }, 30000);
        
        setPingInterval(interval);
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setRegistered(false);
        
        // Clear ping interval
        if (pingInterval) {
          window.clearInterval(pingInterval);
          setPingInterval(null);
        }
        
        // Auto-reconnect after delay if not hidden
        if (document.visibilityState !== 'hidden') {
          const timer = window.setTimeout(() => {
            connect();
          }, reconnectInterval);
          
          setReconnectTimer(timer);
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received WebSocket message:', message);
          
          // Handle registration confirmation
          if (message.type === 'registered') {
            setRegistered(true);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [currentAdminId, pingInterval, reconnectInterval, reconnectTimer, socket]);
  
  /**
   * Send a message via WebSocket
   */
  const send = useCallback((socket: WebSocket | null, type: string, data: any = {}) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message, WebSocket not connected');
      return;
    }
    
    try {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(message));
      console.log(`Sent ${type} message:`, data);
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }, []);
  
  /**
   * Send a message using current socket
   */
  const sendMessage = useCallback((type: string, data: any = {}) => {
    send(socket, type, data);
  }, [send, socket]);
  
  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    console.log('Manual reconnection requested');
    connect();
  }, [connect]);
  
  /**
   * Update admin ID
   */
  const handleSetAdminId = useCallback((id: number) => {
    setCurrentAdminId(id);
    
    // Re-register if already connected
    if (connected && socket && socket.readyState === WebSocket.OPEN) {
      send(socket, 'register', {
        id,
        role: 'admin'
      });
    }
  }, [connected, send, socket]);
  
  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Add visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!socket || socket.readyState !== WebSocket.OPEN)) {
        console.log('Tab visible, reconnecting WebSocket');
        connect();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      
      if (pingInterval) {
        window.clearInterval(pingInterval);
      }
      
      if (socket) {
        socket.close();
      }
    };
  }, [autoConnect, connect, pingInterval, reconnectTimer, socket]);
  
  return {
    connected,
    registered,
    send: sendMessage,
    reconnect,
    setAdminId: handleSetAdminId
  };
}