import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketTestProps {
  label?: string;
}

/**
 * A simple, reliable WebSocket component to add to any admin page
 */
const WebSocketTest: React.FC<WebSocketTestProps> = ({ label = "WebSocket" }) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Singleton WebSocket instance across renders
  const wsInstanceRef = useRef<{
    instance: WebSocket | null;
    connected: boolean;
    reconnectTimer: NodeJS.Timeout | null;
  }>({
    instance: null,
    connected: false,
    reconnectTimer: null,
  });

  // Connect to WebSocket
  const connect = () => {
    try {
      // If already connected, don't do anything
      if (wsInstanceRef.current.instance && 
          wsInstanceRef.current.instance.readyState === WebSocket.OPEN) {
        setConnected(true);
        return;
      }
      
      // Clean up existing connection if not already closed
      if (wsInstanceRef.current.instance && 
          wsInstanceRef.current.instance.readyState !== WebSocket.CLOSED) {
        wsInstanceRef.current.instance.close();
      }
      
      // Cancel any pending reconnect
      if (wsInstanceRef.current.reconnectTimer) {
        clearTimeout(wsInstanceRef.current.reconnectTimer);
        wsInstanceRef.current.reconnectTimer = null;
      }
      
      // Setup new connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}...`);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        wsInstanceRef.current.connected = true;
        setConnected(true);
        
        // Register as admin
        socket.send(JSON.stringify({
          type: 'register',
          data: {
            id: 1,
            role: 'admin'
          },
          timestamp: new Date().toISOString()
        }));
        
        toast({
          title: 'WebSocket Connected',
          description: 'Real-time updates are now enabled'
        });
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code})`, event);
        wsInstanceRef.current.connected = false;
        setConnected(false);
        
        // Auto-reconnect after delay
        wsInstanceRef.current.reconnectTimer = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        // Handle messages as needed
      };
      
      wsInstanceRef.current.instance = socket;
      socketRef.current = socket;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      wsInstanceRef.current.connected = false;
      setConnected(false);
      
      // Retry after error
      wsInstanceRef.current.reconnectTimer = setTimeout(() => {
        connect();
      }, 5000);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    // Check if we already have a connection
    if (wsInstanceRef.current.instance &&
        wsInstanceRef.current.instance.readyState === WebSocket.OPEN) {
      setConnected(true);
    } else {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      // We don't actually close the connection on unmount
      // This ensures the connection persists between page navigations
      
      // Just clear reconnect timers
      if (wsInstanceRef.current.reconnectTimer) {
        clearTimeout(wsInstanceRef.current.reconnectTimer);
        wsInstanceRef.current.reconnectTimer = null;
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, []);

  // Simple UI to show connection status
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Badge className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
          <Wifi className="h-3 w-3" />
          <span>{label} Connected</span>
        </Badge>
      ) : (
        <Badge className="flex items-center gap-1 bg-red-500 hover:bg-red-600">
          <WifiOff className="h-3 w-3" />
          <span>{label} Disconnected</span>
        </Badge>
      )}
      
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2 text-xs"
        onClick={() => connect()}
      >
        Reconnect
      </Button>
    </div>
  );
};

export default WebSocketTest;