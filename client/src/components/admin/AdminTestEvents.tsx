import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Bell, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminTestEventsProps {
  adminId: number;
}

// Event types with icons and sample data
const eventTypes = [
  { 
    value: 'order_update', 
    label: 'Order Update',
    icon: <Package className="w-4 h-4" />,
    data: {
      orderId: 123456,
      status: 'shipped',
      customer: 'John Doe',
      total: 129.99,
      timestamp: new Date().toISOString(),
    }
  },
  { 
    value: 'user_signup', 
    label: 'User Signup',
    icon: <UserPlus className="w-4 h-4" />,
    data: {
      userId: Math.floor(1000 + Math.random() * 9000),
      email: 'customer@example.com',
      name: 'New Customer',
      signupDate: new Date().toISOString(),
    }
  },
  { 
    value: 'product_update', 
    label: 'Product Update',
    icon: <RefreshCw className="w-4 h-4" />,
    data: {
      productId: Math.floor(100 + Math.random() * 900),
      name: 'Limited Edition T-Shirt',
      price: 49.99,
      stock: 15,
      updatedAt: new Date().toISOString(),
    }
  },
  { 
    value: 'stock_alert', 
    label: 'Stock Alert',
    icon: <AlertTriangle className="w-4 h-4" />,
    data: {
      productId: Math.floor(100 + Math.random() * 900),
      name: 'Graphic Print Tee',
      currentStock: 2,
      threshold: 5,
      alertLevel: 'critical',
      timestamp: new Date().toISOString(),
    }
  },
];

const AdminTestEvents: React.FC<AdminTestEventsProps> = ({ adminId }) => {
  const [selectedEventType, setSelectedEventType] = useState(eventTypes[0].value);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Get the selected event details
  const selectedEvent = eventTypes.find(e => e.value === selectedEventType) || eventTypes[0];

  // Broadcast the test event
  const broadcastEvent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Admin-ID': adminId.toString(),
        },
        body: JSON.stringify({
          event: selectedEvent.value,
          data: selectedEvent.data,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Test Event Sent',
          description: `Successfully broadcasted ${selectedEvent.label} event`,
          variant: 'default',
        });
      } else {
        throw new Error(result.message || 'Failed to send test event');
      }
    } catch (error: any) {
      console.error('Error broadcasting test event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to broadcast test event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Test WebSocket Events
        </CardTitle>
        <CardDescription>
          Send test events to verify real-time communication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="event-type" className="text-sm font-medium">
              Event Type
            </label>
            <Select
              value={selectedEventType}
              onValueChange={setSelectedEventType}
            >
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">
              Event Data Preview
            </div>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32">
              {JSON.stringify(selectedEvent.data, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={broadcastEvent} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Broadcast Test Event
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AdminTestEvents;