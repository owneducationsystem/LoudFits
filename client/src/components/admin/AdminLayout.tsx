import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LogOut, ShoppingBag, Users, Settings, BarChart2, Package, Home, User } from 'lucide-react';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin' }) => {
  const [location] = useLocation();
  
  const sidebarLinks = [
    { href: '/admin', icon: <Home className="w-5 h-5" />, label: 'Dashboard' },
    { href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders' },
    { href: '/admin/products', icon: <Package className="w-5 h-5" />, label: 'Products' },
    { href: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'Users' },
    { href: '/admin/stats', icon: <BarChart2 className="w-5 h-5" />, label: 'Statistics' },
    { href: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-md z-10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b">
            <Link href="/admin">
              <a className="text-xl font-bold text-primary">Loudfits Admin</a>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {sidebarLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <a
                      className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                        location === link.href
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {link.icon}
                      <span className="ml-3">{link.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Admin Profile & Logout */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">Admin</p>
                  <p className="text-xs text-gray-500">admin@loudfits.com</p>
                </div>
              </div>
              
              <Link href="/admin/logout">
                <a className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <AdminHeader title={title} />
        
        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;