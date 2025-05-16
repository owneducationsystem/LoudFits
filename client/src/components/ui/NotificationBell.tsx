import React, { useState, useMemo } from 'react';
import { 
  Bell, CheckCheck, X, ShoppingBag, 
  CreditCard, Package, Info, AlertTriangle, 
  User, Truck, CheckCircle, Users, TagIcon,
  ShoppingCart, AlertCircle, ShieldAlert
} from 'lucide-react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { format } from 'date-fns';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  
  // Handle opening the notification panel
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
  };
  
  // Handle clicking on a notification
  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Additional logic to navigate or show details could be added here
  };
  
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
        return <Users className="h-4 w-4 text-blue-400" />;
        
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
      default:
        return null;
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.2rem] min-h-[1.2rem] flex items-center justify-center text-[0.65rem]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <div className="p-3 border-b flex items-center justify-between">
            <h4 className="font-medium text-sm">Notifications</h4>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => clearNotifications()}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-3 hover:bg-muted cursor-pointer transition-colors",
                      !notification.read && "bg-muted/50",
                      notification.priority === 'urgent' && "bg-red-50/70 hover:bg-red-50/90",
                      notification.priority === 'high' && "bg-amber-50/70 hover:bg-amber-50/90",
                      notification.actionRequired && "border-l-2 border-amber-500"
                    )}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
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
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        
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
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </PopoverContent>
    </Popover>
  );
}