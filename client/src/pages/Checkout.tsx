import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Smartphone, Truck, DollarSign, Mail, User, MapPin, Building, Home } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

// Shipping address type
interface ShippingAddress {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const Checkout = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, clearCart, totalItems } = useCartContext();
  const { currentUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("phonepe");
  const [shippingMethod, setShippingMethod] = useState<string>("standard");
  const [shippingCost, setShippingCost] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<string>("shipping");
  
  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: currentUser?.displayName || "",
    email: currentUser?.email || "",
    phoneNumber: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      });
    }
  }, [cartItems, navigate, toast]);
  
  // Calculate order summary
  const subtotal = cartItems.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0
  );
  
  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  
  const totalAmount = subtotal + taxAmount + shippingCost;
  
  // Handle shipping method change and update shipping cost
  const handleShippingMethodChange = (value: string) => {
    setShippingMethod(value);
    if (value === "express") {
      setShippingCost(120);
    } else if (value === "standard") {
      setShippingCost(50);
    } else {
      setShippingCost(0);
    }
  };
  
  // Handle shipping form change
  const handleShippingAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  // Validate shipping form
  const validateShippingForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    const requiredFields: (keyof ShippingAddress)[] = [
      "fullName", "email", "phoneNumber", "address", "city", "state", "postalCode", "country"
    ];
    
    requiredFields.forEach(field => {
      if (!shippingAddress[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
      }
    });
    
    // Email validation
    if (shippingAddress.email && !/\S+@\S+\.\S+/.test(shippingAddress.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone number validation (basic)
    if (shippingAddress.phoneNumber && !/^\d{10}$/.test(shippingAddress.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }
    
    // Postal code validation (basic)
    if (shippingAddress.postalCode && !/^\d{6}$/.test(shippingAddress.postalCode)) {
      newErrors.postalCode = "Please enter a valid 6-digit postal code";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle proceed to payment button
  const handleProceedToPayment = () => {
    if (validateShippingForm()) {
      setActiveTab("payment");
    } else {
      toast({
        title: "Incomplete shipping information",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
    }
  };
  
  // Process the checkout
  const handleCheckout = async () => {
    if (!validateShippingForm()) {
      setActiveTab("shipping");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format order data for API
      const orderData = {
        cartItems,
        amount: {
          subtotal,
          tax: taxAmount,
          shipping: shippingCost,
          discount: 0,
          total: totalAmount
        },
        shippingAddress,
        shippingMethod,
        paymentMethod
      };
      
      // Call the payment initiation API
      const response = await apiRequest("POST", "/api/payment/initiate", orderData);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Payment initiation failed");
      }
      
      // For PhonePe, redirect to payment page
      if (paymentMethod === "phonepe" && data.paymentUrl) {
        // Clear the cart after successful order creation
        clearCart();
        
        // Store order info in session storage for after payment
        sessionStorage.setItem("order_id", data.order.id);
        sessionStorage.setItem("order_number", data.order.orderNumber);
        
        // Redirect to payment gateway
        window.location.href = data.paymentUrl;
      } else {
        // For COD or other payment methods
        clearCart();
        navigate(`/order-confirmation/${data.order.id}`);
      }
      
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to process your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Checkout | Loudfits</title>
        <meta name="description" content="Secure checkout for your stylish Loudfits products" />
      </Helmet>
      <Header />
      <main className="container mx-auto py-8 px-4 md:px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>
                  Please provide your shipping and payment details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                    <TabsTrigger value="payment">Payment</TabsTrigger>
                  </TabsList>
                  
                  {/* Shipping Tab */}
                  <TabsContent value="shipping" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="John Doe"
                          className="pl-10"
                          value={shippingAddress.fullName}
                          onChange={handleShippingAddressChange}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            className="pl-10"
                            value={shippingAddress.email}
                            onChange={handleShippingAddressChange}
                          />
                        </div>
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            placeholder="9876543210"
                            className="pl-10"
                            value={shippingAddress.phoneNumber}
                            onChange={handleShippingAddressChange}
                          />
                        </div>
                        {errors.phoneNumber && (
                          <p className="text-sm text-destructive">{errors.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          name="address"
                          placeholder="123 Main St"
                          className="pl-10"
                          value={shippingAddress.address}
                          onChange={handleShippingAddressChange}
                        />
                      </div>
                      {errors.address && (
                        <p className="text-sm text-destructive">{errors.address}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="addressLine2"
                          name="addressLine2"
                          placeholder="Apartment, Suite, etc."
                          className="pl-10"
                          value={shippingAddress.addressLine2}
                          onChange={handleShippingAddressChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="city"
                            name="city"
                            placeholder="Mumbai"
                            className="pl-10"
                            value={shippingAddress.city}
                            onChange={handleShippingAddressChange}
                          />
                        </div>
                        {errors.city && (
                          <p className="text-sm text-destructive">{errors.city}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          placeholder="Maharashtra"
                          value={shippingAddress.state}
                          onChange={handleShippingAddressChange}
                        />
                        {errors.state && (
                          <p className="text-sm text-destructive">{errors.state}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          placeholder="400001"
                          value={shippingAddress.postalCode}
                          onChange={handleShippingAddressChange}
                        />
                        {errors.postalCode && (
                          <p className="text-sm text-destructive">{errors.postalCode}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          placeholder="India"
                          value={shippingAddress.country}
                          onChange={handleShippingAddressChange}
                          disabled
                        />
                        {errors.country && (
                          <p className="text-sm text-destructive">{errors.country}</p>
                        )}
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Shipping Method</h3>
                      <RadioGroup
                        value={shippingMethod}
                        onValueChange={handleShippingMethodChange}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="standard" />
                            <Label htmlFor="standard" className="cursor-pointer">Standard Shipping (3-5 business days)</Label>
                          </div>
                          <div className="font-medium">₹50.00</div>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="express" id="express" />
                            <Label htmlFor="express" className="cursor-pointer">Express Shipping (1-2 business days)</Label>
                          </div>
                          <div className="font-medium">₹120.00</div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button onClick={handleProceedToPayment} size="lg">
                        Proceed to Payment
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Payment Tab */}
                  <TabsContent value="payment" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payment Method</h3>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="phonepe" id="phonepe" />
                            <Label htmlFor="phonepe" className="cursor-pointer flex items-center">
                              <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
                              PhonePe
                            </Label>
                          </div>
                          <div className="text-sm text-muted-foreground">UPI, Credit/Debit Cards, Wallets</div>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cod" id="cod" />
                            <Label htmlFor="cod" className="cursor-pointer flex items-center">
                              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                              Cash on Delivery
                            </Label>
                          </div>
                          <div className="text-sm text-muted-foreground">Pay when you receive</div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("shipping")}
                      >
                        Back to Shipping
                      </Button>
                      
                      <Button 
                        onClick={handleCheckout}
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {paymentMethod === "phonepe" ? "Pay Now" : "Place Order"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product List */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex justify-between">
                      <div className="flex items-start gap-2">
                        <div className="h-16 w-12 rounded overflow-hidden">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.size} / {item.color} × {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatPrice(Number(item.product.price) * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18% GST)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Total */}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;