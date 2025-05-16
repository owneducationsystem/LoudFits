import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, ClipboardList } from "lucide-react";
import EnhancedAdminDashboard from "@/components/admin/AdminDashboard";

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState("overview");
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        // Send admin user ID in header for authorization
        const response = await apiRequest("GET", "/api/admin/stats", null);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return { users: 0, products: 0, orders: 0 };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);

  // Sample data for charts - in a real app, this would come from the API
  const salesData = [
    { name: "Jan", sales: 4000 },
    { name: "Feb", sales: 3000 },
    { name: "Mar", sales: 5000 },
    { name: "Apr", sales: 2780 },
    { name: "May", sales: 1890 },
    { name: "Jun", sales: 2390 },
    { name: "Jul", sales: 3490 },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "User Registration",
      description: "New user signed up via Google Auth",
      time: "10 minutes ago",
    },
    {
      id: 2,
      action: "New Order",
      description: "Order #LF-1234 was placed for ₹2,499",
      time: "1 hour ago",
    },
    {
      id: 3,
      action: "Product Update",
      description: "Inventory updated for 'Abstract Design Tee'",
      time: "3 hours ago",
    },
    {
      id: 4,
      action: "Customer Support",
      description: "Ticket #T-567 was resolved",
      time: "5 hours ago",
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : stats.users}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> +5.2% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-4">
                  <ShoppingBag className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : stats.products}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> +2.4% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-full mr-4">
                  <ClipboardList className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? "..." : stats.orders}</p>
                  <p className="text-xs text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" /> -1.5% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹45,231</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" /> +10.2% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <Link href="/admin/dashboard">
              <TabsTrigger value="enhanced" onClick={() => window.location.href = "/admin/dashboard"}>Real-Time Dashboard</TabsTrigger>
            </Link>
            <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="py-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Monthly sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="sales" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
                <CardFooter className="text-sm text-gray-500">
                  Updated 1 hour ago
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions in the admin panel</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    View all activity
                  </a>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="enhanced" className="py-4">
            <EnhancedAdminDashboard />
          </TabsContent>

          <TabsContent value="sales" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Sales Analytics</CardTitle>
                <CardDescription>Comprehensive sales data analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  This section will contain detailed sales analytics charts and insights.
                </p>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Enhanced sales analytics will be shown here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent actions and changes in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  Comprehensive activity log with filtering and search capabilities.
                </p>
                <div className="space-y-4">
                  {recentActivity.concat(recentActivity).map((activity, index) => (
                    <div
                      key={`${activity.id}-${index}`}
                      className="border-b pb-3 last:border-0 last:pb-0"
                    >
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;