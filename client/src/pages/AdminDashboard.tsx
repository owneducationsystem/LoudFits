import React from 'react';
import AdminLayout from "@/components/layout/AdminLayout";
import EnhancedDashboard from "@/components/admin/AdminDashboard";

const AdminDashboardPage = () => {
  return (
    <AdminLayout title="Real-Time Dashboard">
      <EnhancedDashboard />
    </AdminLayout>
  );
};

export default AdminDashboardPage;