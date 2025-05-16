import React from 'react';
import EnhancedDashboard from "@/components/admin/AdminDashboard";
import { Card } from '@/components/ui/card';

// Create a simpler component that doesn't have the authentication wrapper
// The authentication will be handled by the AdminRoute component in App.tsx
const AdminDashboardPage = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Real-Time Dashboard</h1>
      <Card className="p-4">
        <EnhancedDashboard />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;