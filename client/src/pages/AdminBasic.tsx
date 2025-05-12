import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';

const AdminBasic: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Setup WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    // Connection opened
    socket.addEventListener('open', (event) => {
      console.log('WebSocket Connected');
      setConnected(true);
      
      // Send a test message
      socket.send(JSON.stringify({
        type: 'hello',
        message: 'Hello from Admin',
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: 'WebSocket Connected',
        description: 'Live updates enabled'
      });
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
      console.log('WebSocket Disconnected', event);
      setConnected(false);
      
      toast({
        title: 'WebSocket Disconnected',
        description: 'Live updates disabled',
        variant: 'destructive'
      });
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      console.log('Message from server:', event.data);
      
      try {
        const message = JSON.parse(event.data);
        setMessages(prev => [...prev, JSON.stringify(message)].slice(-10));
      } catch (error) {
        console.error('Error parsing message:', error);
        setMessages(prev => [...prev, event.data].slice(-10));
      }
    });

    // Save socket reference
    socketRef.current = socket;

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Basic Admin" />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Basic WebSocket Test</h1>
          
          {connected ? (
            <Badge className="flex items-center gap-1 bg-green-500">
              <Wifi className="h-4 w-4" />
              <span>Connected</span>
            </Badge>
          ) : (
            <Badge className="flex items-center gap-1 bg-red-500">
              <WifiOff className="h-4 w-4" />
              <span>Disconnected</span>
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2">Connection Status: {connected ? 'Connected' : 'Disconnected'}</p>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      if (socketRef.current && connected) {
                        socketRef.current.send(JSON.stringify({
                          type: 'ping',
                          timestamp: new Date().toISOString()
                        }));
                        
                        toast({
                          title: 'Ping Sent',
                          description: 'Sent ping to server'
                        });
                      }
                    }}
                    disabled={!connected}
                  >
                    Send Ping
                  </Button>
                  
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (socketRef.current) {
                        socketRef.current.close();
                        setConnected(false);
                      }
                    }}
                    disabled={!connected}
                  >
                    Disconnect
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Create new connection
                      if (socketRef.current) {
                        socketRef.current.close();
                      }
                      
                      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                      const wsUrl = `${protocol}//${window.location.host}/ws`;
                      const socket = new WebSocket(wsUrl);
                      
                      socket.addEventListener('open', () => {
                        console.log('WebSocket Reconnected');
                        setConnected(true);
                        toast({
                          title: 'WebSocket Reconnected',
                          description: 'Live updates enabled'
                        });
                      });
                      
                      socket.addEventListener('close', () => {
                        console.log('WebSocket Disconnected');
                        setConnected(false);
                      });
                      
                      socket.addEventListener('message', (event) => {
                        console.log('Message from server:', event.data);
                        try {
                          const message = JSON.parse(event.data);
                          setMessages(prev => [...prev, JSON.stringify(message)].slice(-10));
                        } catch (error) {
                          setMessages(prev => [...prev, event.data].slice(-10));
                        }
                      });
                      
                      socketRef.current = socket;
                    }}
                    disabled={connected}
                  >
                    Reconnect
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Debug Info:</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                  {`WebSocket URL: ${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws
Status: ${connected ? 'Connected' : 'Disconnected'}
ReadyState: ${socketRef.current ? socketRef.current.readyState : 'N/A'}`}
                </pre>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Message Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 font-mono p-4 rounded max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p>No messages received yet...</p>
                ) : (
                  <ul className="space-y-2">
                    {messages.map((msg, i) => (
                      <li key={i} className="break-all">
                        &gt; {msg}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBasic;