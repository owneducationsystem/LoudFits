import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiRequest } from "@/lib/queryClient";

const PaymentFailed = () => {
  const [match, params] = useRoute<{ orderId: string }>("/payment-failed/:orderId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  
  // Get error reason from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reasonParam = urlParams.get('reason');
    
    if (reasonParam) {
      setReason(reasonParam);
    } else {
      setReason("Your payment could not be processed successfully.");
    }
  }, []);
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!params?.orderId) {
          throw new Error("No order ID provided");
        }
        
        const orderId = params.orderId;
        const response = await apiRequest("GET", `/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load order details");
        }
        
        const data = await response.json();
        setOrderNumber(data.orderNumber);
        
      } catch (error: any) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: error.message || "Could not load order details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params?.orderId) {
      fetchOrderDetails();
    } else {
      setIsLoading(false);
    }
  }, [params, toast]);
  
  // Try payment again
  const handleRetryPayment = () => {
    navigate(`/checkout`);
  };
  
  return (
    <>
      <Helmet>
        <title>Payment Failed | Loudfits</title>
        <meta name="description" content="Payment failed for your Loudfits order" />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto py-12 px-4 md:px-6">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Payment Failed</CardTitle>
              <CardDescription className="mt-2">
                {reason}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {!isLoading && orderNumber && (
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Order #{orderNumber}
                  </p>
                </div>
              )}
              
              <div className="bg-muted rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-2">What happened?</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Your payment was not completed or was declined</li>
                  <li>The payment gateway encountered an error</li>
                  <li>The transaction timed out</li>
                </ul>
              </div>
              
              <div className="bg-muted rounded-lg p-4 mt-4">
                <h3 className="font-medium mb-2">What to do next?</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Try the payment again with the same or a different payment method</li>
                  <li>Check that your payment details are correct</li>
                  <li>Contact your bank if the issue persists</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto" 
                onClick={() => navigate("/shop")}
              >
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                className="w-full sm:w-auto"
                onClick={handleRetryPayment}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Payment Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default PaymentFailed;