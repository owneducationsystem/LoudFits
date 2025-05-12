import React, { ReactNode } from 'react';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  adminId?: number;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  adminId = 1 // Default admin ID if not provided
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader adminId={adminId} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        
        {children}
      </main>
      
      <footer className="bg-white border-t py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Loudfits Admin Panel. All rights reserved.</p>
          <p className="mt-1">Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;