import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface WebSocketKeepAliveProps {
  interval?: number;  // Ping interval in milliseconds
  adminId?: number | string;  // Admin ID for registration
  showControls?: boolean;  // Whether to show connection controls
}

/**
 * A simple component that keeps WebSocket connection alive with periodic pings
 */
const WebSocketKeepAlive: React.FC<WebSocketKeepAliveProps> = ({
  interval = 15000,  // Default to 15 seconds
  adminId = 1,
  showControls = true
}) => {
  const [connected, setConnected] = useState(false);
  const [registered, setRegistered] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Send ping message to keep connection alive
  const sendPing = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        const pingMessage = JSON.stringify({
          type: 'ping',
          data: {
            id: adminId,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
        
        socketRef.current.send(pingMessage);
        console.log('Ping sent');
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  };
  
  // Initialize WebSocket connection and keep-alive mechanism
  const connect = () => {
    // Close existing connection
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
    }
    
    // Clear existing ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Connection opened
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Send registration message
        try {
          const regMessage = JSON.stringify({
            type: 'register',
            data: {
              id: adminId,
              role: 'admin'
            },
            timestamp: new Date().toISOString()
          });
          socket.send(regMessage);
          console.log('Registration message sent');
        } catch (error) {
          console.error('Error sending registration:', error);
        }
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
      };
      
      // Connection error
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Message received
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle registration confirmation
          if (message.type === 'registered') {
            console.log('Registration confirmed:', message);
            setRegistered(true);
            
            // Start ping interval after successful registration
            if (!pingIntervalRef.current) {
              pingIntervalRef.current = setInterval(sendPing, interval);
              console.log(`Started ping interval (${interval}ms)`);
            }
          }
          
          // Handle pong response
          if (message.type === 'pong') {
            console.log('Pong received:', message);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  };
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (error) {
          console.error('Error closing WebSocket on unmount:', error);
        }
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [adminId, interval]);
  
  if (!showControls) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2">
      {connected ? (
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
      
      {registered && (
        <Badge className="bg-blue-500">Registered</Badge>
      )}
      
      <Button 
        size="sm" 
        variant="outline" 
        onClick={connect} 
        className="h-7 px-2"
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        Reconnect
      </Button>
    </div>
  );
};

export default WebSocketKeepAlive;