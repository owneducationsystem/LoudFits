import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, WifiOff, RefreshCw, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminHeader from '../components/admin/AdminHeader';
import WebSocketKeepAlive from '../components/admin/WebSocketKeepAlive';

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

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

const AdminRealTimeFixed: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  const [adminId, setAdminId] = useState<number>(1); // Default admin ID
  const { toast } = useToast();

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/admin/orders?limit=10');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
          
          // Set first order as selected if none selected
          if (data.length > 0 && !selectedOrder) {
            setSelectedOrder(data[0]);
          }
        } else {
          console.error('Failed to fetch orders');
          toast({
            title: 'Error',
            description: 'Failed to fetch orders',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fallback to a single order if admin orders API fails
    const fetchSingleOrder = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', '/api/orders/17');
        if (response.ok) {
          const orderData = await response.json();
          setOrders([orderData]);
          setSelectedOrder(orderData);
        } else {
          console.error('Failed to fetch order');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders().catch(() => fetchSingleOrder());
  }, [toast]); // Removed selectedOrder dependency to prevent repeated API calls

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge color
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

  // Update order status
  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}`, { status });
      
      if (response.ok) {
        const updatedOrder = await response.json();
        
        setOrders(prev => prev.map(order => 
          order.id === orderId ? updatedOrder : order
        ));
        
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        
        toast({
          title: 'Status Updated',
          description: `Order is now ${status}`,
        });
      } else {
        toast({
          title: 'Update Failed',
          description: await response.text(),
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title="Real-Time Monitor (Fixed)" />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Real-Time Order Monitor</h1>
            <p className="text-gray-500">Fixed WebSocket implementation</p>
          </div>
          
          <WebSocketKeepAlive adminId={adminId} interval={10000} />
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
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await apiRequest('GET', '/api/orders/17');
                    if (response.ok) {
                      const orderData = await response.json();
                      setOrders([orderData]);
                      setSelectedOrder(orderData);
                    }
                  } catch (error) {
                    console.error('Error reloading:', error);
                  } finally {
                    setLoading(false);
                  }
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
                  
                  <Separator />
                  
                  <div>
                    <Label className="mb-2 block">Update Order Status:</Label>
                    <div className="grid grid-cols-2 gap-2">
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
                  </div>
                </div>
              )}
            </CardContent>
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
                            {notification.type.includes('order') 
                              ? 'Order Status Updated' 
                              : 'Payment Status Updated'}
                          </div>
                          <div className="text-sm">
                            {notification.type.includes('order') && notification.data.order
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setNotifications([])}
                >
                  Clear Notifications
                </Button>
                
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-medium mb-2">WebSocket Registration</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label htmlFor="adminId">Admin ID</Label>
                      <Input 
                        id="adminId" 
                        type="number" 
                        value={adminId}
                        onChange={(e) => setAdminId(parseInt(e.target.value))}
                        placeholder="Admin ID"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        // Close existing connection
                        if (socketRef.current) {
                          socketRef.current.close();
                        }
                        // The useEffect will create a new connection
                      }}
                    >
                      Reconnect
                    </Button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminRealTimeFixed;