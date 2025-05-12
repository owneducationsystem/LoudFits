import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminHeader from '../components/admin/AdminHeader';
import AdminWebSocket from '../components/admin/AdminWebSocket';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  userId: number;
  email: string;
  total: number;
  createdAt: string;
}

interface Payment {
  id: number;
  orderId: number;
  merchantTransactionId: string;
  transactionId?: string;
  amount: number;
  status: string;
  updatedAt: string;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

// Create a demo page for admin to test real-time updates
const AdminRealTime: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const [adminId, setAdminId] = useState<number>(1); // Default admin ID
  
  // Handle received WebSocket messages
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('Message received in AdminRealTime:', message);
    
    // Add to notifications - limit to 10 most recent
    if (message.type.includes('admin_') || message.type.includes('_updated')) {
      setNotifications(prev => {
        const combined = [message, ...prev];
        // Remove duplicates based on timestamp
        const unique = combined.filter((msg, index, self) => 
          index === self.findIndex(m => m.timestamp === msg.timestamp)
        );
        // Return most recent 10
        return unique.slice(0, 10);
      });
      
      // Update selected order if it matches
      if (selectedOrder && message.data.order && message.data.order.id === selectedOrder.id) {
        setSelectedOrder(message.data.order);
      }
    }
  };
  
  // Fetch orders on load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // Skip trying to get all orders and just load a specific order we know exists
        // This is a temporary fix until the API for getting all orders is working
        const orderResponse = await apiRequest('GET', '/api/orders/17');
        
        if (!orderResponse.ok) {
          throw new Error(`Error ${orderResponse.status}: ${await orderResponse.text()}`);
        }
        
        const orderData = await orderResponse.json();
        console.log('Order loaded:', orderData);
        
        // Use this single order for the demo
        setOrders([orderData]);
        setSelectedOrder(orderData);
        
        toast({
          title: 'Demo Mode',
          description: 'Loading sample order for demonstration',
        });
      } catch (error) {
        console.error('Error fetching order:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch orders',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we don't have an order yet
    if (!selectedOrder && orders.length === 0) {
      fetchOrders();
    }
  }, [toast, selectedOrder, orders.length]);
  
  // No need for additional WebSocket effect as we now handle messages in handleWebSocketMessage
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get appropriate status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'paid':
        return 'bg-green-500';
      case 'processing':
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500';
      case 'shipped':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  // Update an order status
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      // Use regular orders endpoint
      const response = await apiRequest('PATCH', `/api/orders/${orderId}`, { status });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        console.log('Order status updated:', updatedOrder);
        
        toast({
          title: 'Status Updated',
          description: `Order status changed to ${status}`,
        });
        
        // Update local state
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        
        // Update order in the orders list
        setOrders(prev => prev.map(order => 
          order.id === orderId ? updatedOrder : order
        ));
      } else {
        const errorText = await response.text();
        toast({
          title: 'Update Failed',
          description: `Failed to update order status: ${errorText}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the status',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Real-Time Dashboard" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Real-Time Order Monitor</h1>
            <p className="text-gray-500">Test and monitor WebSocket notifications</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <AdminWebSocket 
              adminId={adminId}
              onMessage={handleWebSocketMessage}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Select an order to monitor</CardDescription>
            </CardHeader>
            
            <CardContent className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No orders found
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map(order => (
                    <div 
                      key={order.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    setLoading(false);
                  }, 500);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Orders
              </Button>
            </CardFooter>
          </Card>
          
          {/* Selected Order Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Real-time order information</CardDescription>
            </CardHeader>
            
            <CardContent>
              {!selectedOrder ? (
                <div className="text-center py-8 text-gray-500">
                  Select an order to view details
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Order #{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Payment</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedOrder.paymentStatus)}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Customer</Label>
                    <div className="mt-1 text-sm">
                      <div>User ID: {selectedOrder.userId}</div>
                      <div>Email: {selectedOrder.email}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Total</Label>
                    <div className="mt-1 text-lg font-medium">
                      ₹{selectedOrder.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              {selectedOrder && (
                <>
                  <p className="text-sm text-gray-500 w-full mb-2">Update Order Status:</p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button 
                      variant="outline" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    >
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      Processing
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                    >
                      <Zap className="h-4 w-4 mr-2 text-blue-500" />
                      Shipped
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Delivered
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      <Zap className="h-4 w-4 mr-2 text-red-500" />
                      Cancelled
                    </Button>
                  </div>
                </>
              )}
            </CardFooter>
          </Card>
          
          {/* Notifications Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Real-Time Notifications</CardTitle>
              <CardDescription>Recent WebSocket events</CardDescription>
            </CardHeader>
            
            <CardContent className="max-h-[500px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <div key={index} className="p-3 border rounded-md bg-gray-50">
                      <div className="flex items-start gap-2">
                        <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">
                            {notification.type === 'admin_order_updated' 
                              ? 'Order Status Updated' 
                              : 'Payment Status Updated'}
                          </div>
                          <div className="text-sm">
                            {notification.type === 'admin_order_updated' && notification.data.order
                              ? `Order #${notification.data.order.orderNumber} is now ${notification.data.order.status}`
                              : notification.data.payment
                                ? `Payment for order ${notification.data.order?.orderNumber || notification.data.payment.merchantTransactionId} is ${notification.data.payment.status}`
                                : 'Unknown update'}
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
            </CardContent>
            
            <CardFooter>
              <div className="space-y-4 w-full">
                <div>
                  <Label className="mb-2 block">Admin ID (for WebSocket registration)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={adminId}
                      onChange={(e) => setAdminId(parseInt(e.target.value))}
                      placeholder="Admin ID"
                    />
                    <Button
                      onClick={() => {
                        // This will actually just trigger a reload of the AdminWebSocket component
                        setAdminId(prevId => {
                          const newId = prevId;
                          
                          toast({
                            title: 'Admin ID Updated',
                            description: `WebSocket will register with ID: admin:${newId}`,
                          });
                          
                          return newId;
                        });
                      }}
                    >
                      Register
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setNotifications([])}
                >
                  Clear Notifications
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminRealTime;