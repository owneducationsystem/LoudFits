import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, Bell, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminHeader from '../components/admin/AdminHeader';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

// Create a very simple admin page with a reliable websocket connection
const AdminSimple: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const socketReconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Load a sample order
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiRequest('GET', '/api/orders/17');
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };
    
    fetchOrder();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // Close existing connection if any
        if (socketRef.current) {
          socketRef.current.close();
        }
        
        // Clear any existing reconnect timer
        if (socketReconnectTimer.current) {
          clearTimeout(socketReconnectTimer.current);
          socketReconnectTimer.current = null;
        }
        
        // Determine WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`Connecting to WebSocket at ${wsUrl}...`);
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnected(true);
          
          // Register as admin
          ws.send(JSON.stringify({
            type: 'register',
            data: {
              id: 1,
              role: 'admin'
            },
            timestamp: new Date().toISOString()
          }));
          
          toast({
            title: 'WebSocket Connected',
            description: 'Real-time updates are now enabled',
          });
        };
        
        ws.onclose = (event) => {
          console.log(`WebSocket disconnected (code: ${event.code})`, event);
          setConnected(false);
          
          // Setup reconnection timer
          socketReconnectTimer.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 3000);
          
          toast({
            title: 'WebSocket Disconnected',
            description: 'Attempting to reconnect...',
            variant: 'destructive'
          });
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            console.log('WebSocket message received:', message);
            
            // For registration confirmations
            if (message.type === 'registered') {
              console.log('Registration confirmed:', message.data);
            }
            
            // Add notifications for certain message types
            if (message.type.includes('order') || message.type.includes('payment')) {
              setNotifications(prev => [message, ...prev.slice(0, 9)]);
              toast({
                title: 'New Notification',
                description: `${message.type}: ${JSON.stringify(message.data).substring(0, 50)}...`,
              });
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
        
        socketRef.current = ws;
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        
        // Retry after a timeout
        socketReconnectTimer.current = setTimeout(() => {
          console.log('Retrying WebSocket connection after error...');
          connectWebSocket();
        }, 5000);
      }
    };

    // Initial connection
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (socketReconnectTimer.current) {
        clearTimeout(socketReconnectTimer.current);
      }
    };
  }, [toast]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Update order status
  const updateOrderStatus = async (status: string) => {
    if (!order) return;
    
    try {
      const res = await apiRequest('PATCH', `/api/orders/${order.id}`, { status });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrder(updatedOrder);
        
        toast({
          title: 'Order Updated',
          description: `Status changed to ${status}`,
        });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update order status',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Simple Admin" />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Simple Admin Dashboard</h1>
            <p className="text-gray-500">Reliable WebSocket implementation</p>
          </div>
          
          <div className="flex items-center space-x-2">
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
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                if (socketRef.current) {
                  socketRef.current.close();
                  // Reconnection will happen automatically in the useEffect
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Card */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Order</CardTitle>
            </CardHeader>
            
            <CardContent>
              {order ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge className={
                        order.status === 'completed' || order.status === 'delivered' 
                          ? 'bg-green-500' 
                          : order.status === 'processing' 
                            ? 'bg-yellow-500' 
                            : order.status === 'shipped'
                              ? 'bg-blue-500'
                              : 'bg-red-500'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Payment</p>
                      <Badge className={
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-500' 
                          : order.paymentStatus === 'pending' 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => updateOrderStatus('processing')}>
                        Processing
                      </Button>
                      <Button variant="outline" onClick={() => updateOrderStatus('shipped')}>
                        Shipped
                      </Button>
                      <Button variant="outline" onClick={() => updateOrderStatus('delivered')}>
                        Delivered
                      </Button>
                      <Button variant="outline" onClick={() => updateOrderStatus('cancelled')}>
                        Cancelled
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500">Loading order...</div>
              )}
            </CardContent>
          </Card>
          
          {/* Notifications Card */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Notifications</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <div key={index} className="p-3 border rounded-md bg-gray-50">
                        <div className="flex items-start gap-2">
                          <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">{notification.type}</div>
                            <div className="text-sm break-words max-w-full overflow-hidden">
                              {JSON.stringify(notification.data).substring(0, 100)}
                              {JSON.stringify(notification.data).length > 100 ? '...' : ''}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(notification.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setNotifications([])}
              >
                Clear Notifications
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">WebSocket Status</p>
                  <p className="text-lg">
                    {connected ? (
                      <span className="text-green-500 font-bold">Connected</span>
                    ) : (
                      <span className="text-red-500 font-bold">Disconnected</span>
                    )}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Ready State</p>
                  <p>
                    {socketRef.current ? (
                      socketRef.current.readyState === WebSocket.CONNECTING ? 'Connecting' :
                      socketRef.current.readyState === WebSocket.OPEN ? 'Open' :
                      socketRef.current.readyState === WebSocket.CLOSING ? 'Closing' :
                      socketRef.current.readyState === WebSocket.CLOSED ? 'Closed' :
                      'Unknown'
                    ) : 'Not Initialized'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Last Activity</p>
                  <p>{notifications.length > 0 ? formatDate(notifications[0].timestamp) : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <div className="text-sm text-gray-500">
                {connected ? (
                  <p>WebSocket is handling real-time events for orders and payments</p>
                ) : (
                  <p>WebSocket is disconnected. The system will attempt to reconnect automatically.</p>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSimple;