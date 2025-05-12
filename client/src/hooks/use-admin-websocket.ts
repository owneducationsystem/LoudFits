import { useState, useEffect, useCallback, useRef } from 'react';

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
  reconnectInterval = 3000,
  autoConnect = true,
  adminId = 1,
}: AdminWebSocketOptions = {}): UseAdminWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [registered, setRegistered] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const adminIdRef = useRef(adminId);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Setup WebSocket connection
   */
  const setupWebSocket = useCallback(() => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Reset state
    setRegistered(false);

    try {
      // Determine WebSocket URL (secure if page is secure)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      // Connection opened
      socket.addEventListener('open', () => {
        setConnected(true);
        console.log('WebSocket connection established');
        
        // Register as admin
        if (adminIdRef.current) {
          sendMessage('register', { adminId: adminIdRef.current });
        }
      });

      // Connection closed
      socket.addEventListener('close', () => {
        setConnected(false);
        setRegistered(false);
        console.log('WebSocket connection closed');
        
        // Attempt to reconnect
        if (autoConnect) {
          console.log(`Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(setupWebSocket, reconnectInterval);
        }
      });

      // Connection error
      socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
        setRegistered(false);
      });

      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle admin registration confirmation
          if (data.type === 'registered') {
            setRegistered(true);
            console.log(`Registered as admin:${adminIdRef.current}`);
          }
          
          // Dispatch messages to any listeners
          window.dispatchEvent(
            new CustomEvent('admin-ws-message', { detail: event })
          );
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, [autoConnect, reconnectInterval]);

  /**
   * Send a message via WebSocket
   */
  const sendMessage = useCallback((type: string, data: any = {}) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent');
      return;
    }

    try {
      const message = JSON.stringify({
        type,
        data,
      });
      
      socketRef.current.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, []);

  /**
   * Send a message using current socket
   */
  const send = useCallback((type: string, data: any = {}) => {
    return sendMessage(type, data);
  }, [sendMessage]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    setupWebSocket();
  }, [setupWebSocket]);

  /**
   * Update admin ID
   */
  const setAdminId = useCallback((id: number) => {
    adminIdRef.current = id;
    
    // Re-register with new ID if connected
    if (connected && socketRef.current) {
      sendMessage('register', { adminId: id });
    }
  }, [connected, sendMessage]);

  // Initialize WebSocket on mount
  useEffect(() => {
    if (autoConnect) {
      setupWebSocket();
    }

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [autoConnect, setupWebSocket]);

  // Update ref when adminId prop changes
  useEffect(() => {
    adminIdRef.current = adminId;
    
    // Re-register with new ID if connected
    if (connected && socketRef.current) {
      sendMessage('register', { adminId });
    }
  }, [adminId, connected, sendMessage]);

  return {
    connected,
    registered,
    send,
    reconnect,
    setAdminId,
  };
}

export default useAdminWebSocket;