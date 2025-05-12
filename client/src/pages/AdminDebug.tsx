import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, X, Clock } from 'lucide-react';
import AdminHeader from '../components/admin/AdminHeader';
import { useToast } from '@/hooks/use-toast';

// Debug-focused WebSocket admin page
const AdminDebug: React.FC = () => {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [adminId, setAdminId] = useState<string>('1');
  const [pingSuccess, setPingSuccess] = useState<boolean | null>(null);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  const [pingInterval, setPingInterval] = useState<number | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [messages, setMessages] = useState<Array<{time: Date, type: string, content: string}>>([]);
  const [readyState, setReadyState] = useState<string>('CLOSED');
  const [reconnectEnabled, setReconnectEnabled] = useState(true);
  const [manualPingEnabled, setManualPingEnabled] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  
  // For automatic ping/pong tests
  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Log messages with a timestamp
  const logMessage = useCallback((type: string, content: string) => {
    setMessages(prev => [
      { time: new Date(), type, content }, 
      ...prev.slice(0, 99)  // Keep last 100 messages
    ]);
  }, []);
  
  // Format date for logs
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };
  
  // Ready State to string
  const getReadyStateString = (ws: WebSocket | null) => {
    if (!ws) return 'NOT INITIALIZED';
    switch (ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING (0)';
      case WebSocket.OPEN: return 'OPEN (1)';
      case WebSocket.CLOSING: return 'CLOSING (2)';
      case WebSocket.CLOSED: return 'CLOSED (3)';
      default: return 'UNKNOWN';
    }
  };
  
  // Create a ping message
  const createPingMessage = useCallback(() => {
    return JSON.stringify({
      type: 'ping',
      data: {
        id: adminId,
        count: pingCount + 1,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }, [adminId, pingCount]);
  
  // Send registration message
  const sendRegistration = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({
          type: 'register',
          data: {
            id: adminId,
            role: 'admin'
          },
          timestamp: new Date().toISOString()
        });
        socketRef.current.send(message);
        logMessage('SENT', `Registration message sent: ${message}`);
      } catch (e) {
        console.error('Error sending registration:', e);
        logMessage('ERROR', `Failed to send registration: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      logMessage('ERROR', 'Cannot register: Socket not open');
    }
  }, [adminId, logMessage]);
  
  // Send a ping to test connection
  const sendPing = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        const pingMsg = createPingMessage();
        socketRef.current.send(pingMsg);
        setLastPingTime(Date.now());
        setPingCount(prev => prev + 1);
        logMessage('PING', `Ping sent: ${pingMsg}`);
        
        // Set timeout for pong response
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
        }
        
        pingTimeoutRef.current = setTimeout(() => {
          setPingSuccess(false);
          logMessage('TIMEOUT', 'Ping timed out after 5 seconds');
        }, 5000);
      } catch (e) {
        logMessage('ERROR', `Failed to send ping: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      logMessage('ERROR', `Cannot ping: Socket not open (state: ${getReadyStateString(socketRef.current)})`);
    }
  }, [createPingMessage, logMessage]);
  
  // Start automatic ping interval
  const startPingInterval = useCallback(() => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    
    const interval = window.setInterval(() => {
      sendPing();
    }, 10000);
    
    setPingInterval(interval);
    setManualPingEnabled(true);
    logMessage('INFO', 'Automatic ping started (every 10 seconds)');
    
    return interval;
  }, [sendPing, pingInterval, logMessage]);
  
  // Stop automatic ping interval
  const stopPingInterval = useCallback(() => {
    if (pingInterval) {
      clearInterval(pingInterval);
      setPingInterval(null);
      setManualPingEnabled(false);
      logMessage('INFO', 'Automatic ping stopped');
    }
  }, [pingInterval, logMessage]);
  
  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    logMessage('INFO', 'Initializing WebSocket connection...');
    
    // Close any existing connection
    if (socketRef.current) {
      logMessage('INFO', 'Closing existing connection');
      const oldSocket = socketRef.current;
      socketRef.current = null;
      
      try {
        oldSocket.onopen = null;
        oldSocket.onclose = null;
        oldSocket.onerror = null;
        oldSocket.onmessage = null;
        oldSocket.close();
      } catch (e) {
        logMessage('ERROR', `Error closing existing connection: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    
    try {
      // Create new WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      logMessage('INFO', `Connecting to ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Update ready state immediately and on any change
      const updateReadyState = () => {
        setReadyState(getReadyStateString(socket));
      };
      updateReadyState();
      
      const readyStateInterval = setInterval(updateReadyState, 500);
      
      // Connection opened
      socket.onopen = (event) => {
        logMessage('OPEN', 'WebSocket connection established');
        setConnected(true);
        updateReadyState();
        
        // Register with server
        setTimeout(() => sendRegistration(), 500);
      };
      
      // Connection closed
      socket.onclose = (event) => {
        logMessage('CLOSE', `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason || 'None'}`);
        setConnected(false);
        setRegistered(false);
        updateReadyState();
        clearInterval(readyStateInterval);
        
        // Stop ping interval if active
        if (pingInterval) {
          stopPingInterval();
        }
        
        // Auto reconnect if enabled
        if (reconnectEnabled) {
          logMessage('INFO', 'Auto-reconnecting in 5 seconds...');
          setTimeout(initWebSocket, 5000);
        }
      };
      
      // Connection error
      socket.onerror = (event) => {
        logMessage('ERROR', 'WebSocket error occurred');
        updateReadyState();
      };
      
      // Message received
      socket.onmessage = (event) => {
        logMessage('RECV', `Message received: ${event.data}`);
        updateReadyState();
        
        try {
          const message = JSON.parse(event.data);
          
          // Registration confirmation
          if (message.type === 'registered') {
            setRegistered(true);
            logMessage('INFO', `Registration confirmed: ${JSON.stringify(message.data)}`);
            
            // Start ping interval if enabled
            if (manualPingEnabled && !pingInterval) {
              startPingInterval();
            }
          }
          
          // Ping response (pong)
          if (message.type === 'pong') {
            if (pingTimeoutRef.current) {
              clearTimeout(pingTimeoutRef.current);
              pingTimeoutRef.current = null;
            }
            
            const roundTripTime = Date.now() - (lastPingTime || Date.now());
            setPingSuccess(true);
            logMessage('PONG', `Pong received in ${roundTripTime}ms: ${JSON.stringify(message)}`);
            
            // Reset success indicator after 2 seconds
            setTimeout(() => {
              setPingSuccess(null);
            }, 2000);
          }
        } catch (e) {
          logMessage('ERROR', `Error parsing message: ${e instanceof Error ? e.message : String(e)}`);
        }
      };
      
      return () => {
        clearInterval(readyStateInterval);
        
        if (pingInterval) {
          clearInterval(pingInterval);
        }
        
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
        }
        
        try {
          socket.close();
        } catch (e) {
          // Ignore closing errors
        }
      };
    } catch (error) {
      logMessage('ERROR', `Failed to create WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      return () => {};
    }
  }, [adminId, logMessage, manualPingEnabled, pingInterval, reconnectEnabled, sendRegistration, startPingInterval, stopPingInterval]);
  
  // Initialize WebSocket on component mount
  useEffect(() => {
    const cleanup = initWebSocket();
    logMessage('INFO', 'Component mounted');
    
    // Clean up on unmount
    return () => {
      logMessage('INFO', 'Component unmounting');
      cleanup();
      
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
      }
    };
  }, [initWebSocket, logMessage, pingInterval]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="WebSocket Debug" />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">WebSocket Debugger</h1>
            <p className="text-gray-500">Advanced debugging for WebSocket connections</p>
          </div>
          
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
              <Badge className="flex items-center gap-1 bg-blue-500">
                <CheckCircle2 className="h-3 w-3" />
                <span>Registered</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
                <CardDescription>Real-time WebSocket connection information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1 font-mono">
                        {connected ? (
                          <Badge className="bg-green-500">Connected</Badge>
                        ) : (
                          <Badge className="bg-red-500">Disconnected</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Registration</Label>
                      <div className="mt-1 font-mono">
                        {registered ? (
                          <Badge className="bg-green-500">Registered</Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Not Registered</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Ready State</Label>
                    <div className="mt-1 font-mono p-2 bg-gray-100 rounded text-sm">
                      {readyState}
                    </div>
                  </div>
                  
                  <div>
                    <Label>WebSocket URL</Label>
                    <div className="mt-1 font-mono p-2 bg-gray-100 rounded text-xs break-all">
                      {`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Admin ID</Label>
                    <div className="flex mt-1 gap-2">
                      <Input 
                        value={adminId} 
                        onChange={(e) => setAdminId(e.target.value)}
                        className="font-mono"
                      />
                      <Button 
                        variant="outline" 
                        onClick={sendRegistration}
                        disabled={!connected}
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div>
                      <Label>Connection Controls</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={reconnectEnabled ? "default" : "outline"}
                        onClick={() => {
                          setReconnectEnabled(!reconnectEnabled);
                          logMessage('INFO', reconnectEnabled ? 'Auto-reconnect disabled' : 'Auto-reconnect enabled');
                        }}
                      >
                        {reconnectEnabled ? 'Auto-Reconnect: ON' : 'Auto-Reconnect: OFF'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={initWebSocket}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reconnect Now
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div>
                      <Label>Ping Test</Label>
                    </div>
                    
                    <div className="flex space-x-2 items-center">
                      <Button 
                        variant="outline" 
                        onClick={sendPing}
                        disabled={!connected || !registered}
                      >
                        Manual Ping
                      </Button>
                      
                      <Button 
                        variant={manualPingEnabled ? "default" : "outline"}
                        onClick={() => {
                          if (manualPingEnabled) {
                            stopPingInterval();
                          } else {
                            startPingInterval();
                          }
                        }}
                        disabled={!connected || !registered}
                      >
                        {manualPingEnabled ? 'Auto-Ping: ON' : 'Auto-Ping: OFF'}
                      </Button>
                      
                      {pingSuccess === true && (
                        <Badge className="bg-green-500 ml-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ping Success
                        </Badge>
                      )}
                      
                      {pingSuccess === false && (
                        <Badge className="bg-red-500 ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Ping Failed
                        </Badge>
                      )}
                      
                      {lastPingTime && (
                        <Badge className="bg-blue-500 ml-auto">
                          <Clock className="h-3 w-3 mr-1" />
                          Count: {pingCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex-none">
              <div className="flex justify-between items-center">
                <CardTitle>WebSocket Event Log</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setMessages([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              <CardDescription>Real-time messages and events</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="font-mono text-xs p-4 space-y-1 h-full overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No log messages yet</div>
                ) : (
                  messages.map((msg, index) => {
                    let bgColor = 'bg-gray-100';
                    let textColor = 'text-gray-800';
                    
                    switch (msg.type) {
                      case 'ERROR':
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-800';
                        break;
                      case 'OPEN':
                      case 'INFO':
                        bgColor = 'bg-blue-50';
                        textColor = 'text-blue-800';
                        break;
                      case 'CLOSE':
                        bgColor = 'bg-orange-50';
                        textColor = 'text-orange-800';
                        break;
                      case 'PING':
                        bgColor = 'bg-yellow-50';
                        textColor = 'text-yellow-800';
                        break;
                      case 'PONG':
                        bgColor = 'bg-green-50';
                        textColor = 'text-green-800';
                        break;
                      case 'SENT':
                        bgColor = 'bg-purple-50';
                        textColor = 'text-purple-800';
                        break;
                      case 'RECV':
                        bgColor = 'bg-indigo-50';
                        textColor = 'text-indigo-800';
                        break;
                    }
                    
                    return (
                      <div key={index} className={`p-1.5 rounded ${bgColor} ${textColor} break-all`}>
                        <span className="font-bold mr-2">[{formatTime(msg.time)}]</span>
                        <span className="font-bold uppercase mr-2">[{msg.type}]</span>
                        {msg.content}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug;