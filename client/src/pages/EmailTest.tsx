import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import our email testing utility functions
import {
  sendWelcomeEmail,
  sendLoginEmail,
  sendOrderEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailureEmail,
  sendOrderStatusEmail
} from "@/lib/emailTest";

const EmailTest: React.FC = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>('1');
  const [orderId, setOrderId] = useState<string>('1');
  const [orderStatus, setOrderStatus] = useState<string>('SHIPPED');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{success: boolean, message: string, type: string} | null>(null);

  // Test email endpoints
  const emailEndpoints = [
    { id: 'welcome', name: 'Welcome Email', requires: ['userId'] },
    { id: 'login', name: 'Login Notification', requires: ['userId'] },
    { id: 'order', name: 'Order Confirmation', requires: ['userId', 'orderId'] },
    { id: 'payment-success', name: 'Payment Confirmation', requires: ['userId', 'orderId'] },
    { id: 'payment-failure', name: 'Payment Failure', requires: ['userId', 'orderId'] },
    { id: 'order-status', name: 'Order Status Update', requires: ['userId', 'orderId', 'status'] }
  ];
  
  const [selectedEmail, setSelectedEmail] = useState<string>(emailEndpoints[0].id);
  
  // Find currently selected email type
  const currentEmailType = emailEndpoints.find(email => email.id === selectedEmail);

  // Handle sending test email using our utility functions
  const sendTestEmail = async () => {
    if (!currentEmailType) return;
    
    setLoading(true);
    setLastResult(null);
    
    try {
      // Convert string IDs to numbers
      const userIdNum = parseInt(userId);
      const orderIdNum = parseInt(orderId);
      
      // Call the appropriate function based on email type
      let result;
      
      switch (selectedEmail) {
        case 'welcome':
          result = await sendWelcomeEmail(userIdNum);
          break;
        case 'login':
          result = await sendLoginEmail(userIdNum);
          break;
        case 'order':
          result = await sendOrderEmail(userIdNum, orderIdNum);
          break;
        case 'payment-success':
          result = await sendPaymentSuccessEmail(userIdNum, orderIdNum);
          break;
        case 'payment-failure':
          result = await sendPaymentFailureEmail(userIdNum, orderIdNum);
          break;
        case 'order-status':
          result = await sendOrderStatusEmail(userIdNum, orderIdNum, orderStatus);
          break;
        default:
          throw new Error(`Unknown email type: ${selectedEmail}`);
      }
      
      if (result.success) {
        toast({
          title: "Email sent successfully",
          description: result.message,
          variant: "default"
        });
        
        setLastResult({
          success: true,
          message: result.message,
          type: currentEmailType.name
        });
      } else {
        toast({
          title: "Failed to send email",
          description: result.message,
          variant: "destructive"
        });
        
        setLastResult({
          success: false,
          message: result.message,
          type: currentEmailType.name
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
      
      setLastResult({
        success: false,
        message: error.message || 'An error occurred',
        type: currentEmailType.name
      });
    } finally {
      setLoading(false);
    }
  };

  // Render form based on required fields
  const renderForm = () => {
    if (!currentEmailType) return null;
    
    return (
      <div className="space-y-4">
        {currentEmailType.requires.includes('userId') && (
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              type="number"
              min="1"
            />
          </div>
        )}
        
        {currentEmailType.requires.includes('orderId') && (
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              value={orderId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrderId(e.target.value)}
              placeholder="Enter order ID"
              type="number"
              min="1"
            />
          </div>
        )}
        
        {currentEmailType.requires.includes('status') && (
          <div className="space-y-2">
            <Label htmlFor="orderStatus">Order Status</Label>
            <Select 
              value={orderStatus} 
              onValueChange={setOrderStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Email Notification Test</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Use this tool to test different types of automated emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select 
                    value={selectedEmail} 
                    onValueChange={setSelectedEmail}
                  >
                    <SelectTrigger id="emailType">
                      <SelectValue placeholder="Select email type" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailEndpoints.map(email => (
                        <SelectItem key={email.id} value={email.id}>
                          {email.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {renderForm()}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendTestEmail} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>
                Latest test email result
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResult ? (
                <Alert variant={lastResult.success ? "default" : "destructive"}>
                  <div className="flex items-start">
                    {lastResult.success ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <div>
                      <AlertTitle>{lastResult.type}</AlertTitle>
                      <AlertDescription>{lastResult.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No emails sent yet</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>User ID:</strong> Enter the ID of an existing user in the database. The system will use the user's email and other details.
                </p>
                <p>
                  <strong>Order ID:</strong> Enter the ID of an existing order to include accurate order details in the email.
                </p>
                <p>
                  <strong>Check your email</strong> to verify that the notification was received correctly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailTest;