import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface WebSocketOptions {
  reconnectInterval?: number;
  reconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Create a function to establish the WebSocket connection
  const connect = useCallback(() => {
    // Determine the correct protocol based on the current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the current host and add the WebSocket path
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = (event) => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // If we have a user, register the client
        if (currentUser) {
          const registerMessage = {
            type: 'register',
            id: currentUser.uid,
            role: 'user'
          };
          newSocket.send(JSON.stringify(registerMessage));
        }
        
        if (options.onOpen) {
          options.onOpen(event);
        }
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            setTimeout(() => {
              connect();
            }, reconnectInterval);
          } else {
            toast({
              title: 'Connection lost',
              description: 'Could not reconnect to the server. Please refresh the page.',
              variant: 'destructive'
            });
          }
        }
        
        if (options.onClose) {
          options.onClose(event);
        }
      };
      
      newSocket.onerror = (event) => {
        console.error('WebSocket error:', event);
        
        if (options.onError) {
          options.onError(event);
        }
      };
      
      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          // Add message to the state
          setMessages((prevMessages) => [...prevMessages, message]);
          
          // Process specific message types
          if (message.type === 'payment_updated') {
            toast({
              title: 'Payment update',
              description: `Payment status: ${message.data.payment?.status}`,
              variant: message.data.payment?.status === 'completed' ? 'default' : 'destructive'
            });
          } else if (message.type === 'order_updated') {
            toast({
              title: 'Order update',
              description: `Order status: ${message.data.order?.status}`,
              variant: 'default'
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(newSocket);
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      
      if (options.onError) {
        options.onError(new Event('error'));
      }
    }
  }, [
    currentUser,
    maxReconnectAttempts,
    options,
    reconnectInterval,
    toast
  ]);
  
  // Connect when the component mounts
  useEffect(() => {
    let isMounted = true;
    
    const initiateConnection = async () => {
      // Small delay to give the component time to fully mount
      await new Promise(resolve => setTimeout(resolve, 300));
      if (isMounted) {
        console.log('Initiating WebSocket connection...');
        connect();
      }
    };
    
    initiateConnection();
    
    // Clean up the connection when the component unmounts
    return () => {
      isMounted = false;
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log('Closing WebSocket connection...');
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [connect]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      const message = {
        type,
        data,
        timestamp: new Date().toISOString()
      };
      
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [socket, isConnected]);
  
  // Get messages of a specific type
  const getMessagesByType = useCallback((type: string) => {
    return messages.filter(message => message.type === type);
  }, [messages]);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    socket,
    isConnected,
    messages,
    sendMessage,
    getMessagesByType,
    clearMessages,
    connect
  };
}