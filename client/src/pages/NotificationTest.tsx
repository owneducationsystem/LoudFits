import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NotificationBell } from '@/components/ui/NotificationBell';

const NotificationTest = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  // Add a fallback in case notifications context isn't available yet
  const notificationContext = useNotifications();
  const notifications = notificationContext?.notifications || [];
  const connected = notificationContext?.connected || false;
  
  const sendTestNotification = async () => {
    try {
      const response = await apiRequest('GET', '/api/notifications/test');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Broadcast notification sent',
          description: 'A test notification has been sent to all connected clients',
        });
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };

  const sendOrderNotification = async () => {
    try {
      // Safely handle possible undefined user ID
      const userId = currentUser ? ((currentUser as any).id || currentUser.uid || 1) : 1;
      
      const response = await apiRequest('POST', '/api/notifications/order-test', { 
        userId 
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Order notification sent',
          description: `Order notification for #${data.orderNumber} has been sent`,
        });
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending order notification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };

  const sendPaymentNotification = async (success: boolean) => {
    try {
      // Safely handle possible undefined user ID
      const userId = currentUser ? ((currentUser as any).id || currentUser.uid || 1) : 1;
      
      const response = await apiRequest('POST', '/api/notifications/payment-test', { 
        userId,
        success
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: success ? 'Payment success notification sent' : 'Payment failure notification sent',
          description: `Payment notification for order #${data.orderNumber} has been sent`,
        });
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending payment notification:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Notification Testing</h1>
          <p className="text-muted-foreground">Test the real-time notification system</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white p-2 rounded-full shadow-md">
            <NotificationBell />
          </div>
          <div className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <Tabs defaultValue="send">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="received">Received Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Notification</CardTitle>
              <CardDescription>
                Send a test notification to all connected clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will send a system notification that will be visible to everyone currently connected to the system.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={sendTestNotification}>
                Send Broadcast Notification
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Notification</CardTitle>
              <CardDescription>
                Send a test order confirmation notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                This will send an order placed notification to the current user and an admin notification.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={sendOrderNotification}>
                Send Order Notification
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Notifications</CardTitle>
              <CardDescription>
                Send test payment success or failure notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test different payment notification scenarios.
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                onClick={() => sendPaymentNotification(true)}
                variant="default"
              >
                Payment Success
              </Button>
              <Button 
                onClick={() => sendPaymentNotification(false)}
                variant="destructive"
              >
                Payment Failure
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Received Notifications</CardTitle>
              <CardDescription>
                These are the notifications you have received
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <p>No notifications received yet.</p>
                  <p className="text-sm mt-2">Try sending a test notification!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{notification.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                          Type: {notification.type}
                        </span>
                        {notification.read ? (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Read
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationTest;