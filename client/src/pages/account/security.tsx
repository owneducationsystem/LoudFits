import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

const SecurityPage = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Implementation will be added later
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login & Security - Loudfits</title>
        <meta 
          name="description" 
          content="Manage your Loudfits account security settings and password."
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

        <h1 className="text-2xl font-bold mb-6">Login & Security</h1>
        
        {currentUser ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {currentUser.providerData?.some(p => p.providerId === 'google.com') ? (
              <div className="p-5">
                <div className="flex items-center justify-center flex-col p-6">
                  <ShieldCheck className="h-16 w-16 text-[#582A34] mb-4" />
                  <h3 className="text-xl font-medium mb-2">Google Account Login</h3>
                  <p className="text-gray-600 text-center mb-4">
                    You're signed in with Google. Password management is handled through your Google account.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                    className="mt-2"
                  >
                    Manage Google Account
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
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
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-white"
                      />
                      <p className="text-xs text-gray-500">
                        Password must be at least 8 characters long with a mix of letters, numbers, and symbols
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 p-5">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </>
            )}
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

export default SecurityPage;