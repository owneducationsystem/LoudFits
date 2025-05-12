import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, Package, Users, Settings, BarChart3, ShoppingCart, LogOut, Bell, Radio, LayoutDashboard, Waves, Terminal, MinusCircle, RadioTower, Wifi } from 'lucide-react';
import GlobalWebSocketIndicator from './GlobalWebSocketIndicator';

interface AdminHeaderProps {
  title?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'Admin Dashboard' }) => {
  const [location, navigate] = useLocation();
  
  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">{title}</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            <Button
              variant={location === '/admin' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            
            <Button
              variant={location === '/admin/dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            
            <Button
              variant={location === '/admin/orders' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </Button>
            
            <Button
              variant={location === '/admin/products' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/products')}
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </Button>
            
            <Button
              variant={location === '/admin/users' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            
            <Button
              variant={location === '/admin/real-time' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/real-time')}
            >
              <Radio className="h-4 w-4 mr-2" />
              Real-Time
            </Button>
            
            <Button
              variant={location === '/admin/real-time-fixed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/real-time-fixed')}
            >
              <RadioTower className="h-4 w-4 mr-2" />
              RT-Fixed
            </Button>
            
            <Button
              variant={location === '/admin/ws-only' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/ws-only')}
            >
              <Wifi className="h-4 w-4 mr-2" />
              WS-Only
            </Button>
            
            <Button
              variant={location === '/admin/simple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/simple')}
            >
              <Waves className="h-4 w-4 mr-2" />
              Simple
            </Button>
            
            <Button
              variant={location === '/admin/basic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/basic')}
            >
              <Terminal className="h-4 w-4 mr-2" />
              Basic
            </Button>
            
            <Button
              variant={location === '/admin/mini' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/mini')}
            >
              <MinusCircle className="h-4 w-4 mr-2" />
              Mini
            </Button>
            
            <Button
              variant={location === '/admin/settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
          
          <div className="flex items-center space-x-3">
            <GlobalWebSocketIndicator />
            
            <Button
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/login')}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;