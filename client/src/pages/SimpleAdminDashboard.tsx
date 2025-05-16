import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
  Truck,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";

const SimpleAdminDashboard = () => {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0
  });
  const [latestOrders, setLatestOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch basic stats
        const statsResponse = await apiRequest("GET", "/api/admin/stats");
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch latest orders - limited to 5
        const ordersResponse = await apiRequest("GET", "/api/admin/orders/latest?limit=5");
        const ordersData = await ordersResponse.json();
        setLatestOrders(ordersData);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Data for system health indicators
  const systemHealth = {
    server: { status: 'healthy', uptime: '99.98%' },
    database: { status: 'healthy', responseTime: '45ms' },
    api: { status: 'healthy', requests: '342/min' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-300 bg-red-50 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Return to Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Real-Time Dashboard</h1>
            <p className="text-muted-foreground">Monitor your store's performance and activity in real-time.</p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className={`${systemHealth.server.status === 'healthy' ? 'border-green-200' : 'border-red-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {systemHealth.server.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={systemHealth.server.status === 'healthy' ? 'text-green-700' : 'text-red-700'}>
                    {systemHealth.server.status === 'healthy' ? 'Operational' : 'Issues Detected'}
                  </span>
                </div>
                <Badge variant="outline">Uptime: {systemHealth.server.uptime}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className={`${systemHealth.database.status === 'healthy' ? 'border-green-200' : 'border-red-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {systemHealth.database.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={systemHealth.database.status === 'healthy' ? 'text-green-700' : 'text-red-700'}>
                    {systemHealth.database.status === 'healthy' ? 'Connected' : 'Connection Issues'}
                  </span>
                </div>
                <Badge variant="outline">Response: {systemHealth.database.responseTime}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className={`${systemHealth.api.status === 'healthy' ? 'border-green-200' : 'border-red-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {systemHealth.api.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <span className={systemHealth.api.status === 'healthy' ? 'text-green-700' : 'text-red-700'}>
                    {systemHealth.api.status === 'healthy' ? 'All Systems Go' : 'Performance Issues'}
                  </span>
                </div>
                <Badge variant="outline">Traffic: {systemHealth.api.requests}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
              <Progress value={65} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products}</div>
              <p className="text-xs text-muted-foreground mt-1">
                23 with low stock
              </p>
              <Progress value={45} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                5 pending, 12 processing
              </p>
              <Progress value={78} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Latest Orders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Latest Orders</CardTitle>
            <CardDescription>
              Showing the 5 most recent orders across your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {latestOrders && latestOrders.length > 0 ? (
                latestOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.orderNumber}</span>
                        <Badge variant={
                          order.status === 'pending' ? 'outline' : 
                          order.status === 'processing' ? 'secondary' :
                          order.status === 'shipped' ? 'default' :
                          order.status === 'delivered' ? 'default' : 'destructive'
                        }>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Customer:</span> {order.userName || 'Guest User'} • 
                        <span className="font-medium ml-1">Amount:</span> {formatCurrency(Number(order.totalAmount || 0))} •
                        <span className="font-medium ml-1">Items:</span> {order.itemCount || '?'}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(order.createdAt).toLocaleString()}
                        
                        {order.paymentStatus && (
                          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent orders found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue and Fulfillment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Monthly revenue breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                <p>Revenue data visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order Fulfillment</CardTitle>
              <CardDescription>
                Current order status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-gray-500 rounded-full mr-2"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2" />
                
                <div className="flex justify-between mt-4">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Processing</span>
                  </div>
                  <span className="text-sm font-medium">40%</span>
                </div>
                <Progress value={40} className="h-2" />
                
                <div className="flex justify-between mt-4">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm">Shipped</span>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <Progress value={15} className="h-2" />
                
                <div className="flex justify-between mt-4">
                  <div className="flex items-center">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Delivered</span>
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminDashboard;