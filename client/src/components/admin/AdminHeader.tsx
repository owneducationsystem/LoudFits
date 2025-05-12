import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, User, ShoppingBag, Package, Settings, Users, BarChart2, LogOut } from 'lucide-react';
import AdminWebSocketIndicator from './AdminWebSocketIndicator';

interface AdminHeaderProps {
  adminId: number;
}

const navigationItems = [
  { label: 'Dashboard', href: '/admin', icon: <BarChart2 className="w-5 h-5" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminId }) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Loudfits</span>
              <span className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">Admin</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location === item.href
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side elements - WebSocket indicator & User menu */}
          <div className="flex items-center space-x-4">
            {/* WebSocket Status Indicator */}
            <div className="hidden md:block">
              <AdminWebSocketIndicator adminId={adminId} />
            </div>
            
            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center text-sm font-medium text-gray-700 focus:outline-none"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="ml-2 hidden md:block">Admin</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  location === item.href
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            
            <div className="px-3 py-2">
              <AdminWebSocketIndicator adminId={adminId} />
            </div>
            
            <Link
              href="/admin/logout"
              className="flex items-center px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-50 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogOut className="mr-3 w-5 h-5" />
              Logout
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;