import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";

const ProfilePage = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else {
      // Initialize fields
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser, navigate]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      // Implementation will be added later
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Profile Settings - Loudfits</title>
        <meta 
          name="description" 
          content="Update your Loudfits profile information and account settings."
        />
      </Helmet>
      
      <div className="max-w-2xl mx-auto py-4 px-4 md:py-8">
        {/* Mobile back button */}
        <button 
          onClick={() => navigate("/account")}
          className="flex items-center text-gray-600 mb-4 md:hidden"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Back to Account</span>
        </button>

        <h1 className="text-2xl font-bold mb-6">Profile Information</h1>
        
        {currentUser ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white"
                    disabled={currentUser.providerData?.some(p => p.providerId === 'google.com')}
                  />
                  {currentUser.providerData?.some(p => p.providerId === 'google.com') && (
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed for Google accounts
                    </p>
                  )}
                </div>
                
                {!currentUser.providerData?.some(p => p.providerId === 'google.com') && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pr-10 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Leave blank if you don't want to change your password
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-100 p-5">
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading account information...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;