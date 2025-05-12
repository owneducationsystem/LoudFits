import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Eye, EyeOff, LogIn, UserPlus, User, Mail, Lock } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";

// Login Form Schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration Form Schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth = () => {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { 
    currentUser, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    error 
  } = useAuth();
  
  // Determine initial tab based on URL
  const initialTab = location === "/signup" ? "register" : "login";
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      // First attempt to sign in with email and password via Firebase
      const result = await signInWithEmail(values.username, values.password);
      
      if (result) {
        toast({
          title: "Login successful",
          description: "Welcome back to Loudfits!",
        });
        navigate("/");
      }
    } catch (err) {
      // If Firebase auth fails, we don't need to display an error as the AuthContext will handle it
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...userData } = values;
      
      // Register with Firebase
      const result = await signUpWithEmail(userData.email, userData.password);
      
      if (result) {
        // Also send user data to our backend for storage
        await apiRequest("POST", "/api/users", userData);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created. You are now logged in.",
        });
        navigate("/");
      }
    } catch (err) {
      // If Firebase auth fails, we don't need to display an error as the AuthContext will handle it
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      console.log("Starting Google login process...");
      const result = await signInWithGoogle();
      
      if (result) {
        console.log("Google login successful:", result.user.email);
        // Create or update user in our backend if needed
        const { user } = result;
        
        if (user.email) {
          try {
            console.log("Attempting to save user to database");
            await apiRequest("POST", "/api/users", {
              username: user.displayName || user.email.split("@")[0],
              email: user.email,
              // We don't store the actual password for OAuth users
              password: ""
            });
            console.log("User saved to database successfully");
          } catch (err) {
            // User might already exist in our database, which is fine
            console.log("User database operation result:", err);
          }
        }
        
        toast({
          title: "Login successful",
          description: "You have successfully signed in with Google!",
        });
        navigate("/");
      } else {
        console.log("Google login returned no result");
        // Show a custom error if the auth context didn't already show one
        if (!error) {
          toast({
            title: "Login failed",
            description: "Failed to sign in with Google. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      // While most errors will be handled by AuthContext,
      // we'll log them here too for debugging
      console.error("Google login error in component:", err);
      
      // Add a popup directly in the Auth component to provide additional feedback
      toast({
        title: "Authentication Error",
        description: err instanceof Error 
          ? `Error: ${err.message}` 
          : "An unknown error occurred during Google authentication",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Debug info for development/troubleshooting
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  return (
    <>
      <Helmet>
        <title>{initialTab === "login" ? "Login" : "Sign Up"} - Loudfits</title>
        <meta 
          name="description" 
          content={initialTab === "login" 
            ? "Log in to your Loudfits account to access your orders, wishlist, and more." 
            : "Create a Loudfits account to enjoy faster checkout, order tracking, and personalized recommendations."}
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-md mx-auto">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
                
                {/* Google Login Button */}
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full mb-6 py-6 flex items-center justify-center gap-2 border-gray-300 relative overflow-hidden group"
                >
                  {isSubmitting && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
                    </div>
                  )}
                  <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  {isSubmitting ? "Connecting to Google..." : "Continue with Google"}
                </Button>
                
                <div className="relative mb-6">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-gray-500 text-sm">OR</span>
                  </div>
                </div>
                
                {/* Login Form */}
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                {...field} 
                                placeholder="Enter your username" 
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="pl-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-right">
                      <a 
                        href="#" 
                        className="text-sm text-[#582A34] hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          const email = loginForm.getValues().username.includes('@') 
                            ? loginForm.getValues().username 
                            : '';
                            
                          // Show prompt if email is not already in the form
                          const userEmail = email || window.prompt("Please enter your email address");
                          
                          if (userEmail) {
                            resetPassword(userEmail)
                              .then(() => {
                                toast({
                                  title: "Password reset email sent",
                                  description: "Check your inbox for instructions to reset your password.",
                                });
                              })
                              .catch((err) => {
                                console.error("Password reset error:", err);
                              });
                          }
                        }}
                      >
                        Forgot password?
                      </a>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-black hover:bg-[#582A34] text-white py-6"
                        disabled={isSubmitting}
                      >
                        <LogIn className="h-5 w-5 mr-2" />
                        {isSubmitting ? "Logging in..." : "Login"}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </div>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
                
                {/* Google Sign Up Button */}
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full mb-6 py-6 flex items-center justify-center gap-2 border-gray-300 relative overflow-hidden group"
                >
                  {isSubmitting && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
                    </div>
                  )}
                  <svg className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  {isSubmitting ? "Connecting to Google..." : "Sign up with Google"}
                </Button>
                
                <div className="relative mb-6">
                  <Separator />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-white px-2 text-gray-500 text-sm">OR</span>
                  </div>
                </div>
                
                {/* Register Form */}
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                {...field} 
                                placeholder="Choose a username" 
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                {...field} 
                                type="email" 
                                placeholder="Enter your email" 
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password"
                                className="pl-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                className="pl-10"
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <p className="text-xs text-gray-500">
                      By signing up, you agree to our{" "}
                      <a href="#" className="text-[#582A34] hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#582A34] hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-black hover:bg-[#582A34] text-white py-6"
                        disabled={isSubmitting}
                      >
                        <UserPlus className="h-5 w-5 mr-2" />
                        {isSubmitting ? "Creating account..." : "Create Account"}
                      </Button>
                    </motion.div>
                  </form>
                </Form>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Debug information section - hidden by default */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-xs text-gray-500 hover:text-[#582A34] underline"
            >
              {showDebugInfo ? "Hide" : "Show"} technical information
            </button>
            
            {showDebugInfo && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md text-left text-xs">
                <h3 className="font-bold mb-2">Debug Information</h3>
                <div className="space-y-1 font-mono">
                  <p>Current User: {currentUser ? `${currentUser.email} (${currentUser.uid})` : "None"}</p>
                  <p>Authentication Error: {error || "None"}</p>
                  <p>URL: {window.location.href}</p>
                  <p>Origin: {window.location.origin}</p>
                  <p>Firebase Project: {import.meta.env.VITE_FIREBASE_PROJECT_ID || "Not set"}</p>
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="mb-1">Troubleshooting steps:</p>
                    <ol className="list-decimal pl-4">
                      <li>Check if Firebase project has Google auth enabled</li>
                      <li>Verify {window.location.origin} is added to authorized domains in Firebase console</li>
                      <li>Ensure popup windows are not blocked by the browser</li>
                      <li>Try the redirect method instead of popup method</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
