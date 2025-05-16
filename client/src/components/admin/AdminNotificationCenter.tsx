import React, { useState, useMemo } from 'react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';
import { 
  Bell, X, ShoppingBag, CreditCard, Package, Info, AlertTriangle,
  User, Truck, CheckCircle, TagIcon, AlertCircle, ShieldAlert, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';

// Types for filtering notifications
type FilterType = 'all' | 'order' | 'payment' | 'product' | 'user' | 'system';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export function AdminNotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, connected } = useNotifications();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter(notification => {
      // Filter by type category
      if (filterType !== 'all') {
        if (filterType === 'order' && !notification.type.includes('ORDER_')) {
          return false;
        }
        if (filterType === 'payment' && !notification.type.includes('PAYMENT_')) {
          return false;
        }
        if (filterType === 'product' && !notification.type.includes('PRODUCT_') && 
            !notification.type.includes('STOCK_') && 
            !notification.type.includes('OUT_OF_STOCK') &&
            !notification.type.includes('LOW_STOCK')) {
          return false;
        }
        if (filterType === 'user' && !notification.type.includes('USER_')) {
          return false;
        }
        if (filterType === 'system' && notification.type !== NotificationType.SYSTEM && 
            notification.type !== NotificationType.ERROR && 
            notification.type !== NotificationType.ADMIN_ALERT) {
          return false;
        }
      }
      
      // Filter by priority
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) {
        return false;
      }
      
      // Filter by read status
      if (showUnreadOnly && notification.read) {
        return false;
      }
      
      return true;
    });
    
    // Group by date (today, yesterday, this week, earlier)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    return {
      today: filtered.filter(n => new Date(n.createdAt) >= today),
      yesterday: filtered.filter(n => {
        const date = new Date(n.createdAt);
        return date >= yesterday && date < today;
      }),
      thisWeek: filtered.filter(n => {
        const date = new Date(n.createdAt);
        return date >= lastWeekStart && date < yesterday;
      }),
      earlier: filtered.filter(n => new Date(n.createdAt) < lastWeekStart)
    };
  }, [notifications, filterType, priorityFilter, showUnreadOnly]);
  
  // Get total count for each group
  const counts = useMemo(() => {
    return {
      today: groupedNotifications.today.length,
      yesterday: groupedNotifications.yesterday.length,
      thisWeek: groupedNotifications.thisWeek.length,
      earlier: groupedNotifications.earlier.length,
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length
    };
  }, [groupedNotifications, notifications]);
  
  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      // Order notifications
      case NotificationType.ORDER_PLACED:
        return <ShoppingBag className="h-4 w-4 text-green-500" />;
      case NotificationType.ORDER_UPDATED:
        return <Package className="h-4 w-4 text-blue-500" />;
      case NotificationType.ORDER_SHIPPED:
        return <Truck className="h-4 w-4 text-blue-500" />;
      case NotificationType.ORDER_DELIVERED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case NotificationType.ORDER_CANCELED:
        return <X className="h-4 w-4 text-red-500" />;
        
      // Payment notifications
      case NotificationType.PAYMENT_RECEIVED:
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case NotificationType.PAYMENT_FAILED:
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case NotificationType.PAYMENT_REFUNDED:
        return <CreditCard className="h-4 w-4 text-amber-500" />;
        
      // User notifications
      case NotificationType.USER_REGISTERED:
        return <User className="h-4 w-4 text-blue-500" />;
      case NotificationType.USER_UPDATED:
        return <User className="h-4 w-4 text-blue-400" />;
        
      // Product notifications
      case NotificationType.PRODUCT_UPDATED:
        return <TagIcon className="h-4 w-4 text-indigo-500" />;
      case NotificationType.PRODUCT_ADDED:
        return <TagIcon className="h-4 w-4 text-green-500" />;
      case NotificationType.STOCK_ALERT:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case NotificationType.LOW_STOCK:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case NotificationType.OUT_OF_STOCK:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
        
      // Admin notifications
      case NotificationType.ADMIN_ALERT:
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case NotificationType.ADMIN_LOGIN:
        return <User className="h-4 w-4 text-purple-500" />;
        
      // System notifications
      case NotificationType.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case NotificationType.SYSTEM:
        return <Info className="h-4 w-4 text-blue-500" />;
        
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Get priority badge for notification
  const getPriorityBadge = (priority?: 'low' | 'medium' | 'high' | 'urgent') => {
    if (!priority) return null;
    
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[0.65rem]">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-[0.65rem]">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[0.65rem] border-amber-500 text-amber-500">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[0.65rem] border-gray-300 text-gray-500">Low</Badge>;
      default:
        return null;
    }
  };
  
  // Render notification item
  const renderNotification = (notification: any) => (
    <div 
      key={notification.id}
      className={cn(
        "p-3 hover:bg-muted transition-colors mb-2 rounded-md border",
        !notification.read && "bg-muted/50",
        notification.priority === 'urgent' && "bg-red-50/70 border-red-200",
        notification.priority === 'high' && "bg-amber-50/70 border-amber-200",
        notification.actionRequired && "border-l-2 border-amber-500"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center">
              <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                {notification.title}
              </p>
              {getPriorityBadge(notification.priority)}
            </div>
            
            {!notification.read ? (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-6 rounded-sm text-xs text-blue-500 hover:text-blue-700 px-2"
                onClick={() => markAsRead(notification.id)}
              >
                Mark read
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Read</span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {notification.message}
          </p>
          
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details" className="border-none">
                <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:text-foreground">
                  Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-xs space-y-1 bg-muted/30 p-2 rounded-sm">
                    {Object.entries(notification.metadata).map(([key, value]: [string, any]) => (
                      <div key={key} className="grid grid-cols-3 gap-1">
                        <span className="font-medium">{key}:</span>
                        <span className="col-span-2 break-words">{
                          typeof value === 'object' 
                            ? JSON.stringify(value) 
                            : String(value)
                        }</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground/70">
              {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
            </p>
            
            {notification.actionRequired && (
              <Badge 
                variant="outline" 
                className="ml-2 px-1.5 py-0 text-[0.65rem] border-amber-500 text-amber-500"
              >
                Action needed
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render notification group
  const renderNotificationGroup = (title: string, items: any[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">{title}</h3>
        <div className="space-y-1">
          {items.map(renderNotification)}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="max-w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            <CardTitle className="text-lg">Notification Center</CardTitle>
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-2 px-2 py-0.5 text-xs"
              >
                {unreadCount} new
              </Badge>
            )}
            <span className="ml-2 text-xs text-muted-foreground">
              ({connected ? 
                <span className="text-green-600">Connected</span> : 
                <span className="text-red-600">Disconnected</span>})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              disabled={counts.unread === 0}
            >
              Mark all read
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              onClick={() => clearNotifications()}
              disabled={counts.total === 0}
            >
              Clear all
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <div className="p-3 bg-muted/30">
        <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant={showUnreadOnly ? "secondary" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? "Unread Only" : "All Messages"}
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-3">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="all">
              All
              {counts.total > 0 && <Badge variant="outline" className="ml-2">{counts.total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="today">
              Today
              {counts.today > 0 && <Badge variant="outline" className="ml-2">{counts.today}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="yesterday">
              Yesterday
              {counts.yesterday > 0 && <Badge variant="outline" className="ml-2">{counts.yesterday}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="older">
              Older
              {(counts.thisWeek + counts.earlier) > 0 && (
                <Badge variant="outline" className="ml-2">{counts.thisWeek + counts.earlier}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] pr-3">
            <TabsContent value="all" className="mt-0">
              {counts.total === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">No notifications to display</p>
                </div>
              ) : (
                <>
                  {renderNotificationGroup("Today", groupedNotifications.today)}
                  {renderNotificationGroup("Yesterday", groupedNotifications.yesterday)}
                  {renderNotificationGroup("This Week", groupedNotifications.thisWeek)}
                  {renderNotificationGroup("Earlier", groupedNotifications.earlier)}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="today" className="mt-0">
              {counts.today === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">No notifications for today</p>
                </div>
              ) : (
                renderNotificationGroup("Today", groupedNotifications.today)
              )}
            </TabsContent>
            
            <TabsContent value="yesterday" className="mt-0">
              {counts.yesterday === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">No notifications from yesterday</p>
                </div>
              ) : (
                renderNotificationGroup("Yesterday", groupedNotifications.yesterday)
              )}
            </TabsContent>
            
            <TabsContent value="older" className="mt-0">
              {(counts.thisWeek + counts.earlier) === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <p className="text-muted-foreground">No older notifications</p>
                </div>
              ) : (
                <>
                  {renderNotificationGroup("This Week", groupedNotifications.thisWeek)}
                  {renderNotificationGroup("Earlier", groupedNotifications.earlier)}
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}