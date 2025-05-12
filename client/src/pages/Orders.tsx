import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Calendar, Filter, ArrowDownAZ, 
  SlidersHorizontal, Eye, Download, Package, 
  ShoppingBag, CheckCircle2, XCircle, Clock
} from "lucide-react";

// Order status types
type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

// Order mock data interface
interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  color: string;
  size: string;
  image: string;
}

interface Order {
  id: number;
  orderId: string; // user-friendly order ID (e.g., LF-1234)
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingNumber?: string;
  paymentMethod: string;
}

// Mock data for demonstration purposes
const mockOrders: Order[] = [
  {
    id: 1,
    orderId: "LF-1001",
    date: "2025-05-10T10:30:00",
    status: "delivered",
    total: 1499,
    items: [
      {
        id: 1,
        productId: 1,
        name: "Abstract Design Tee",
        price: 999,
        quantity: 1,
        color: "Black",
        size: "M",
        image: "/assets/products/abstract-tee.jpg"
      },
      {
        id: 2,
        productId: 3,
        name: "Urban Graphic Tee",
        price: 500,
        quantity: 1,
        color: "White",
        size: "L",
        image: "/assets/products/urban-tee.jpg"
      }
    ],
    address: {
      line1: "123 Fashion St",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "India"
    },
    trackingNumber: "IND123456789",
    paymentMethod: "Credit Card"
  },
  {
    id: 2,
    orderId: "LF-1002",
    date: "2025-05-05T14:45:00",
    status: "processing",
    total: 1999,
    items: [
      {
        id: 3,
        productId: 4,
        name: "Statement Logo Tee",
        price: 1999,
        quantity: 1,
        color: "Gray",
        size: "XL",
        image: "/assets/products/logo-tee.jpg"
      }
    ],
    address: {
      line1: "456 Trendy Ave",
      line2: "Apartment 789",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400001",
      country: "India"
    },
    paymentMethod: "UPI"
  },
  {
    id: 3,
    orderId: "LF-1003",
    date: "2025-04-20T09:15:00",
    status: "shipped",
    total: 2998,
    items: [
      {
        id: 4,
        productId: 2,
        name: "Minimal Pattern Tee",
        price: 799,
        quantity: 2,
        color: "Blue",
        size: "S",
        image: "/assets/products/minimal-tee.jpg"
      },
      {
        id: 5,
        productId: 5,
        name: "Artistic Print Tee",
        price: 1400,
        quantity: 1,
        color: "Black",
        size: "M",
        image: "/assets/products/artistic-tee.jpg"
      }
    ],
    address: {
      line1: "789 Style Blvd",
      city: "Bangalore",
      state: "Karnataka",
      postalCode: "560001",
      country: "India"
    },
    trackingNumber: "IND987654321",
    paymentMethod: "Net Banking"
  },
  {
    id: 4,
    orderId: "LF-1004",
    date: "2025-04-15T16:20:00",
    status: "cancelled",
    total: 1599,
    items: [
      {
        id: 6,
        productId: 6,
        name: "Vintage Washed Tee",
        price: 1599,
        quantity: 1,
        color: "Maroon",
        size: "L",
        image: "/assets/products/vintage-tee.jpg"
      }
    ],
    address: {
      line1: "321 Fashion Lane",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      country: "India"
    },
    paymentMethod: "Debit Card"
  },
  {
    id: 5,
    orderId: "LF-1005",
    date: "2025-04-01T11:10:00",
    status: "delivered",
    total: 4497,
    items: [
      {
        id: 7,
        productId: 1,
        name: "Abstract Design Tee",
        price: 999,
        quantity: 3,
        color: "Black",
        size: "M",
        image: "/assets/products/abstract-tee.jpg"
      },
      {
        id: 8,
        productId: 4,
        name: "Statement Logo Tee",
        price: 1500,
        quantity: 1,
        color: "White",
        size: "M",
        image: "/assets/products/logo-tee.jpg"
      }
    ],
    address: {
      line1: "654 Trend Street",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500001",
      country: "India"
    },
    trackingNumber: "IND543216789",
    paymentMethod: "PhonePe"
  }
];

