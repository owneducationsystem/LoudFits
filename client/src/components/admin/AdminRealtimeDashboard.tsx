import React, { useEffect, useState } from 'react';
import { useAdminRealtime } from '@/hooks/use-admin-realtime';
import { useAdminWebSocket } from '@/hooks/use-admin-websocket';
import { AlertCircle, Bell, CheckCircle, Clock, User, Package, CreditCard, Activity, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
}

const eventIcons = {
  order_update: <Package className="w-5 h-5" />,
  user_signup: <User className="w-5 h-5" />,
  product_update: <CreditCard className="w-5 h-5" />,
  stock_alert: <AlertCircle className="w-5 h-5" />,
  connection: <Activity className="w-5 h-5" />,
  registration: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5 text-destructive" />,
  default: <Bell className="w-5 h-5" />
};

const getEventIcon = (type: string) => {
  const key = type.toLowerCase() as keyof typeof eventIcons;
  return eventIcons[key] || eventIcons.default;
};

const getEventColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'order_update':
      return 'bg-blue-50 border-blue-100 text-blue-700';
    case 'user_signup':
      return 'bg-green-50 border-green-100 text-green-700';
    case 'product_update':
      return 'bg-purple-50 border-purple-100 text-purple-700';
    case 'stock_alert':
      return 'bg-orange-50 border-orange-100 text-orange-700';
    case 'error':
      return 'bg-red-50 border-red-100 text-red-700';
    case 'connection':
      return 'bg-teal-50 border-teal-100 text-teal-700';
    case 'registration':
      return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    default:
      return 'bg-gray-50 border-gray-100 text-gray-700';
  }
};

interface AdminRealtimeDashboardProps {
  adminId: number;
  maxEvents?: number;
}

export const AdminRealtimeDashboard: React.FC<AdminRealtimeDashboardProps> = ({ 
  adminId,
  maxEvents = 30
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { toast } = useToast();
  const { connected, registered, reconnect } = useAdminWebSocket({ 
    adminId, 
    autoConnect: true 
  });

  // Subscribe to realtime events
  const { events: realtimeEvents } = useAdminRealtime<Event>({ 
    adminId, 
    enabled: connected && registered 
  });

  // Load initial events from API
  useEffect(() => {
    if (registered) {
      fetch('/api/admin/events')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setEvents(prev => {
              // Merge with existing events, avoiding duplicates
              const merged = [...prev];
              data.forEach(event => {
                if (!merged.some(e => e.id === event.id)) {
                  merged.push(event);
                }
              });
              // Sort by timestamp descending and limit to maxEvents
              return merged
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, maxEvents);
            });
          }
        })
        .catch(error => {
          console.error('Error fetching events:', error);
        });
    }
  }, [registered, maxEvents]);

  // Update events when new realtime events arrive
  useEffect(() => {
    if (realtimeEvents?.length) {
      const lastEvent = realtimeEvents[realtimeEvents.length - 1];
      
      // Add the event to our state
      setEvents(prev => {
        const newEvents = [...prev];
        if (!newEvents.some(e => e.id === lastEvent.id)) {
          newEvents.unshift(lastEvent);
        }
        return newEvents.slice(0, maxEvents);
      });
      
      // Show toast notification for the event
      toast({
        title: `New ${lastEvent.type} event`,
        description: lastEvent.message,
        variant: 'default',
      });
    }
  }, [realtimeEvents, toast, maxEvents]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Real-time Events</h2>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <button 
            onClick={reconnect}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Reconnect WebSocket"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No events received yet</p>
            <p className="text-sm">Events will appear here in real-time</p>
          </div>
        ) : (
          events.map(event => (
            <div 
              key={event.id} 
              className={`p-3 rounded-lg border flex items-start gap-3 ${getEventColor(event.type)}`}
            >
              <div className="mt-0.5">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium truncate">{event.type}</h3>
                  <span className="text-xs flex items-center whitespace-nowrap ml-2">
                    <Clock className="w-3 h-3 mr-1 opacity-70" />
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm opacity-90">{event.message}</p>
                {event.data && (
                  <details className="mt-1">
                    <summary className="text-xs cursor-pointer hover:underline">View details</summary>
                    <pre className="text-xs mt-2 p-2 bg-white bg-opacity-50 rounded overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminRealtimeDashboard;