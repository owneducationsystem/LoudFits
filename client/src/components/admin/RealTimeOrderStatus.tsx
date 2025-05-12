import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminWebSocket } from './WebSocketProvider';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

interface OrderStatusProps {
  order: Order;
  onRefresh: () => void;
}

/**
 * A component that shows real-time order status updates in the admin panel
 */
export const RealTimeOrderStatus: React.FC<OrderStatusProps> = ({ 
  order,
  onRefresh
}) => {
  const { isConnected, getMessagesByType } = useAdminWebSocket();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Listen for updates to this specific order
  useEffect(() => {
    // Get all order and payment updates that match this order
    const orderMessages = getMessagesByType('admin_order_updated')
      .filter(msg => msg.data.order && msg.data.order.id === order.id);
      
    const paymentMessages = getMessagesByType('admin_payment_updated')
      .filter(msg => msg.data.payment && msg.data.payment.orderId === order.id);
    
    // If we have any updates, set the last update time
    if (orderMessages.length > 0 || paymentMessages.length > 0) {
      const allMessages = [...orderMessages, ...paymentMessages];
      // Sort by timestamp (newest first)
      const sortedMessages = allMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      if (sortedMessages.length > 0) {
        setLastUpdateTime(new Date(sortedMessages[0].timestamp));
      }
    }
  }, [order.id, getMessagesByType]);
  
  // Format timestamps
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Order Status</CardTitle>
            <CardDescription>
              Real-time updates for order #{order.orderNumber}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Badge variant="outline" className="flex items-center text-green-500 gap-1">
                <Wifi className="h-3 w-3" />
                <span>Connected</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center text-red-500 gap-1">
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Order Status</div>
            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
          </div>
          
          <div>
            <div className="text-sm font-medium text-gray-500">Payment Status</div>
            <Badge className={getStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {lastUpdateTime ? (
              <>Last update: {formatTime(lastUpdateTime)}</>
            ) : (
              <>No updates received</>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              onRefresh();
              toast({
                title: "Refreshed",
                description: "Order status has been refreshed"
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};