import { useState, useEffect, useCallback, useRef } from 'react';
import globalWebSocket from '@/lib/globalWebSocket';

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
 * This hook uses the global WebSocket service for stable connections
 */
export function useAdminWebSocket({
  reconnectInterval = 3000,
  autoConnect = true,
  adminId = 1,
}: AdminWebSocketOptions = {}): UseAdminWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [registered, setRegistered] = useState(false);
  const adminIdRef = useRef(adminId);

  // Initialize and configure the global WebSocket service
  useEffect(() => {
    // Configure service with potentially better settings
    globalWebSocket.configure({
      reconnectInterval: reconnectInterval,
      pingInterval: 15000, // 15 seconds ping interval
      debug: true         // Enable debug logging
    });
    
    // Set up event listeners
    const events = globalWebSocket.getEventEmitter();
    
    // Define handlers as separate functions so we can reference them for cleanup
    const handleConnected = () => {
      console.log('Admin WebSocket connected');
      setConnected(true);
      
      // Register with the server
      globalWebSocket.register({ 
        adminId: adminIdRef.current, 
        role: 'admin' 
      });
    };
    
    const handleDisconnected = () => {
      console.log('Admin WebSocket disconnected');
      setConnected(false);
      setRegistered(false);
    };
    
    const handleRegistered = (clientId: string) => {
      console.log(`Admin WebSocket registered as ${clientId}`);
      setRegistered(true);
    };
    
    const handleError = (error: any) => {
      console.error('Admin WebSocket error:', error);
    }
    
    // Forward messages to legacy event system
    const handleMessage = (data: any) => {
      // Create a synthetic MessageEvent for compatibility
      const syntheticEvent = {
        data: JSON.stringify(data),
        type: 'message',
        target: null
      } as unknown as MessageEvent;
      
      // Dispatch to window for components listening with addEventListener
      window.dispatchEvent(
        new CustomEvent('admin-ws-message', { detail: syntheticEvent })
      );
    };
    
    // Register event handlers
    events.on('connected', handleConnected);
    events.on('disconnected', handleDisconnected);
    events.on('registered', handleRegistered);
    events.on('error', handleError);
    events.on('message', handleMessage);
    
    // Connect if autoConnect is true
    if (autoConnect) {
      globalWebSocket.connect();
    }
    
    // Cleanup event listeners on unmount
    return () => {
      // Remove event listeners
      events.removeListener('connected', handleConnected);
      events.removeListener('disconnected', handleDisconnected);
      events.removeListener('registered', handleRegistered);
      events.removeListener('error', handleError);
      events.removeListener('message', handleMessage);
      // Don't disconnect as other components might be using it
    };
  }, [autoConnect, reconnectInterval]);

  // Update ref and register when adminId prop changes
  useEffect(() => {
    adminIdRef.current = adminId;
    
    // Re-register with new ID if connected
    if (connected && globalWebSocket.isConnected()) {
      globalWebSocket.register({ 
        adminId, 
        role: 'admin' 
      });
    }
  }, [adminId, connected]);

  /**
   * Send a message via WebSocket
   */
  const send = useCallback((type: string, data: any = {}) => {
    return globalWebSocket.send(type, data);
  }, []);

  /**
   * Update admin ID
   */
  const setAdminId = useCallback((id: number) => {
    adminIdRef.current = id;
    
    // Re-register with new ID if connected
    if (globalWebSocket.isConnected()) {
      globalWebSocket.register({ 
        adminId: id, 
        role: 'admin' 
      });
    }
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    globalWebSocket.connect();
  }, []);

  return {
    connected,
    registered,
    send,
    reconnect,
    setAdminId,
  };
}

export default useAdminWebSocket;