import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

// Absolute minimum WebSocket component that will always work
const BasicWebSocket: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Create connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create new WebSocket
    const socket = new WebSocket(wsUrl);
    
    // Setup handlers
    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };
    
    // Save reference
    socketRef.current = socket;
    
    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      {connected ? (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-500 text-white">
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-500 text-white">
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </Badge>
      )}
    </div>
  );
};

export default BasicWebSocket;