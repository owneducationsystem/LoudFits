import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Package, MapPin, CheckCircle, Truck, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormValues = z.infer<typeof formSchema>;

// Dummy tracking data (would come from the backend in a real application)
const dummyOrderStatus = {
  orderNumber: "LD123456789",
  status: "in-transit",
  estimatedDelivery: "May 15, 2025",
  trackingNumber: "IND87654321",
  courierName: "ExpressShip",
  trackingUrl: "#",
  steps: [
    { title: "Order Placed", date: "May 8, 2025", completed: true },
    { title: "Payment Confirmed", date: "May 8, 2025", completed: true },
    { title: "Processing", date: "May 9, 2025", completed: true },
    { title: "Shipped", date: "May 10, 2025", completed: true },
    { title: "Out for Delivery", date: "May 14, 2025", completed: false },
    { title: "Delivered", date: "", completed: false },
  ],
  address: {
    name: "Demo User",
    street: "123 Customer Street, Neighborhood",
    city: "Mumbai, Maharashtra",
    postalCode: "400001",
    country: "India",
  },
  items: [
    { id: 1, name: "Abstract Design Tee", color: "Black", size: "M", quantity: 1, price: "₹899" },
    { id: 2, name: "Geometric Print Tee", color: "White", size: "L", quantity: 1, price: "₹799" },
  ],
};

const TrackOrder = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingResult, setTrackingResult] = useState<typeof dummyOrderStatus | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: "",
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call to get tracking information
    setTimeout(() => {
      setIsSubmitting(false);
      setTrackingResult(dummyOrderStatus);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Package className="mr-2 h-6 w-6" />
          Track Your Order
        </h1>
        
        {!trackingResult ? (
          <>
            <p className="text-gray-600 mb-8">
              Enter your order number and email address to track your order status and shipment details.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., LD123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Email used for the order" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Tracking...
                      </span>
                    ) : (
                      "Track Order"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Having trouble?</h3>
              <p className="text-gray-600">
                If you need help tracking your order, please contact our customer support at{" "}
                <a href="mailto:support@loudfits.com" className="text-[#582A34] font-medium">support@loudfits.com</a>
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Order #{trackingResult.orderNumber}</h2>
                  <p className="text-gray-600 mb-4">Estimated Delivery: {trackingResult.estimatedDelivery}</p>
                </div>
                
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <div className={`h-3 w-3 rounded-full ${
                    trackingResult.status === "delivered" ? "bg-green-500" :
                    trackingResult.status === "in-transit" ? "bg-blue-500" :
                    trackingResult.status === "processing" ? "bg-yellow-500" : "bg-gray-500"
                  }`}></div>
                  <span className="font-medium capitalize">{trackingResult.status.replace("-", " ")}</span>
                </div>
              </div>
              
              <div className="mt-4 text-sm">
                <p>Tracking Number: {trackingResult.trackingNumber}</p>
                <p>Carrier: {trackingResult.courierName}</p>
                <Button variant="link" className="p-0 h-auto mt-1 text-[#582A34]" asChild>
                  <a href={trackingResult.trackingUrl} target="_blank" rel="noopener noreferrer">
                    Track on carrier website
                  </a>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Tracking Timeline</h3>
              <div className="relative">
                {trackingResult.steps.map((step, index) => (
                  <div key={index} className="flex mb-6 last:mb-0">
                    <div className="mr-4 relative">
                      <div className={`h-6 w-6 rounded-full ${
                        step.completed ? "bg-[#582A34] text-white" : "bg-gray-200 text-gray-500"
                      } flex items-center justify-center`}>
                        {step.completed ? <CheckCircle className="h-5 w-5" /> : index + 1}
                      </div>
                      {index < trackingResult.steps.length - 1 && (
                        <div className={`absolute top-6 left-1/2 w-0.5 h-[calc(100%-12px)] transform -translate-x-1/2 ${
                          step.completed ? "bg-[#582A34]" : "bg-gray-200"
                        }`}></div>
                      )}
                    </div>
                    <div className={`flex-grow pb-4 ${step.completed ? "" : "opacity-50"}`}>
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.date || "Pending"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Shipping Address
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{trackingResult.address.name}</p>
                  <p className="text-gray-600">{trackingResult.address.street}</p>
                  <p className="text-gray-600">{trackingResult.address.city}</p>
                  <p className="text-gray-600">{trackingResult.address.postalCode}</p>
                  <p className="text-gray-600">{trackingResult.address.country}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Order Summary
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {trackingResult.items.map((item, index) => (
                    <div key={index} className={`flex justify-between ${index !== 0 ? "mt-2 pt-2 border-t" : ""}`}>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Size: {item.size}, Color: {item.color}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setTrackingResult(null)}>
                Track another order
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;