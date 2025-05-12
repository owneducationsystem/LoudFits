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

  // Connect to WebSocket
  const connect = () => {
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // Cancel any pending reconnect
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Setup new connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Connecting to WebSocket at ${wsUrl}...`);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        toast({
          title: 'WebSocket Connected',
          description: 'Real-time updates are now enabled'
        });
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code})`, event);
        setConnected(false);
        
        // Auto-reconnect after delay
        reconnectTimerRef.current = setTimeout(() => {
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
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      setConnected(false);
      
      // Retry after error
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
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