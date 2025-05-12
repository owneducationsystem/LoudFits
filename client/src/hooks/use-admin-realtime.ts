import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
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
  enabled = true,
}: AdminRealtimeOptions = {}) {
  const [events, setEvents] = useState<T[]>([]);
  const { connected, registered, send } = useAdminWebSocket({ 
    adminId, 
    autoConnect: enabled 
  });

  /**
   * Add an event to the list
   */
  const addEvent = useCallback((event: T) => {
    setEvents((prevEvents) => [event, ...prevEvents]);
  }, []);

  /**
   * Clear all events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    /**
     * Handle incoming WebSocket messages
     */
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Handle events
        if (data.type === 'event') {
          // Add a unique ID if not present
          const eventData = {
            ...data.data,
            id: data.data.id || nanoid(),
            timestamp: data.data.timestamp || new Date().toISOString(),
          };
          
          // Add the event to our state
          addEvent(eventData as T);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    // Add event listener for websocket messages
    window.addEventListener('admin-ws-message', (e: any) => handleMessage(e.detail));

    // Clean up
    return () => {
      window.removeEventListener('admin-ws-message', (e: any) => handleMessage(e.detail));
    };
  }, [enabled, addEvent]);

  return {
    events,
    addEvent,
    clearEvents,
    connected,
    registered,
  };
}

export default useAdminRealtime;