import React, { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import { Helmet } from 'react-helmet';

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
  adminId = 1
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{title} - Loudfits Admin</title>
        <meta 
          name="description" 
          content="Loudfits Admin Dashboard - Manage your products, orders, and customers" 
        />
      </Helmet>
      
      <AdminHeader adminId={adminId} />
      
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        {children}
      </main>
      
      <footer className="border-t py-4 bg-background">
        <div className="container flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Loudfits. All rights reserved.
          </div>
          <div className="text-sm text-muted-foreground">
            Admin Dashboard v1.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;