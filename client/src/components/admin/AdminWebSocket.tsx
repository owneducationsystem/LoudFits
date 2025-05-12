import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface AdminWebSocketProps {
  adminId: number;
  onMessage?: (message: WebSocketMessage) => void;
}

const AdminWebSocket: React.FC<AdminWebSocketProps> = ({ adminId, onMessage }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const connectWebSocket = () => {
    try {
      // Close existing socket if it exists
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create a new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Creating new WebSocket connection to ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected in AdminWebSocket component');
        setIsConnected(true);
        
        // Register as admin
        const clientId = `admin:${adminId}`;
        console.log(`Registering as ${clientId}`);
        
        const message = {
          type: 'register',
          data: { id: clientId, role: 'admin' },
          timestamp: new Date().toISOString()
        };
        
        socket.send(JSON.stringify(message));
        
        toast({
          title: 'Real-time connection established',
          description: 'You are now receiving live updates',
        });
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        setIsConnected(false);
        
        // Start reconnection if not already reconnecting
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connectWebSocket();
          }, 3000);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };
  
  // Connect on mount and disconnect on unmount
  useEffect(() => {
    // First render - wait a bit before connecting
    const timer = setTimeout(() => {
      connectWebSocket();
    }, 500);
    
    return () => {
      // Clean up on component unmount
      clearTimeout(timer);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
  
  // Send a message via the WebSocket
  const sendMessage = (type: string, data: any) => {
    if (socketRef.current && isConnected) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      socketRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };
  
  // Re-register when adminId changes
  useEffect(() => {
    if (isConnected && socketRef.current) {
      const clientId = `admin:${adminId}`;
      sendMessage('register', { id: clientId, role: 'admin' });
    }
  }, [adminId, isConnected]);
  
  return (
    <div className="inline-flex">
      {isConnected ? (
        <Badge className="flex items-center gap-1 bg-green-500">
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </Badge>
      ) : (
        <Badge className="flex items-center gap-1 bg-red-500">
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </Badge>
      )}
    </div>
  );
};

export default AdminWebSocket;