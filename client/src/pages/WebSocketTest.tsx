import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const WebSocketTest: React.FC = () => {
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket connection
    const connect = () => {
      // Determine WebSocket URL based on current protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      try {
        const ws = new WebSocket(wsUrl);
        setWsStatus('connecting');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsStatus('connected');
          
          // Log success message
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connected to WebSocket server`]);
          
          // Send a test message
          ws.send(JSON.stringify({
            type: 'test',
            data: { message: 'Hello from WebSocket Test Page' }
          }));
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsStatus('disconnected');
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected from WebSocket server`]);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${error}`]);
          
          toast({
            title: 'WebSocket Error',
            description: 'Failed to connect to WebSocket server',
            variant: 'destructive'
          });
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            // Format the message for display
            const formattedMessage = JSON.stringify(data, null, 2);
            setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Received: ${formattedMessage}`]);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error parsing message: ${error}`]);
          }
        };
        
        // Store the WebSocket instance
        setSocket(ws);
        
        // Clean up on unmount
        return () => {
          ws.close();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Failed to create WebSocket: ${error}`]);
        
        toast({
          title: 'Connection Error',
          description: 'Failed to create WebSocket connection',
          variant: 'destructive'
        });
      }
    };
    
    connect();
  }, [toast]);
  
  // Send a message through the WebSocket
  const sendMessage = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Cannot Send',
        description: 'WebSocket is not connected',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Try to parse as JSON first
      let messageData;
      try {
        messageData = JSON.parse(inputMessage);
      } catch {
        // If not valid JSON, send as a simple message
        messageData = { text: inputMessage };
      }
      
      const message = JSON.stringify({
        type: 'message',
        data: messageData
      });
      
      socket.send(message);
      setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Sent: ${message}`]);
      setInputMessage('');
      
      toast({
        title: 'Message Sent',
        description: 'Message was sent successfully',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Send Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };
  
  // Reconnect to the WebSocket server
  const reconnect = () => {
    if (socket) {
      socket.close();
    }
    
    // Force re-render by updating state
    setSocket(null);
    setWsStatus('disconnected');
    setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Reconnecting...`]);
    
    // Reconnect after a short delay
    setTimeout(() => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        setWsStatus('connecting');
        
        // Set up event handlers again
        ws.onopen = () => {
          setWsStatus('connected');
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Reconnected successfully`]);
        };
        
        ws.onclose = () => {
          setWsStatus('disconnected');
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnected again`]);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error during reconnect:', error);
          setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Reconnect error: ${error}`]);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const formattedMessage = JSON.stringify(data, null, 2);
            setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Received: ${formattedMessage}`]);
          } catch (error) {
            setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Error parsing message: ${error}`]);
          }
        };
        
        setSocket(ws);
      } catch (error) {
        console.error('Failed to reconnect:', error);
        setMessages(prev => [...prev, `[${new Date().toLocaleTimeString()}] Failed to reconnect: ${error}`]);
        setWsStatus('disconnected');
      }
    }, 1000);
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Testing Page
            <Badge
              className={`ml-2 ${
                wsStatus === 'connected'
                  ? 'bg-green-500'
                  : wsStatus === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            >
              {wsStatus}
            </Badge>
          </CardTitle>
          <CardDescription>Test WebSocket connection and send messages</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="h-60 overflow-auto border rounded p-3 bg-gray-50 font-mono text-sm">
              {messages.map((msg, index) => (
                <div key={index} className="whitespace-pre-wrap mb-1">{msg}</div>
              ))}
              {messages.length === 0 && (
                <div className="text-gray-400 text-center mt-20">No messages yet</div>
              )}
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Enter a message or JSON object to send"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="font-mono"
                rows={4}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            onClick={reconnect}
            variant="outline"
          >
            Reconnect
          </Button>
          
          <Button 
            onClick={sendMessage}
            disabled={!socket || socket.readyState !== WebSocket.OPEN || !inputMessage.trim()}
          >
            Send Message
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WebSocketTest;