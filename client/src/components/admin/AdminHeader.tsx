import React from 'react';
import { useAdminWebSocket } from '@/hooks/use-admin-websocket';
import AdminWebSocketIndicator from './AdminWebSocketIndicator';
import { Link } from 'wouter';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Settings,
  Tag,
  ShoppingCart, 
  LogOut 
} from 'lucide-react';

interface AdminHeaderProps {
  adminId: number;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ adminId }) => {
  // Get WebSocket connection status for indicator
  const { connected, registered } = useAdminWebSocket({ 
    adminId,
    autoConnect: true 
  });

  const menuItems = [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/admin/dashboard' },
    { label: 'Products', icon: <ShoppingBag className="h-4 w-4" />, href: '/admin/products' },
    { label: 'Categories', icon: <Tag className="h-4 w-4" />, href: '/admin/categories' },
    { label: 'Orders', icon: <ShoppingCart className="h-4 w-4" />, href: '/admin/orders' },
    { label: 'Customers', icon: <Users className="h-4 w-4" />, href: '/admin/users' },
    { label: 'Inventory', icon: <Package className="h-4 w-4" />, href: '/admin/inventory' },
    { label: 'Settings', icon: <Settings className="h-4 w-4" />, href: '/admin/settings' },
  ];

  return (
    <header className="border-b bg-background h-14 sticky top-0 z-30">
      <div className="container h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/admin/dashboard" className="font-bold text-lg mr-6 flex items-center">
            <span className="text-primary">Loudfits</span>
            <span className="ml-1 text-sm text-muted-foreground">Admin</span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="hidden lg:flex">
          <ul className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground flex items-center cursor-pointer">
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side items */}
        <div className="flex items-center space-x-4">
          {/* WebSocket connection indicator */}
          <AdminWebSocketIndicator
            connected={connected}
            registered={registered}
            adminId={adminId}
          />
          
          {/* Admin Info/Logout */}
          <div className="flex items-center">
            <div className="hidden md:block mr-2">
              <div className="text-sm font-medium">Admin</div>
              <div className="text-xs text-muted-foreground">ID: {adminId}</div>
            </div>
            <button className="h-8 w-8 rounded-full flex items-center justify-center bg-accent hover:bg-accent/80">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;