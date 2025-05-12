import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { formatPrice } from "@/lib/utils";
import { Loader2, Check, CheckCircle, Truck, Calendar, Package, ArrowRight, Wifi } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiRequest } from "@/lib/queryClient";

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  size: string;
  color: string;
  productName: string;
  productImage: string;
}

interface OrderDetails {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
}

const OrderConfirmation = () => {
  const [match, params] = useRoute<{ orderId: string }>("/order-confirmation/:orderId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);
  
  // Set up WebSocket connection for real-time updates
  const { isConnected, messages, getMessagesByType } = useWebSocket({
    onOpen: () => {
      setHasRealTimeUpdates(true);
      console.log('Connected to real-time updates');
    },
    onClose: () => {
      setHasRealTimeUpdates(false);
    }
  });
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!params?.orderId) {
          // Check if we have an order in session storage (from PhonePe redirect)
          const storedOrderId = sessionStorage.getItem("order_id");
          if (storedOrderId) {
            navigate(`/order-confirmation/${storedOrderId}`);
            return;
          }
          throw new Error("No order ID provided");
        }
        
        const orderId = params.orderId;
        const response = await apiRequest("GET", `/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load order details");
        }
        
        const data = await response.json();
        setOrder(data);
        
        // Clear session storage
        sessionStorage.removeItem("order_id");
        sessionStorage.removeItem("order_number");
        
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
    
    fetchOrderDetails();
  }, [params, navigate, toast]);
  
  // Process WebSocket messages for real-time updates
  useEffect(() => {
    if (messages.length > 0 && order) {
      // Get the latest payment_updated or order_updated message
      const paymentMessages = getMessagesByType('payment_updated');
      const orderMessages = getMessagesByType('order_updated');
      
      if (paymentMessages.length > 0 || orderMessages.length > 0) {
        const latestMessage = [...paymentMessages, ...orderMessages]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (latestMessage && latestMessage.data) {
          const { payment, order: updatedOrder } = latestMessage.data;
          
          // Only update if this message is for our current order
          if (payment && payment.orderId === order.id) {
            console.log('Received real-time update for order:', payment);
            
            setOrder(prevOrder => {
              if (!prevOrder) return null;
              return {
                ...prevOrder,
                paymentStatus: updatedOrder?.paymentStatus || 
                               (payment.status === 'completed' ? 'paid' : payment.status),
                status: updatedOrder?.status || prevOrder.status
              };
            });
            
            // Show toast notification
            toast({
              title: `Payment ${payment.status}`,
              description: `Your payment of ${formatPrice(payment.amount)} has been ${payment.status}`,
              variant: payment.status === 'completed' ? 'default' : 'destructive'
            });
          }
        }
      }
    }
  }, [messages, order, getMessagesByType, toast]);

  // Fall back to polling if WebSockets are not connected
  useEffect(() => {
    let interval: number | undefined;
    
    // Only use polling as a fallback if WebSocket is not connected
    if (order && order.paymentStatus === "pending" && !hasRealTimeUpdates) {
      console.log('Using fallback polling for payment status updates');
      
      interval = window.setInterval(async () => {
        try {
          const response = await apiRequest("GET", `/api/payment/status/${order.id}`);
          const data = await response.json();
          
          if (data.success && data.order.paymentStatus !== "pending") {
            setOrder(prevOrder => {
              if (!prevOrder) return null;
              return { 
                ...prevOrder, 
                paymentStatus: data.order.paymentStatus,
                status: data.order.status 
              };
            });
            
            // Clear interval if payment is complete
            if (data.order.paymentStatus === "paid") {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error("Error checking payment status:", error);
          // Don't clear interval on error, keep trying
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order, hasRealTimeUpdates]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  
  // Get delivery estimate
  const getDeliveryEstimate = () => {
    if (!order) return "";
    
    const createdDate = new Date(order.createdAt);
    const deliveryDate = new Date(createdDate);
    
    // Add days based on shipping method
    if (order.shippingCost === 120) {
      // Express shipping (1-2 days)
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    } else {
      // Standard shipping (3-5 days)
      deliveryDate.setDate(deliveryDate.getDate() + 5);
    }
    
    return new Intl.DateTimeFormat("en-IN", {
      month: "long",
      day: "numeric",
    }).format(deliveryDate);
  };
  
  // Status badge
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case "paid":
      case "completed":
        return <Badge className="bg-green-500 text-white">Completed</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-blue-500 text-white">Processing</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "failed":
      case "cancelled":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Loading Order Details</h2>
            <p className="text-muted-foreground">Please wait while we fetch your order information...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (!order) {
    return (
      <>
        <Header />
        <div className="container mx-auto flex items-center justify-center py-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find the order you're looking for.</p>
            <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Order Confirmation | Loudfits</title>
        <meta name="description" content="Thank you for your Loudfits order" />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
            <p className="text-muted-foreground mb-2">
              Your order #{order.orderNumber} has been received
            </p>
            <p className="text-muted-foreground">
              We'll send a confirmation email to {order.shippingAddress.email} with the order details.
            </p>
          </div>
          
          {/* Order Details Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Order #{order.orderNumber}</CardTitle>
                  <CardDescription>
                    Placed on {formatDate(order.createdAt)}
                  </CardDescription>
                </div>
                {renderStatusBadge(order.paymentStatus)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Order Status */}
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium mb-4">Order Status</h3>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-2 mr-3">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Order Placed</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative ml-[1.25rem] pl-4 border-l h-8 border-dashed border-muted-foreground"></div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={`rounded-full p-2 mr-3 ${order.paymentStatus === 'paid' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-muted'}`}>
                      {order.paymentStatus === 'paid' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">Payment {order.paymentStatus === 'paid' ? 'Confirmed' : 'Pending'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.paymentStatus === 'paid' ? 'Your payment has been confirmed' : 'Waiting for payment confirmation'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(order.paymentStatus === 'paid' || order.status === 'processing') && (
                  <>
                    <div className="relative ml-[1.25rem] pl-4 border-l h-8 border-dashed border-muted-foreground"></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`rounded-full p-2 mr-3 ${order.status === 'processing' || order.status === 'shipped' ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-muted'}`}>
                          {order.status === 'processing' || order.status === 'shipped' ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">Processing Order</p>
                          <p className="text-sm text-muted-foreground">
                            Your order is being prepared
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative ml-[1.25rem] pl-4 border-l h-8 border-dashed border-muted-foreground"></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`rounded-full p-2 mr-3 bg-muted-foreground text-muted`}>
                          <Truck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Order Shipped</p>
                          <p className="text-sm text-muted-foreground">
                            Estimated delivery: {getDeliveryEstimate()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Separator />
              
              {/* Order Items */}
              <div>
                <h3 className="font-medium mb-4">Order Items</h3>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="h-20 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.size} / {item.color} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-4">Shipping Address</h3>
                  <div className="text-sm">
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.address}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="mt-2">{order.shippingAddress.phoneNumber}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-4">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{formatPrice(order.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{formatPrice(order.tax)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        Payment method: {order.paymentMethod === 'phonepe' ? 'PhonePe' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.print()}>
                Print Receipt
              </Button>
              
              <Button onClick={() => navigate("/shop")}>
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default OrderConfirmation;