import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../components/admin/AdminLayout';
import AdminRealtimeDashboard from '../components/admin/AdminRealtimeDashboard';
import AdminTestEvents from '../components/admin/AdminTestEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, ShoppingCart, Users, Package, AlertCircle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  // Default admin ID - in a real app, this would come from authentication context
  const adminId = 1;
  
  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch admin stats');
      return res.json();
    }
  });

  return (
    <AdminLayout 
      title="Admin Dashboard" 
      subtitle="Monitor your store performance and real-time events"
      adminId={adminId}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.products || 0}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orders || 0}</div>
            <p className="text-xs text-muted-foreground">Total orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground">Products need attention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Realtime Events Dashboard and Test Events */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminRealtimeDashboard adminId={adminId} />
        </div>
        <div className="lg:col-span-1">
          <AdminTestEvents adminId={adminId} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;