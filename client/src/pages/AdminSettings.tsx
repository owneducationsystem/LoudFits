import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layout/AdminLayout";
import { apiRequest } from "@/lib/queryClient";

// Form Schema
const generalSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeEmail: z.string().email("Please enter a valid email address"),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  storeDescription: z.string().optional(),
  currency: z.string().default("INR"),
  taxRate: z.coerce.number().min(0).max(100).default(18),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.coerce.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  emailFrom: z.string().email().optional(),
  emailNotifications: z.boolean().default(true),
});

const checkoutSettingsSchema = z.object({
  allowGuestCheckout: z.boolean().default(true),
  requirePhoneNumber: z.boolean().default(true),
  shippingFlatRate: z.coerce.number().min(0).default(50),
  freeShippingThreshold: z.coerce.number().min(0).default(1000),
  paymentMethods: z.object({
    cod: z.boolean().default(true),
    online: z.boolean().default(true),
  }),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type EmailSettingsValues = z.infer<typeof emailSettingsSchema>;
type CheckoutSettingsValues = z.infer<typeof checkoutSettingsSchema>;

// Settings Page
const AdminSettings = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // General Settings Form
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      storeName: "Loudfits",
      storeEmail: "contact@loudfits.com",
      storePhone: "+91 9876543210",
      storeAddress: "123 Fashion Street, Delhi, India",
      storeDescription: "Trendy printed t-shirts with bold designs",
      currency: "INR",
      taxRate: 18,
    },
  });
  
  // Email Settings Form
  const emailForm = useForm<EmailSettingsValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "notifications@loudfits.com",
      smtpPassword: "",
      emailFrom: "noreply@loudfits.com",
      emailNotifications: true,
    },
  });
  
  // Checkout Settings Form
  const checkoutForm = useForm<CheckoutSettingsValues>({
    resolver: zodResolver(checkoutSettingsSchema),
    defaultValues: {
      allowGuestCheckout: true,
      requirePhoneNumber: true,
      shippingFlatRate: 50,
      freeShippingThreshold: 1000,
      paymentMethods: {
        cod: true,
        online: true,
      },
    },
  });
  
  // Handle Submit General Settings
  const onSubmitGeneral = async (values: GeneralSettingsValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      // await apiRequest("PUT", "/api/admin/settings/general", values);
      
      console.log("Submitted general settings:", values);
      
      toast({
        title: "Settings saved",
        description: "General settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Submit Email Settings
  const onSubmitEmail = async (values: EmailSettingsValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      // await apiRequest("PUT", "/api/admin/settings/email", values);
      
      console.log("Submitted email settings:", values);
      
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Submit Checkout Settings
  const onSubmitCheckout = async (values: CheckoutSettingsValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      // await apiRequest("PUT", "/api/admin/settings/checkout", values);
      
      console.log("Submitted checkout settings:", values);
      
      toast({
        title: "Settings saved",
        description: "Checkout settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <Helmet>
        <title>Store Settings | Admin Dashboard</title>
      </Helmet>
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your store settings and preferences
        </p>
      </div>
      
      <Tabs 
        defaultValue="general" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="checkout">Checkout</TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form 
                  id="general-form" 
                  onSubmit={generalForm.handleSubmit(onSubmitGeneral)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="storeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="storePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={generalForm.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="storeDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.01"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Default tax rate applied to products
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => generalForm.reset()}
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="submit"
                form="general-form"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email notifications and SMTP settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form 
                  id="email-form" 
                  onSubmit={emailForm.handleSubmit(onSubmitEmail)}
                  className="space-y-6"
                >
                  <FormField
                    control={emailForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Send email notifications for orders and account activities
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Separator className="my-4" />
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-medium">SMTP Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure your email server settings for sending notifications
                    </p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={emailForm.control}
                    name="emailFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Email Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This email address will be used as the sender for all outgoing emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => emailForm.reset()}
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="submit"
                form="email-form"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Checkout Settings Tab */}
        <TabsContent value="checkout">
          <Card>
            <CardHeader>
              <CardTitle>Checkout Settings</CardTitle>
              <CardDescription>
                Configure checkout options and shipping settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...checkoutForm}>
                <form 
                  id="checkout-form" 
                  onSubmit={checkoutForm.handleSubmit(onSubmitCheckout)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={checkoutForm.control}
                      name="allowGuestCheckout"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Guest Checkout
                            </FormLabel>
                            <FormDescription>
                              Allow customers to checkout without creating an account
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={checkoutForm.control}
                      name="requirePhoneNumber"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Phone Number
                            </FormLabel>
                            <FormDescription>
                              Make phone number a required field during checkout
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-medium">Shipping Options</h3>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={checkoutForm.control}
                      name="shippingFlatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Flat Shipping Rate (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="1"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={checkoutForm.control}
                      name="freeShippingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Shipping Threshold (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="1"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Order amount above which shipping is free
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={checkoutForm.control}
                      name="paymentMethods.cod"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Cash on Delivery
                            </FormLabel>
                            <FormDescription>
                              Allow customers to pay when they receive their order
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={checkoutForm.control}
                      name="paymentMethods.online"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Online Payment
                            </FormLabel>
                            <FormDescription>
                              Allow customers to pay online using credit/debit cards and UPI
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button
                variant="outline"
                onClick={() => checkoutForm.reset()}
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSettings;