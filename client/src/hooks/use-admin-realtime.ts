import { useState, useEffect, useCallback } from 'react';
import { useAdminWebSocket } from './use-admin-websocket';

interface AdminRealtimeOptions {
  adminId?: number;
  enabled?: boolean;
}

/**
 * Hook for listening to real-time admin events
 */
export function useAdminRealtime<T = any>({
  adminId = 1,
  enabled = true
}: AdminRealtimeOptions = {}) {
  const [events, setEvents] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use our WebSocket hook
  const { connected, registered, send } = useAdminWebSocket({
    adminId,
    autoConnect: enabled
  });
  
  // Helper to add a new event to the list
  const addEvent = useCallback((event: T) => {
    setEvents(prev => [event, ...prev]);
  }, []);
  
  // Effect to listen for messages
  useEffect(() => {
    if (!enabled) return;
    
    // Set up listener for WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle different event types
        if (message.type === 'event') {
          // Add event to state
          addEvent(message.data as T);
        }
        
        // Handle errors
        if (message.type === 'error') {
          setError(new Error(message.data.message || 'Unknown error'));
        }
        
        // Handle initial data
        if (message.type === 'init_data') {
          setEvents(message.data as T[]);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        setError(error instanceof Error ? error : new Error('Failed to parse WebSocket message'));
      }
    };
    
    // Add event listener
    if (window && window.addEventListener) {
      window.addEventListener('message', handleMessage);
    }
    
    // Request initial data when connected
    if (connected && registered) {
      send('get_events');
      setLoading(true);
    }
    
    // Cleanup listener on unmount
    return () => {
      if (window && window.removeEventListener) {
        window.removeEventListener('message', handleMessage);
      }
    };
  }, [addEvent, connected, enabled, registered, send]);
  
  // Helper to trigger specific actions
  const triggerAction = useCallback((action: string, data: any = {}) => {
    if (!connected || !registered) {
      console.warn('Cannot trigger action, WebSocket not connected or registered');
      return false;
    }
    
    send('action', { action, ...data });
    return true;
  }, [connected, registered, send]);
  
  return {
    events,
    loading,
    error,
    connected,
    registered,
    triggerAction,
    refresh: () => send('get_events')
  };
}