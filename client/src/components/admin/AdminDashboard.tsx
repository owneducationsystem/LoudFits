import React, { useState, useEffect } from 'react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';
import { AdminNotificationCenter } from './AdminNotificationCenter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { apiRequest } from '@/lib/queryClient';

// Types for dashboard data
interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: string;
  totalUsers: number;
  lowStockProducts: number;
  updatedAt: string;
}

interface OrderStatusCount {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  canceled: number;
}

const AdminDashboard: React.FC = () => {
  const { notifications, connected } = useNotifications();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: '0.00',
    totalUsers: 0,
    lowStockProducts: 0,
    updatedAt: new Date().toISOString()
  });
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusCount>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    canceled: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen for dashboard updates from the WebSocket
  useEffect(() => {
    // The notification context should already handle receiving WebSocket messages
    // Filter for dashboard_update messages
    const handleDashboardUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'dashboard_update') {
          setMetrics(prev => ({
            ...prev,
            ...data.data
          }));
        }
      } catch (error) {
        console.error('Error handling dashboard update:', error);
      }
    };

    // Set up WebSocket event listener
    const webSocketUrl = window.location.protocol === 'https:' 
      ? `wss://${window.location.host}/ws` 
      : `ws://${window.location.host}/ws`;
    
    const ws = new WebSocket(webSocketUrl);
    ws.addEventListener('message', handleDashboardUpdate);

    // Clean up
    return () => {
      ws.removeEventListener('message', handleDashboardUpdate);
      // Note: don't close the socket here as it's managed by the NotificationContext
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get order metrics
        const orderStatsResponse = await apiRequest('GET', '/api/admin/orders/stats');
        const orderStats = await orderStatsResponse.json();
        
        // Get user metrics
        const userStatsResponse = await apiRequest('GET', '/api/admin/users/stats');
        const userStats = await userStatsResponse.json();
        
        // Get recent orders
        const recentOrdersResponse = await apiRequest('GET', '/api/admin/orders/recent');
        const recentOrdersData = await recentOrdersResponse.json();
        
        // Get product metrics
        const productStatsResponse = await apiRequest('GET', '/api/admin/products/stats');
        const productStats = await productStatsResponse.json();
        
        // Update state with fetched data
        setMetrics({
          totalOrders: orderStats.totalOrders || 0,
          pendingOrders: orderStats.pendingOrders || 0,
          todayRevenue: orderStats.todayRevenue || '0.00',
          totalUsers: userStats.totalUsers || 0,
          lowStockProducts: productStats.lowStockCount || 0,
          updatedAt: new Date().toISOString()
        });
        
        setOrderStatuses({
          pending: orderStats.statusCounts?.pending || 0,
          processing: orderStats.statusCounts?.processing || 0,
          shipped: orderStats.statusCounts?.shipped || 0,
          delivered: orderStats.statusCounts?.delivered || 0,
          canceled: orderStats.statusCounts?.canceled || 0
        });
        
        setRecentOrders(recentOrdersData.orders || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use default values if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Get recent notifications (last 5) to display
  const recentNotifications = notifications
    .filter(n => n.isAdmin)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Filter order notifications
  const orderNotifications = notifications.filter(n => 
    n.type.includes('ORDER_') || 
    n.entityType === 'order'
  );

  // Filter payment notifications
  const paymentNotifications = notifications.filter(n => 
    n.type.includes('PAYMENT_') || 
    n.entityType === 'payment'
  );

  // Filter stock notifications
  const stockNotifications = notifications.filter(n => 
    n.type.includes('STOCK_') || 
    n.type === NotificationType.LOW_STOCK || 
    n.type === NotificationType.OUT_OF_STOCK
  );

  // Calculate total orders (for progress bar)
  const totalOrdersCount = Object.values(orderStatuses).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Order Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.pendingOrders} pending
                </p>
              </CardContent>
            </Card>
            
            {/* Revenue Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{metrics.todayRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            
            {/* User Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active customers 
                </p>
              </CardContent>
            </Card>
            
            {/* Inventory Alerts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div> {/* Fixed value for demo */}
                <p className="text-xs text-muted-foreground">
                  Products need attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Distribution */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Distribution of current orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Pending</span>
                      </div>
                      <span>{orderStatuses.pending}</span>
                    </div>
                    <Progress value={(orderStatuses.pending / totalOrdersCount) * 100 || 0} className="h-2 bg-amber-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span>Processing</span>
                      </div>
                      <span>{orderStatuses.processing}</span>
                    </div>
                    <Progress value={(orderStatuses.processing / totalOrdersCount) * 100 || 0} className="h-2 bg-blue-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-indigo-500" />
                        <span>Shipped</span>
                      </div>
                      <span>{orderStatuses.shipped}</span>
                    </div>
                    <Progress value={(orderStatuses.shipped / totalOrdersCount) * 100 || 0} className="h-2 bg-indigo-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Delivered</span>
                      </div>
                      <span>{orderStatuses.delivered}</span>
                    </div>
                    <Progress value={(orderStatuses.delivered / totalOrdersCount) * 100 || 0} className="h-2 bg-green-100" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Canceled</span>
                      </div>
                      <span>{orderStatuses.canceled}</span>
                    </div>
                    <Progress value={(orderStatuses.canceled / totalOrdersCount) * 100 || 0} className="h-2 bg-red-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Admin Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Latest updates requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map(notification => (
                      <div key={notification.id} className="flex items-start space-x-3 border-b pb-3">
                        {/* Icon based on notification type */}
                        {notification.type.includes('ORDER') && (
                          <ShoppingBag className="h-5 w-5 text-primary" />
                        )}
                        {notification.type.includes('PAYMENT') && (
                          <DollarSign className="h-5 w-5 text-green-500" />
                        )}
                        {(notification.type.includes('STOCK') || notification.type.includes('OUT_OF_STOCK')) && (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
                        {notification.type.includes('USER') && (
                          <Users className="h-5 w-5 text-blue-500" />
                        )}
                        
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent notifications</p>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <TabsTrigger value="notifications" className="text-primary text-sm hover:underline">
                    View all notifications
                  </TabsTrigger>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order Notifications</CardTitle>
              <CardDescription>
                Live updates about orders and shipments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderNotifications.length > 0 ? (
                  orderNotifications.map(notification => (
                    <div key={notification.id} className="flex items-start space-x-3 border-b pb-3">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No order notifications</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>
                Products with low or out of stock status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockNotifications.length > 0 ? (
                  stockNotifications.map(notification => (
                    <div key={notification.id} className="flex items-start space-x-3 border-b pb-3">
                      <AlertTriangle className={`h-5 w-5 ${notification.type === NotificationType.OUT_OF_STOCK ? 'text-red-500' : 'text-amber-500'}`} />
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <p className="text-sm">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No stock alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <AdminNotificationCenter />
        </TabsContent>
      </Tabs>
      
      <div className="text-xs text-muted-foreground mt-8 text-center">
        Dashboard last updated: {new Date(metrics.updatedAt).toLocaleString()}
      </div>
    </div>
  );
};

export default AdminDashboard;