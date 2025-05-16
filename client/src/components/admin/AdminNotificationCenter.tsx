import React, { useState, useEffect } from 'react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';
import { 
  ShoppingBag, 
  AlertTriangle, 
  Bell, 
  User, 
  DollarSign, 
  Tag, 
  Clock,
  CheckCircle
} from 'lucide-react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Type definitions for notification filtering and display
type NotificationFilter = 'all' | 'orders' | 'payments' | 'inventory' | 'users' | 'system';

// Maps notification types to notification groups
const notificationTypeGroupMap: Record<NotificationType, NotificationFilter> = {
  [NotificationType.ORDER_PLACED]: 'orders',
  [NotificationType.ORDER_UPDATED]: 'orders',
  [NotificationType.ORDER_SHIPPED]: 'orders',
  [NotificationType.ORDER_DELIVERED]: 'orders',
  [NotificationType.ORDER_CANCELED]: 'orders',
  
  [NotificationType.PAYMENT_RECEIVED]: 'payments',
  [NotificationType.PAYMENT_FAILED]: 'payments',
  [NotificationType.PAYMENT_REFUNDED]: 'payments',
  
  [NotificationType.USER_REGISTERED]: 'users',
  [NotificationType.USER_UPDATED]: 'users',
  
  [NotificationType.PRODUCT_UPDATED]: 'inventory',
  [NotificationType.PRODUCT_ADDED]: 'inventory',
  [NotificationType.STOCK_ALERT]: 'inventory',
  [NotificationType.LOW_STOCK]: 'inventory',
  [NotificationType.OUT_OF_STOCK]: 'inventory',
  
  [NotificationType.ADMIN_ALERT]: 'system',
  [NotificationType.ADMIN_LOGIN]: 'system',
  
  [NotificationType.SYSTEM]: 'system',
  [NotificationType.ERROR]: 'system'
};

export const AdminNotificationCenter: React.FC = () => {
  const { notifications, markAllAsRead, markAsRead, connected } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Filter notifications that are meant for admin
  const adminNotifications = notifications.filter(n => n.isAdmin);
  
  // Filter notifications based on active filter
  const filteredNotifications = activeFilter === 'all' 
    ? adminNotifications 
    : adminNotifications.filter(n => notificationTypeGroupMap[n.type] === activeFilter);
  
  // Count unread notifications
  const unreadCount = adminNotifications.filter(n => !n.read).length;
  
  // Filter counts for badge display
  const filterCounts = {
    all: adminNotifications.length,
    orders: adminNotifications.filter(n => notificationTypeGroupMap[n.type] === 'orders').length,
    payments: adminNotifications.filter(n => notificationTypeGroupMap[n.type] === 'payments').length,
    inventory: adminNotifications.filter(n => notificationTypeGroupMap[n.type] === 'inventory').length,
    users: adminNotifications.filter(n => notificationTypeGroupMap[n.type] === 'users').length,
    system: adminNotifications.filter(n => notificationTypeGroupMap[n.type] === 'system').length
  };
  
  // Priority sorting - show high priority and unread notifications first
  const prioritySortedNotifications = [...filteredNotifications].sort((a, b) => {
    // First sort by read/unread status
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    
    // Then sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = a.priority || 'low';
    const bPriority = b.priority || 'low';
    
    if (priorityOrder[aPriority] < priorityOrder[bPriority]) return -1;
    if (priorityOrder[aPriority] > priorityOrder[bPriority]) return 1;
    
    // Finally sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Handle marking notification as read
  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    const group = notificationTypeGroupMap[type];
    
    switch (group) {
      case 'orders':
        return <ShoppingBag className="h-5 w-5 text-primary" />;
      case 'payments':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'inventory':
        return type === NotificationType.OUT_OF_STOCK 
          ? <AlertTriangle className="h-5 w-5 text-red-500" />
          : <Tag className="h-5 w-5 text-amber-500" />;
      case 'users':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'system':
        return type === NotificationType.ERROR
          ? <AlertTriangle className="h-5 w-5 text-red-500" />
          : <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get color class based on notification priority
  const getPriorityColorClass = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-amber-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time notifications and alerts for your store activity
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-muted-foreground">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={(value) => setActiveFilter(value as NotificationFilter)}>
          <TabsList className="w-full flex justify-between mb-4">
            <TabsTrigger value="all" className="flex-1">
              All
              {filterCounts.all > 0 && <Badge className="ml-2 bg-primary">{filterCounts.all}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1">
              Orders
              {filterCounts.orders > 0 && <Badge className="ml-2 bg-primary">{filterCounts.orders}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1">
              Payments
              {filterCounts.payments > 0 && <Badge className="ml-2 bg-primary">{filterCounts.payments}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1">
              Inventory
              {filterCounts.inventory > 0 && <Badge className="ml-2 bg-primary">{filterCounts.inventory}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              Users
              {filterCounts.users > 0 && <Badge className="ml-2 bg-primary">{filterCounts.users}</Badge>}
            </TabsTrigger>
          </TabsList>
          
          {['all', 'orders', 'payments', 'inventory', 'users', 'system'].map((filterValue) => (
            <TabsContent key={filterValue} value={filterValue} className="space-y-4">
              {prioritySortedNotifications.length > 0 ? (
                prioritySortedNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border ${!notification.read ? 'bg-gray-50 dark:bg-gray-900' : ''}`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-primary rounded-full"></span>
                          )}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {notification.priority && (
                            <Badge className={getPriorityColorClass(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{notification.message}</p>
                      {notification.actionRequired && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Take Action
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p>No notifications in this category</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
        {unreadCount > 0 && (
          <Button 
            variant="default" 
            size="sm"
            onClick={markAllAsRead}
          >
            Mark All as Read
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};