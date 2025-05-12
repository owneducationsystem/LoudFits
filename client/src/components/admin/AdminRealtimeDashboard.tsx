import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminRealtime } from '@/hooks/use-admin-realtime';
import { Loader2, RefreshCw } from 'lucide-react';
import AdminWebSocketIndicator from './AdminWebSocketIndicator';

interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
}

/**
 * A dashboard component to display real-time events from the admin WebSocket
 */
const AdminRealtimeDashboard: React.FC = () => {
  const [adminId] = useState<number>(1);
  
  // Use our admin real-time hook
  const { 
    events, 
    loading, 
    error, 
    connected, 
    registered, 
    triggerAction, 
    refresh 
  } = useAdminRealtime<Event>({ adminId });
  
  // Handle requesting more data
  const handleRefresh = () => {
    refresh();
  };
  
  // Handle sending a test event
  const handleSendTestEvent = () => {
    triggerAction('test_event', { 
      message: 'Test event from admin dashboard',
      timestamp: new Date().toISOString()
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Dashboard</h2>
        <AdminWebSocketIndicator adminId={adminId} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              WebSocket connection information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection:</span>
                {connected ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    Disconnected
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Registration:</span>
                {registered ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Registered
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    Not Registered
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admin ID:</span>
                <Badge variant="outline">{adminId}</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={!connected || !registered}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Latest real-time events from the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
                <h3 className="font-medium">Error loading events</h3>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-4 border border-gray-200 bg-gray-50 text-gray-500 rounded-md">
                <p>No events available. Try sending a test event.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {events.map((event) => (
                  <div 
                    key={event.id} 
                    className="p-3 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">
                        {event.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{event.message}</p>
                    {event.data && (
                      <pre className="mt-2 p-2 text-xs bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSendTestEvent}
              disabled={!connected || !registered}
            >
              Send Test Event
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminRealtimeDashboard;