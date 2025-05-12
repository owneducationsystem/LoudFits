import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';

// Extremely simplified admin panel with WebSocket
const AdminWsOnly: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Connect WebSocket
  const connect = () => {
    // Clean up existing connection
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {
        console.error("Error closing existing connection:", e);
      }
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log("Connecting to WebSocket at:", wsUrl);
      
      const socket = new WebSocket(wsUrl);
      
      // Make sure initial handlers are set up immediately
      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Register the connection
        try {
          socket.send(JSON.stringify({
            type: 'register',
            data: {
              id: 1,
              role: 'admin'
            }
          }));
        } catch (e) {
          console.error("Error sending registration message:", e);
        }
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        
        // Automatically reconnect after a delay
        setTimeout(() => {
          if (socketRef.current === socket) {
            console.log("Attempting to reconnect...");
            connect();
          }
        }, 3000);
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
      };
      
      socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
      };
      
      // Save reference
      socketRef.current = socket;
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setConnected(false);
    }
  };

  // Initialize WebSocket on component mount
  useEffect(() => {
    console.log("Initializing WebSocket connection");
    connect();
    
    // Clean up connection on unmount
    return () => {
      console.log("Component unmounting, closing WebSocket");
      if (socketRef.current) {
        try {
          const socket = socketRef.current;
          socketRef.current = null; // Prevent reconnection attempts
          socket.close();
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="WebSocket Only" />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">WebSocket Only</h1>
          
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Only</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This page does absolutely nothing except maintain a WebSocket connection.</p>
              <p className="mb-4">Status: <strong>{connected ? 'Connected' : 'Disconnected'}</strong></p>
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => connect()}
                  disabled={connected}
                >
                  Connect
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (socketRef.current) {
                      const socket = socketRef.current;
                      socketRef.current = null; // Prevent auto-reconnect
                      socket.close();
                    }
                  }}
                  disabled={!connected}
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">WebSocket URL:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs mb-4">
                {`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`}
              </pre>
              
              <p className="text-sm mb-2">Status:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs mb-4">
                {connected ? 'Connected' : 'Disconnected'}
              </pre>
              
              <p className="text-sm mb-2">Ready State:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs mb-4">
                {socketRef.current 
                  ? socketRef.current.readyState === WebSocket.CONNECTING 
                    ? 'CONNECTING (0)'
                    : socketRef.current.readyState === WebSocket.OPEN
                    ? 'OPEN (1)'
                    : socketRef.current.readyState === WebSocket.CLOSING
                    ? 'CLOSING (2)'
                    : socketRef.current.readyState === WebSocket.CLOSED
                    ? 'CLOSED (3)'
                    : 'UNKNOWN'
                  : 'NOT INITIALIZED'}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminWsOnly;