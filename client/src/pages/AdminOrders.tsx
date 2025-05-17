import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  MoreHorizontal, 
  ArrowUpDown, 
  Calendar, 
  Clock, 
  MapPin,
  Truck,
  CreditCard,
  User,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  size: string;
  color: string;
  customization?: any;
  product?: {
    id: number;
    name: string;
    images: string[];
    category: string;
  }
}

interface CustomerDetails {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address: {
    street?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  tracking?: {
    number?: string;
    url?: string;
    estimatedDelivery?: string;
  };
  customer?: CustomerDetails;
  items?: OrderItem[];
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "processing":
      return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "shipped":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "delivered":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    case "cancelled":
      return "bg-red-100 text-red-700 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700 hover:bg-green-100";
    case "pending":
      return "bg-amber-100 text-amber-700 hover:bg-amber-100";
    case "failed":
      return "bg-red-100 text-red-700 hover:bg-red-100";
    case "refunded":
      return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/orders", page, limit, search, statusFilter],
    queryFn: async () => {
      try {
        // Using the API request function with the proper signature
        let url = `/api/admin/orders?limit=${limit}&offset=${(page - 1) * limit}`;
        if (search) url += `&search=${search}`;
        if (statusFilter !== "all") url += `&status=${statusFilter}`;
        
        const response = await apiRequest("GET", url);
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        return { orders: [], total: 0 };
      }
    },
  });

  useEffect(() => {
    if (data) {
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  const handleViewOrder = (order: Order) => {
    // If order has no items or customer info and we have mock orders, try to find a matching mock order
    if ((!order.items || !order.customer || !order.shippingAddress.phone) && mockOrders.length > 0) {
      const mockOrder = mockOrders.find(mo => mo.id === order.id) || 
                        mockOrders.find(mo => mo.orderNumber === order.orderNumber);
      
      // If we found a matching mock order, use its details to supplement the real order
      if (mockOrder) {
        const supplementedOrder = {
          ...order,
          items: order.items || mockOrder.items,
          customer: order.customer || mockOrder.customer,
          shippingAddress: {
            ...order.shippingAddress,
            phone: order.shippingAddress.phone || mockOrder.shippingAddress.phone
          }
        };
        setSelectedOrder(supplementedOrder);
      } else {
        setSelectedOrder(order);
      }
    } else {
      setSelectedOrder(order);
    }
    
    setIsViewDialogOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      await apiRequest(
        "PATCH", 
        `/api/admin/orders/${selectedOrder.id}`, 
        { status: newStatus }
      );
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? { ...order, status: newStatus } : order
      ));
      
      // Invalidate the query cache to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/orders"]
      });
      
      // Show success toast notification
      toast({
        title: "Order Status Updated",
        description: `Order #${selectedOrder.orderNumber} status changed to ${newStatus}`,
        variant: "default"
      });
      
      setIsUpdateStatusDialogOpen(false);
    } catch (error) {
      console.error("Failed to update order status:", error);
      
      // Show error toast notification
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalOrders / limit);

  // Sample mock data for demonstration
  const mockOrders: Order[] = [
    {
      id: 1,
      orderNumber: "LF-1001",
      userId: 2,
      status: "processing",
      paymentStatus: "paid",
      paymentMethod: "credit_card",
      total: "3599.00",
      createdAt: "2023-05-10T14:30:00Z",
      updatedAt: "2023-05-10T14:30:00Z",
      shippingAddress: {
        fullName: "Jane Smith",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
        phone: "+91 9876543210"
      },
      customer: {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+91 9876543210",
        address: {
          street: "123 Main Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India"
        }
      },
      items: [
        {
          id: 101,
          orderId: 1,
          productId: 5,
          quantity: 2,
          price: "1299.50",
          size: "M",
          color: "Black",
          product: {
            id: 5,
            name: "Premium Cotton T-Shirt",
            images: ["https://example.com/images/tshirt1.jpg"],
            category: "T-Shirts"
          }
        },
        {
          id: 102,
          orderId: 1,
          productId: 8,
          quantity: 1,
          price: "999.00",
          size: "L",
          color: "Blue",
          product: {
            id: 8,
            name: "Graphic Print Hoodie",
            images: ["https://example.com/images/hoodie1.jpg"],
            category: "Hoodies"
          }
        }
      ]
    },
    {
      id: 2,
      orderNumber: "LF-1002",
      userId: 3,
      status: "shipped",
      paymentStatus: "paid",
      paymentMethod: "paypal",
      total: "1499.00",
      createdAt: "2023-05-09T10:15:00Z",
      updatedAt: "2023-05-10T09:22:00Z",
      shippingAddress: {
        fullName: "Mike Johnson",
        address: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        postalCode: "110001",
        country: "India",
        phone: "+91 8765432109"
      },
      tracking: {
        number: "SHIP12345678",
        url: "https://track.shipper.com/SHIP12345678",
        estimatedDelivery: "2023-05-15T00:00:00Z"
      },
      customer: {
        id: 3,
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        phone: "+91 8765432109",
        address: {
          street: "456 Park Avenue",
          city: "Delhi",
          state: "Delhi",
          postalCode: "110001",
          country: "India"
        }
      },
      items: [
        {
          id: 201,
          orderId: 2,
          productId: 12,
          quantity: 1,
          price: "1499.00",
          size: "XL",
          color: "Red",
          product: {
            id: 12,
            name: "Limited Edition Print T-Shirt",
            images: ["https://example.com/images/tshirt-limited.jpg"],
            category: "T-Shirts"
          }
        }
      ]
    },
    {
      id: 3,
      orderNumber: "LF-1003",
      userId: 4,
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: "credit_card",
      total: "2199.00",
      createdAt: "2023-05-05T16:45:00Z",
      updatedAt: "2023-05-08T11:30:00Z",
      shippingAddress: {
        fullName: "Sara Williams",
        address: "789 Lake View",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        phone: "+91 7654321098"
      },
      tracking: {
        number: "SHIP87654321",
        url: "https://track.shipper.com/SHIP87654321",
        estimatedDelivery: "2023-05-08T00:00:00Z"
      },
      customer: {
        id: 4,
        name: "Sara Williams",
        email: "sara.williams@example.com",
        phone: "+91 7654321098",
        address: {
          street: "789 Lake View",
          city: "Bangalore",
          state: "Karnataka",
          postalCode: "560001",
          country: "India"
        }
      },
      items: [
        {
          id: 301,
          orderId: 3,
          productId: 3,
          quantity: 1,
          price: "1299.00",
          size: "S",
          color: "White",
          product: {
            id: 3,
            name: "Casual Cotton T-Shirt",
            images: ["https://example.com/images/cotton-tshirt.jpg"],
            category: "T-Shirts"
          }
        },
        {
          id: 302,
          orderId: 3,
          productId: 9,
          quantity: 1,
          price: "899.00",
          size: "M",
          color: "Gray",
          customization: {
            text: "Custom Text",
            position: "center",
            fontSize: "medium"
          },
          product: {
            id: 9,
            name: "Customizable T-Shirt",
            images: ["https://example.com/images/custom-tshirt.jpg"],
            category: "Custom"
          }
        }
      ]
    },
    {
      id: 4,
      orderNumber: "LF-1004",
      userId: 5,
      status: "cancelled",
      paymentStatus: "refunded",
      paymentMethod: "upi",
      total: "899.00",
      createdAt: "2023-05-04T09:20:00Z",
      updatedAt: "2023-05-04T14:10:00Z",
      shippingAddress: {
        fullName: "Robert Brown",
        address: "101 Hill Road",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        country: "India",
        phone: "+91 6543210987"
      },
      customer: {
        id: 5,
        name: "Robert Brown",
        email: "robert.brown@example.com",
        phone: "+91 6543210987",
        address: {
          street: "101 Hill Road",
          city: "Chennai",
          state: "Tamil Nadu",
          postalCode: "600001",
          country: "India"
        }
      },
      items: [
        {
          id: 401,
          orderId: 4,
          productId: 7,
          quantity: 1,
          price: "899.00",
          size: "L",
          color: "Black",
          product: {
            id: 7,
            name: "Basic T-Shirt",
            images: ["https://example.com/images/basic-tshirt.jpg"],
            category: "T-Shirts"
          }
        }
      ]
    },
    {
      id: 5,
      orderNumber: "LF-1005",
      userId: 1,
      status: "processing",
      paymentStatus: "pending",
      paymentMethod: "cash_on_delivery",
      total: "1299.00",
      createdAt: "2023-05-11T11:00:00Z",
      updatedAt: "2023-05-11T11:00:00Z",
      shippingAddress: {
        fullName: "John Doe",
        address: "222 Beach Road",
        city: "Kolkata",
        state: "West Bengal",
        postalCode: "700001",
        country: "India",
        phone: "+91 5432109876"
      },
      customer: {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+91 5432109876",
        address: {
          street: "222 Beach Road",
          city: "Kolkata",
          state: "West Bengal",
          postalCode: "700001",
          country: "India"
        }
      },
      items: [
        {
          id: 501,
          orderId: 5,
          productId: 4,
          quantity: 1,
          price: "1299.00",
          size: "M",
          color: "Green",
          product: {
            id: 4,
            name: "Premium Designer T-Shirt",
            images: ["https://example.com/images/designer-tshirt.jpg"],
            category: "T-Shirts"
          }
        }
      ]
    }
  ];

  // Temporarily always show mock data to help with testing
  // const displayOrders = orders.length > 0 ? orders : mockOrders;
  const displayOrders = mockOrders;

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex w-full md:w-96 space-x-2">
            <Input
              type="search"
              placeholder="Search order number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <Button type="submit" variant="outline" size="icon">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-md shadow">
          <Table>
            <TableCaption>List of all orders</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center">
                    Order
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
                      <span className="ml-2">Loading orders...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500">No orders found</p>
                    <div className="flex justify-center mt-2 gap-2">
                      <Button variant="link" onClick={() => setSearch("")}>
                        Clear search
                      </Button>
                      <Button variant="link" onClick={() => setStatusFilter("all")}>
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">#{order.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{order.shippingAddress.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusColor(order.status)}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(order.paymentStatus)}
                      >
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(parseFloat(order.total))}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order)}>
                            Update status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => alert("This would cancel the order in a real app")}
                          >
                            Cancel order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNumber);
                        }}
                        isActive={pageNumber === page}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about this order.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    Order {selectedOrder.orderNumber}
                    <span className="text-sm font-normal text-gray-500 ml-2">#{selectedOrder.id}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(selectedOrder.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>
                      {new Date(selectedOrder.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedOrder.status)}
                  >
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getPaymentStatusColor(selectedOrder.paymentStatus)}
                  >
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium">
                      {selectedOrder.customer?.name || selectedOrder.shippingAddress.fullName}
                    </p>
                    {selectedOrder.customer?.email && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Email:</span> {selectedOrder.customer.email}
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">User ID:</span> {selectedOrder.userId}
                    </p>
                    {(selectedOrder.customer?.phone || selectedOrder.shippingAddress.phone) && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Phone:</span> {selectedOrder.customer?.phone || selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>

                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Shipping Address
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-1">
                      <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                      <p>{selectedOrder.shippingAddress.address}</p>
                      {selectedOrder.customer?.address?.addressLine2 && (
                        <p>{selectedOrder.customer.address.addressLine2}</p>
                      )}
                      <p>
                        {selectedOrder.shippingAddress.city},{" "}
                        {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}
                      </p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.phone && (
                        <p className="mt-1 text-gray-700">
                          <span className="font-medium">Phone:</span> {selectedOrder.shippingAddress.phone}
                        </p>
                      )}
                    </div>

                    {/* If we have stored customer address that's different from shipping address */}
                    {selectedOrder.customer?.address?.street &&
                     selectedOrder.customer.address.street !== selectedOrder.shippingAddress.address && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium mb-1">Billing/Account Address:</p>
                        <p>{selectedOrder.customer.address.street}</p>
                        {selectedOrder.customer.address.addressLine2 && (
                          <p>{selectedOrder.customer.address.addressLine2}</p>
                        )}
                        <p>
                          {selectedOrder.customer.address.city},{" "}
                          {selectedOrder.customer.address.state} {selectedOrder.customer.address.postalCode}
                        </p>
                        <p>{selectedOrder.customer.address.country}</p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.tracking && (
                    <>
                      <h4 className="font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Tracking Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        {selectedOrder.tracking.number && (
                          <p>
                            <span className="font-medium">Tracking Number:</span>{" "}
                            {selectedOrder.tracking.url ? (
                              <a
                                href={selectedOrder.tracking.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {selectedOrder.tracking.number}
                              </a>
                            ) : (
                              selectedOrder.tracking.number
                            )}
                          </p>
                        )}
                        {selectedOrder.tracking.estimatedDelivery && (
                          <p>
                            <span className="font-medium">Estimated Delivery:</span>{" "}
                            {new Date(selectedOrder.tracking.estimatedDelivery).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedOrder.paymentMethod
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(selectedOrder.paymentStatus)}
                      >
                        {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                      </Badge>
                    </p>
                  </div>

                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order Summary
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(parseFloat(selectedOrder.total) * 0.85)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Tax</span>
                      <span>{formatPrice(parseFloat(selectedOrder.total) * 0.10)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shipping</span>
                      <span>{formatPrice(parseFloat(selectedOrder.total) * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2 mt-2">
                      <span>Total</span>
                      <span>{formatPrice(parseFloat(selectedOrder.total))}</span>
                    </div>
                  </div>

                  {/* Product Items Section */}
                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <>
                      <h4 className="font-medium flex items-center gap-2 mt-4">
                        <Package className="h-4 w-4" />
                        Product Details
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="space-y-4">
                          {selectedOrder.items.map((item) => (
                            <div 
                              key={`${item.productId}-${item.size}-${item.color}`} 
                              className="flex gap-3 pb-3 border-b border-gray-200 last:border-0 last:pb-0"
                            >
                              {/* Product Image */}
                              <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                                {item.product?.images && item.product.images.length > 0 ? (
                                  <img 
                                    src={item.product.images[0]} 
                                    alt={item.product?.name || 'Product'} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Package className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <div>
                                    <h5 className="font-medium flex items-center gap-2">
                                      {item.product?.name || `Product #${item.productId}`}
                                      <span className="text-xs py-0.5 px-1.5 bg-gray-200 rounded-md text-gray-700">
                                        ID: {item.productId}
                                      </span>
                                    </h5>
                                    <div className="flex flex-wrap gap-2 text-xs mt-2">
                                      <span className="py-0.5 px-2 bg-blue-100 rounded text-blue-700 font-medium">
                                        Size: {item.size}
                                      </span>
                                      <span className="py-0.5 px-2 bg-purple-100 rounded text-purple-700 font-medium">
                                        Color: {item.color}
                                      </span>
                                      <span className="py-0.5 px-2 bg-green-100 rounded text-green-700 font-medium">
                                        Qty: {item.quantity}
                                      </span>
                                      {item.product?.category && (
                                        <span className="py-0.5 px-2 bg-amber-100 rounded text-amber-700 font-medium">
                                          {item.product.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      {formatPrice(parseFloat(item.price))}
                                      <span className="text-xs text-gray-500 ml-1">
                                        / each
                                      </span>
                                    </div>
                                    <div className="text-sm font-medium mt-2">
                                      {formatPrice(parseFloat(item.price) * item.quantity)}
                                      <span className="text-xs text-gray-500 ml-1">
                                        total
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Show customization if available */}
                                {item.customization && (
                                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                                    <p className="font-medium text-gray-700">Customization:</p>
                                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                      {JSON.stringify(item.customization, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            {selectedOrder && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleUpdateStatus(selectedOrder);
              }}>
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;