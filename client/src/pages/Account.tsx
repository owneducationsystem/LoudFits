import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronRight, Package, Heart, User, LogOut, CreditCard, Settings, Truck, ClipboardList, MapPin, ShieldCheck } from "lucide-react";

const Account = () => {
  const [, navigate] = useLocation();
  const { currentUser, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>My Account - Loudfits</title>
        <meta 
          name="description" 
          content="Manage your Loudfits account, update profile information, and track orders."
        />
      </Helmet>
      
      <div className="max-w-5xl mx-auto py-4 px-4 md:py-8">
        {currentUser ? (
          <>
            {/* Mobile Amazon-style account page */}
            <div className="md:hidden">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-[#582A34] flex items-center justify-center text-white text-xl font-semibold mr-3">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <h1 className="text-xl font-bold">Hello, {currentUser.displayName || "User"}</h1>
                  <p className="text-sm text-gray-500">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Account sections in grid layout */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center h-28 w-full"
                  onClick={() => navigate("/orders")}
                >
                  <Package className="w-6 h-6 text-[#582A34] mb-2" />
                  <span className="text-center font-medium">Your Orders</span>
                </button>
                
                <button 
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center h-28 w-full"
                  onClick={() => navigate("/wishlist")}
                >
                  <Heart className="w-6 h-6 text-[#582A34] mb-2" />
                  <span className="text-center font-medium">Your Wishlist</span>
                </button>
                
                <button 
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center h-28 w-full"
                  onClick={() => navigate("/account/profile")}
                >
                  <User className="w-6 h-6 text-[#582A34] mb-2" />
                  <span className="text-center font-medium">Your Profile</span>
                </button>
                
                <button 
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col items-center justify-center h-28 w-full"
                  onClick={() => navigate("/account/addresses")}
                >
                  <MapPin className="w-6 h-6 text-[#582A34] mb-2" />
                  <span className="text-center font-medium">Your Addresses</span>
                </button>
              </div>

              {/* Account & Settings section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Account & Settings</h2>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/account/profile")}
                  >
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Profile Information</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/account/addresses")}
                  >
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Addresses</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/account/payments")}
                  >
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Payment Methods</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/account/security")}
                  >
                    <div className="flex items-center">
                      <ShieldCheck className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Login & Security</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 flex items-center justify-between"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center">
                      <LogOut className="w-5 h-5 text-red-500 mr-3" />
                      <span className="text-red-500">Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Customer Service section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Customer Service</h2>
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/track-order")}
                  >
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Track Your Order</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 border-b border-gray-100 flex items-center justify-between"
                    onClick={() => navigate("/faq")}
                  >
                    <div className="flex items-center">
                      <ClipboardList className="w-5 h-5 text-gray-500 mr-3" />
                      <span>FAQ & Help</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button 
                    className="w-full p-4 flex items-center justify-between"
                    onClick={() => navigate("/contact")}
                  >
                    <div className="flex items-center">
                      <Settings className="w-5 h-5 text-gray-500 mr-3" />
                      <span>Contact Us</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop account page (original layout) */}
            <div className="hidden md:block">
              <h1 className="text-3xl font-bold mb-8">My Account</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar / Navigation */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Navigation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => navigate("/account")}
                        >
                          Profile Settings
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => navigate("/orders")}
                        >
                          Order History
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => navigate("/wishlist")}
                        >
                          Wishlist
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:bg-red-50" 
                        onClick={handleLogout}
                      >
                        Sign Out
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name</span>
                          <p className="font-medium">{currentUser.displayName || "Not set"}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email</span>
                          <p className="font-medium">{currentUser.email}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Member Since</span>
                          <p className="font-medium">
                            {currentUser.metadata?.creationTime 
                              ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Main Content */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                      <CardDescription>
                        Update your account information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="personal">Personal Info</TabsTrigger>
                          <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="personal" className="space-y-6 pt-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="displayName">Display Name</Label>
                              <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
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
                                disabled={currentUser.providerData?.some(p => p.providerId === 'google.com')}
                              />
                              {currentUser.providerData?.some(p => p.providerId === 'google.com') && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Email cannot be changed for Google accounts
                                </p>
                              )}
                            </div>
                            
                            <Button 
                              onClick={handleUpdateProfile} 
                              disabled={isLoading}
                              className="w-full md:w-auto"
                            >
                              {isLoading ? "Updating..." : "Update Profile"}
                            </Button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="security" className="space-y-6 pt-6">
                          <div className="space-y-4">
                            {!currentUser.providerData?.some(p => p.providerId === 'google.com') ? (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <div className="relative">
                                    <Input
                                      id="newPassword"
                                      type={showPassword ? "text" : "password"}
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="Enter new password"
                                      className="pr-10"
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
                                
                                <Button 
                                  onClick={() => {
                                    // To be implemented
                                    toast({
                                      title: "Feature coming soon",
                                      description: "Password change functionality will be available soon.",
                                    });
                                  }} 
                                  disabled={isLoading || !newPassword}
                                  className="w-full md:w-auto"
                                >
                                  {isLoading ? "Updating..." : "Change Password"}
                                </Button>
                              </>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  You're signed in with Google. Password management is handled through your Google account.
                                </p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-96 flex items-center justify-center">
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

export default Account;