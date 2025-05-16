import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import EnhancedDashboard from "@/components/admin/AdminDashboard";
import { Button } from '@/components/ui/button';

const AdminDashboardPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if admin is logged in
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing admin user data:", error);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not logged in, show access denied
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You need to be logged in as an admin to access the dashboard.</p>
          <Button onClick={() => navigate('/admin/login')}>Login as Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Real-Time Dashboard">
      <EnhancedDashboard />
    </AdminLayout>
  );
};

export default AdminDashboardPage;