import { useEffect, useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AdminRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

/**
 * Protected route component that only allows access to admin users
 * Redirects to the admin login page if not authenticated
 */
const AdminRoute = ({ component: Component, children, ...rest }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [location] = useLocation();
  
  // Log when the component renders and its props
  console.log("AdminRoute rendering with props:", { 
    hasComponent: !!Component, 
    hasChildren: !!children,
    path: location 
  });
  
  useEffect(() => {
    // Check if user is logged in as admin
    const checkAdminAuth = () => {
      console.log("Checking admin authentication for path:", location);
      const adminUserData = localStorage.getItem("adminUser");
      console.log("Admin user data from localStorage:", adminUserData);
      
      if (!adminUserData) {
        console.log("No admin user data found in localStorage");
        setIsAdmin(false);
        return;
      }
      
      try {
        const adminUser = JSON.parse(adminUserData) as AdminUser;
        
        if (adminUser && adminUser.role === "admin") {
          console.log("Admin user authenticated:", adminUser.username);
          setIsAdmin(true);
          
          // Set admin-id header for API requests
          if (window.fetch) {
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              init = init || {};
              init.headers = init.headers || {};
              
              // Add the admin-id header to API requests
              if (typeof input === 'string' && input.startsWith('/api/admin/')) {
                (init.headers as any)['admin-id'] = adminUser.id.toString();
              }
              
              return originalFetch(input, init);
            };
          }
        } else {
          console.log("User found but not an admin:", adminUser?.username);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error parsing admin user data:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminAuth();
    
    // Clean up fetch override when component unmounts
    return () => {
      if (window.fetch && window.fetch !== globalThis.fetch) {
        window.fetch = globalThis.fetch;
      }
    };
  }, [location]);
  
  // Show loading while checking authentication
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-gray-700" />
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not an admin
  if (!isAdmin) {
    console.log("Access denied, redirecting to login");
    return <Redirect to="/admin/login" />;
  }
  
  // Render admin component if authorized
  console.log("Rendering admin component for", location);
  if (Component) {
    return <Component {...rest} />;
  }
  
  // If no component is provided, render children
  return <>{children}</>;
};

export default AdminRoute;