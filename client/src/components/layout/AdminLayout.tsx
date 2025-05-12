import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/lib/firebase";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

// Enhanced Firebase User type with admin-specific fields
interface EnhancedUser extends User {
  role?: string;
  firstName?: string;
  lastName?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { currentUser, logout } = useAuth();
  
  // Cast to our enhanced type
  const user = currentUser as EnhancedUser | null;

  const toggleSubmenu = (submenu: string) => {
    if (activeSubmenu === submenu) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(submenu);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const sidebarMenuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/admin",
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      path: "/admin/users",
      submenu: [
        { title: "All Users", path: "/admin/users" },
        { title: "Add User", path: "/admin/users/add" },
      ],
    },
    {
      title: "Products",
      icon: <ShoppingBag className="h-5 w-5" />,
      path: "/admin/products",
      submenu: [
        { title: "All Products", path: "/admin/products" },
        { title: "Add Product", path: "/admin/products/add" },
        { title: "Categories", path: "/admin/products/categories" },
      ],
    },
    {
      title: "Orders",
      icon: <ClipboardList className="h-5 w-5" />,
      path: "/admin/orders",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/admin/settings",
    },
  ];

  // For demo purposes, allow admin access to all logged-in users
  // In a real app, we would check user.role === 'admin'
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You don't have permission to access the admin panel.</p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full bg-white shadow-md"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/admin">
            <span className="text-xl font-bold text-gray-900">LoudFits Admin</span>
          </Link>
        </div>

        <div className="py-4 px-3">
          <nav className="space-y-1">
            {sidebarMenuItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "flex items-center w-full px-3 py-2 text-left rounded-md text-sm font-medium transition-colors",
                        window.location.pathname === item.path
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {item.icon}
                      <span className="ml-3 flex-1">{item.title}</span>
                      {activeSubmenu === item.title ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {activeSubmenu === item.title && (
                      <div className="ml-8 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.title}
                            href={subitem.path}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              window.location.pathname === subitem.path
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            {subitem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      window.location.pathname === item.path
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="px-3 py-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <header className="bg-white shadow">
          <div className="py-4 px-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </header>

        <main className="p-6">{children}</main>

        <footer className="bg-white shadow-inner px-6 py-4 mt-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} LoudFits Admin Panel. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;