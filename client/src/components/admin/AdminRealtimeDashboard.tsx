import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdminRealtime } from '@/hooks/use-admin-realtime';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  User, 
  AlertTriangle, 
  Clock, 
  ShoppingBag,
  RefreshCw,
  Bell
} from 'lucide-react';

interface AdminRealtimeDashboardProps {
  adminId: number;
}

interface AdminEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

const EVENT_COLORS: Record<string, string> = {
  order_update: 'bg-blue-100 text-blue-800 border-blue-200',
  user_signup: 'bg-green-100 text-green-800 border-green-200',
  product_update: 'bg-purple-100 text-purple-800 border-purple-200',
  stock_alert: 'bg-red-100 text-red-800 border-red-200',
  payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  order_update: <Package className="w-4 h-4" />,
  user_signup: <User className="w-4 h-4" />,
  product_update: <ShoppingBag className="w-4 h-4" />,
  stock_alert: <AlertTriangle className="w-4 h-4" />,
  payment: <RefreshCw className="w-4 h-4" />,
  default: <Bell className="w-4 h-4" />
};

const AdminRealtimeDashboard: React.FC<AdminRealtimeDashboardProps> = ({ adminId }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const maxEvents = 20; // Maximum number of events to display

  // Query to fetch past events from API
  const { data: pastEvents = [], refetch, isLoading } = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await fetch('/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
  });

  // Set up WebSocket for real-time events
  const { addEvent, events: realtimeEvents, clearEvents } = useAdminRealtime<AdminEvent>({ 
    adminId, 
    enabled: true
  });

  // Combine past events with realtime events
  useEffect(() => {
    // Combined and sorted events
    const combinedEvents = [...pastEvents, ...realtimeEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxEvents);
    
    setEvents(combinedEvents);
  }, [pastEvents, realtimeEvents]);

  // Filter events based on active tab
  const filteredEvents = activeTab === 'all' 
    ? events 
    : events.filter(event => event.type === activeTab);

  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get event color class based on type
  const getEventColor = (type: string) => {
    return EVENT_COLORS[type] || EVENT_COLORS.default;
  };

  // Get event icon based on type
  const getEventIcon = (type: string) => {
    return EVENT_ICONS[type] || EVENT_ICONS.default;
  };

  // Reset all events
  const handleReset = () => {
    clearEvents();
    refetch();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            <span>Real-time Events</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            disabled={isLoading}
            className="ml-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Monitor real-time events and activities across your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="order_update">Orders</TabsTrigger>
            <TabsTrigger value="user_signup">Users</TabsTrigger>
            <TabsTrigger value="product_update">Products</TabsTrigger>
            <TabsTrigger value="stock_alert">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto opacity-20 mb-2" />
                <p>No {activeTab === 'all' ? '' : activeTab} events to display.</p>
                <p className="text-sm mt-1">Events will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredEvents.map((event, index) => (
                  <div 
                    key={`${event.id}-${index}`} 
                    className="border rounded-lg p-3 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={`${getEventColor(event.type)} flex items-center gap-1 mr-2`}
                        >
                          {getEventIcon(event.type)}
                          {event.type.replace('_', ' ')}
                        </Badge>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(event.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {event.type === 'order_update' && (
                        <p>
                          <strong>Order #{event.data.orderId}</strong> status changed to <strong>{event.data.status}</strong>
                          {event.data.message && <span> - {event.data.message}</span>}
                        </p>
                      )}
                      
                      {event.type === 'user_signup' && (
                        <p>
                          New user <strong>{event.data.name}</strong> ({event.data.email}) has registered
                        </p>
                      )}
                      
                      {event.type === 'product_update' && (
                        <p>
                          Product <strong>{event.data.name}</strong> has been updated - 
                          Price: ₹{event.data.price}, Stock: {event.data.stock}
                        </p>
                      )}
                      
                      {event.type === 'stock_alert' && (
                        <p>
                          <strong>Low stock alert</strong> for {event.data.name} - 
                          Only {event.data.currentStock} left (below threshold of {event.data.threshold})
                        </p>
                      )}
                      
                      {!['order_update', 'user_signup', 'product_update', 'stock_alert'].includes(event.type) && (
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        Displaying {filteredEvents.length} of {events.length} events • Admin ID: {adminId}
      </CardFooter>
    </Card>
  );
};

export default AdminRealtimeDashboard;