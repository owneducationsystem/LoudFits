import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminRealtimeDashboard from '../components/admin/AdminRealtimeDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout title="Admin Dashboard">
      <div className="container mx-auto px-4 py-6">
        <AdminRealtimeDashboard />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;