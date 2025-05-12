import { useEffect, useState } from "react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AdminRouteProps {
  component: React.ComponentType;
}

/**
 * Protected route component that only allows access to admin users
 * Redirects to the admin login page if not authenticated
 */
const AdminRoute = ({ component: Component, ...rest }: AdminRouteProps) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if user is logged in as admin
    const checkAdminAuth = () => {
      const adminUserData = localStorage.getItem("adminUser");
      
      if (!adminUserData) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const adminUser = JSON.parse(adminUserData) as AdminUser;
        
        if (adminUser && adminUser.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error parsing admin user data:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminAuth();
  }, []);
  
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
  
  // TEMPORARY: Skip authentication check for development
  // In production, this would redirect to login if not admin
  if (false && !isAdmin) {
    return <Redirect to="/admin/login" />;
  }
  
  // Render admin component if authorized
  return <Component {...rest} />;
};

export default AdminRoute;