// Status badge component
const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const statusConfig = {
    processing: { 
      color: "bg-blue-100 text-blue-800", 
      icon: <Clock className="h-3.5 w-3.5 mr-1" />
    },
    shipped: { 
      color: "bg-amber-100 text-amber-800", 
      icon: <Package className="h-3.5 w-3.5 mr-1" />
    },
    delivered: { 
      color: "bg-green-100 text-green-800", 
      icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
    },
    cancelled: { 
      color: "bg-red-100 text-red-800", 
      icon: <XCircle className="h-3.5 w-3.5 mr-1" />
    }
  };

  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={`${config.color} border-0 flex items-center`}>
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const Orders = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "priceHigh" | "priceLow">("newest");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  
  // Format price to rupees
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2).replace(/\.00$/, '')}`;
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };
  
  // Toggle order details view
  const toggleOrderDetails = (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);
  
  // Apply filters and search
  useEffect(() => {
    let result = [...mockOrders];
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderId.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "priceHigh":
        result.sort((a, b) => b.total - a.total);
        break;
      case "priceLow":
        result.sort((a, b) => a.total - b.total);
        break;
    }
    
    setFilteredOrders(result);
  }, [statusFilter, searchQuery, sortOrder]);
  
  return (
    <>
      <Helmet>
        <title>Order History - Loudfits</title>
        <meta 
          name="description" 
          content="View and track your Loudfits orders, download invoices, and check order status."
        />
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Orders</h1>
            <p className="text-gray-500 mt-1">View and track your order history</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/account")}
            className="self-start"
          >
            Back to Account
          </Button>
        </div>
        
        {currentUser ? (
          <>
            {/* Search and filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by order ID or product name"
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <span className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter Status" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger className="w-full md:w-44">
                        <span className="flex items-center">
                          <ArrowDownAZ className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Sort Orders" />
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="priceHigh">Price (High to Low)</SelectItem>
                        <SelectItem value="priceLow">Price (Low to High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Order History */}
            {filteredOrders.length > 0 ? (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="py-4 px-5 bg-gray-50">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                            <CardTitle className="text-lg">Order #{order.orderId}</CardTitle>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <CardDescription className="flex flex-wrap items-center gap-x-2">
                            <span className="flex items-center text-gray-600">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {formatDate(order.date)}
                            </span>
                            <span className="hidden md:inline text-gray-400">•</span>
                            <span className="text-gray-600 font-medium">
                              {formatPrice(order.total)}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9"
                            onClick={() => toggleOrderDetails(order.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {expandedOrder === order.id ? "Hide Details" : "View Details"}
                          </Button>
                          
                          {order.status !== "cancelled" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9"
                              onClick={() => {
                                alert("Invoice download functionality will be implemented");
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {/* Order summary (always visible) */}
                    <CardContent className="pb-0 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          {order.items.map(item => item.name).join(", ")}
                        </span>
                      </div>
                    </CardContent>
                    
                    {/* Expanded details */}
                    {expandedOrder === order.id && (
                      <>
                        <Separator className="my-4" />
                        <CardContent>
                          <div className="space-y-6">
                            {/* Order items */}
                            <div>
                              <h3 className="font-semibold mb-3 flex items-center text-gray-700">
                                <Package className="h-4 w-4 mr-2" />
                                Order Items
                              </h3>
                              <div className="grid gap-4">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-gray-100">
                                    <div className="bg-gray-100 rounded-md w-20 h-20 flex items-center justify-center">
                                      {/* Placeholder for product image */}
                                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <div className="flex-grow">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <div className="text-sm text-gray-500 mt-1 space-y-1">
                                        <p>Size: {item.size} • Color: {item.color}</p>
                                        <p>Quantity: {item.quantity} × {formatPrice(item.price)}</p>
                                      </div>
                                    </div>
                                    <div className="font-medium">
                                      {formatPrice(item.price * item.quantity)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Order details in two columns */}
                            <div className="grid md:grid-cols-2 gap-8">
                              {/* Shipping address */}
                              <div>
                                <h3 className="font-semibold mb-2">Shipping Address</h3>
                                <div className="text-gray-600">
                                  <p>{order.address.line1}</p>
                                  {order.address.line2 && <p>{order.address.line2}</p>}
                                  <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                                  <p>{order.address.country}</p>
                                </div>
                              </div>
                              
                              {/* Order information */}
                              <div>
                                <h3 className="font-semibold mb-2">Order Information</h3>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Payment Method</span>
                                    <span className="font-medium">{order.paymentMethod}</span>
                                  </div>
                                  
                                  {order.trackingNumber && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Tracking Number</span>
                                      <span className="font-medium">{order.trackingNumber}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatPrice(order.total - 40)}</span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>{formatPrice(40)}</span>
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div className="flex justify-between font-medium text-base pt-1">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    )}
                    
                    <CardFooter className="flex justify-end py-3 bg-gray-50">
                      {/* Shipping and tracking info for non-cancelled orders */}
                      {order.status !== "cancelled" && order.status !== "processing" && (
                        <div className="text-sm flex items-center">
                          <span className="font-medium mr-1">Shipping Status:</span>
                          <OrderStatusBadge status={order.status} />
                          
                          {order.trackingNumber && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="text-[#582A34] ml-2 px-0"
                              onClick={() => {
                                alert(`Track your order using number: ${order.trackingNumber}`);
                              }}
                            >
                              Track Order
                            </Button>
                          )}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No orders found</h3>
                  {searchQuery || statusFilter !== "all" ? (
                    <p className="text-gray-500 text-center max-w-md">
                      No orders match your current search or filter criteria. Try adjusting your filters or search term.
                    </p>
                  ) : (
                    <p className="text-gray-500 text-center max-w-md">
                      You haven't placed any orders yet. Start shopping to see your orders here.
                    </p>
                  )}
                  <Button 
                    className="mt-6"
                    onClick={() => navigate("/shop")}
                  >
                    Start Shopping
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Orders;