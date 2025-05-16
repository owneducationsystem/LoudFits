import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  ShoppingBag,
  Users,
  Settings,
  Package,
  LogOut,
  Menu,
  X,
  Layers,
  BarChart2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNav() {
  const [location] = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <Home className="h-5 w-5" /> },
    { name: "Orders", href: "/admin/orders", icon: <ShoppingBag className="h-5 w-5" /> },
    { name: "Products", href: "/admin/products", icon: <Package className="h-5 w-5" /> },
    { name: "Inventory", href: "/admin/inventory", icon: <Layers className="h-5 w-5" /> },
    { name: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { name: "Reports", href: "/admin/dashboard", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  const handleLogout = () => {
    // Implement logout functionality
    fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        window.location.href = "/admin/login";
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <>
      {/* Mobile Navigation Toggle */}
      <div className="block lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileNav}
          aria-label="Toggle menu"
        >
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${
          mobileNavOpen ? "block" : "hidden"
        }`}
        onClick={toggleMobileNav}
      ></div>

      <nav
        className={`bg-white fixed top-0 bottom-0 left-0 w-64 z-50 shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:w-auto lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">LoudFits Admin</h1>
            <p className="text-sm text-gray-500">Inventory Management</p>
          </div>

          <div className="p-4 flex-grow overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                        location === item.href
                          ? "bg-[#582A34] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}