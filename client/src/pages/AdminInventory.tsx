import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Package, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  CheckCircle,
  XCircle,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AdminNav from "@/components/admin/AdminNav";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  images: string[];
  sku: string;
  inStock: boolean;
}

interface InventoryItem {
  id: number;
  productId: number;
  size: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  lastRestocked: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InventoryWithProduct extends InventoryItem {
  product?: Product;
}

interface InventoryLog {
  id: number;
  inventoryId: number;
  userId: number | null;
  action: 'add' | 'subtract' | 'reserve' | 'release';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

const inventoryFormSchema = z.object({
  productId: z.number({
    required_error: "Product is required",
  }),
  size: z.string().min(1, { message: "Size is required" }),
  quantity: z.number().min(0, { message: "Quantity must be 0 or greater" }),
  lowStockThreshold: z.number().min(1, { message: "Threshold must be at least 1" }),
});

const inventoryUpdateSchema = z.object({
  quantity: z.number().min(0, { message: "Quantity must be 0 or greater" }),
  lowStockThreshold: z.number().min(1, { message: "Threshold must be at least 1" }),
});

const reserveReleaseSchema = z.object({
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  reason: z.string().min(3, { message: "Reason is required" }),
  referenceId: z.string().optional(),
});

export default function AdminInventory() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInventory, setSelectedInventory] = useState<InventoryWithProduct | null>(null);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSize, setFilterSize] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("productId");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTab, setSelectedTab] = useState("all");

  // Form for adding new inventory
  const addForm = useForm<z.infer<typeof inventoryFormSchema>>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      quantity: 0,
      lowStockThreshold: 5,
    },
  });

  // Form for updating inventory
  const updateForm = useForm<z.infer<typeof inventoryUpdateSchema>>({
    resolver: zodResolver(inventoryUpdateSchema),
    defaultValues: {
      quantity: 0,
      lowStockThreshold: 5,
    },
  });

  // Form for reserving inventory
  const reserveForm = useForm<z.infer<typeof reserveReleaseSchema>>({
    resolver: zodResolver(reserveReleaseSchema),
    defaultValues: {
      quantity: 1,
      reason: "",
    },
  });

  // Form for releasing inventory
  const releaseForm = useForm<z.infer<typeof reserveReleaseSchema>>({
    resolver: zodResolver(reserveReleaseSchema),
    defaultValues: {
      quantity: 1,
      reason: "",
    },
  });

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory");
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }
      
      const data = await response.json();
      
      // Also fetch product data for each inventory item
      const inventoryWithProducts = await Promise.all(
        data.map(async (item: InventoryItem) => {
          try {
            const productResponse = await fetch(`/api/products/${item.productId}`);
            if (productResponse.ok) {
              const product = await productResponse.json();
              return { ...item, product };
            }
            return item;
          } catch (error) {
            console.error("Error fetching product:", error);
            return item;
          }
        })
      );
      
      setInventory(inventoryWithProducts);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products data
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products data",
        variant: "destructive",
      });
    }
  };

  // Fetch inventory logs
  const fetchInventoryLogs = async (inventoryId: number) => {
    try {
      setLogsLoading(true);
      const response = await fetch(`/api/inventory/logs/${inventoryId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory logs");
      }
      
      const data = await response.json();
      setInventoryLogs(data);
    } catch (error) {
      console.error("Error fetching inventory logs:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory logs",
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  // Add new inventory item
  const onAddInventory = async (values: z.infer<typeof inventoryFormSchema>) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to add inventory item");
      }
      
      const newItem = await response.json();
      
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      
      // Reset form and refresh inventory
      addForm.reset();
      fetchInventory();
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  // Update inventory item
  const onUpdateInventory = async (values: z.infer<typeof inventoryUpdateSchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch(`/api/inventory/${selectedInventory.productId}/${selectedInventory.size}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update inventory item");
      }
      
      const updatedItem = await response.json();
      
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      
      // Reset form and refresh inventory
      updateForm.reset();
      setSelectedInventory(null);
      fetchInventory();
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    }
  };

  // Delete inventory item
  const deleteInventoryItem = async (productId: number, size: string) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/${size}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete inventory item");
      }
      
      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });
      
      // Refresh inventory
      fetchInventory();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  // Reserve inventory
  const onReserveInventory = async (values: z.infer<typeof reserveReleaseSchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch("/api/inventory/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedInventory.productId,
          size: selectedInventory.size,
          quantity: values.quantity,
          reason: values.reason,
          referenceId: values.referenceId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to reserve inventory");
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Reserved ${values.quantity} items successfully`,
      });
      
      // Reset form and refresh inventory
      reserveForm.reset();
      setSelectedInventory(null);
      fetchInventory();
    } catch (error) {
      console.error("Error reserving inventory:", error);
      toast({
        title: "Error",
        description: "Failed to reserve inventory",
        variant: "destructive",
      });
    }
  };

  // Release inventory
  const onReleaseInventory = async (values: z.infer<typeof reserveReleaseSchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch("/api/inventory/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedInventory.productId,
          size: selectedInventory.size,
          quantity: values.quantity,
          reason: values.reason,
          referenceId: values.referenceId || null,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to release inventory");
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Released ${values.quantity} items successfully`,
      });
      
      // Reset form and refresh inventory
      releaseForm.reset();
      setSelectedInventory(null);
      fetchInventory();
    } catch (error) {
      console.error("Error releasing inventory:", error);
      toast({
        title: "Error",
        description: "Failed to release inventory",
        variant: "destructive",
      });
    }
  };

  // View inventory logs
  const viewInventoryLogs = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    fetchInventoryLogs(item.id);
  };

  // Handle edit inventory
  const handleEditInventory = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    updateForm.reset({
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
    });
  };

  // Handle reserve inventory
  const handleReserveInventory = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    reserveForm.reset({
      quantity: 1,
      reason: "",
    });
  };

  // Handle release inventory
  const handleReleaseInventory = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    releaseForm.reset({
      quantity: 1,
      reason: "",
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate available quantity
  const getAvailableQuantity = (item: InventoryItem) => {
    return item.quantity - (item.reservedQuantity || 0);
  };

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    const availableQuantity = getAvailableQuantity(item);
    
    if (availableQuantity <= 0) {
      return { status: "out-of-stock", label: "Out of Stock", color: "bg-red-500 text-white" };
    } else if (availableQuantity <= item.lowStockThreshold) {
      return { status: "low-stock", label: "Low Stock", color: "bg-amber-500 text-white" };
    } else {
      return { status: "in-stock", label: "In Stock", color: "bg-green-500 text-white" };
    }
  };

  // Toggle sort
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter inventory based on search, size, and stock status
  const filteredInventory = inventory.filter((item) => {
    const productNameMatch = item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const sizeMatch = filterSize === "" || item.size === filterSize;
    
    let stockMatch = true;
    if (filterStock === "in-stock") {
      stockMatch = getAvailableQuantity(item) > 0;
    } else if (filterStock === "low-stock") {
      stockMatch = getAvailableQuantity(item) <= item.lowStockThreshold && getAvailableQuantity(item) > 0;
    } else if (filterStock === "out-of-stock") {
      stockMatch = getAvailableQuantity(item) <= 0;
    }
    
    return productNameMatch && sizeMatch && stockMatch;
  });

  // Filter inventory for different tabs
  const getTabInventory = () => {
    if (selectedTab === "low-stock") {
      return inventory.filter(item => {
        const availableQuantity = getAvailableQuantity(item);
        return availableQuantity <= item.lowStockThreshold && availableQuantity > 0;
      });
    } else if (selectedTab === "out-of-stock") {
      return inventory.filter(item => getAvailableQuantity(item) <= 0);
    } else {
      return filteredInventory;
    }
  };

  // Sort inventory
  const sortedInventory = [...getTabInventory()].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortField) {
      case "productId":
        aValue = a.productId;
        bValue = b.productId;
        break;
      case "productName":
        aValue = a.product?.name || "";
        bValue = b.product?.name || "";
        break;
      case "size":
        aValue = a.size;
        bValue = b.size;
        break;
      case "quantity":
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case "available":
        aValue = getAvailableQuantity(a);
        bValue = getAvailableQuantity(b);
        break;
      case "reserved":
        aValue = a.reservedQuantity || 0;
        bValue = b.reservedQuantity || 0;
        break;
      case "threshold":
        aValue = a.lowStockThreshold;
        bValue = b.lowStockThreshold;
        break;
      case "lastRestocked":
        aValue = new Date(a.lastRestocked).getTime();
        bValue = new Date(b.lastRestocked).getTime();
        break;
      default:
        aValue = a.productId;
        bValue = b.productId;
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Get unique sizes from inventory
  const uniqueSizes = Array.from(new Set(inventory.map(item => item.size))).sort();

  // Load data on component mount
  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Inventory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>
                    Add stock for a specific product and size
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(onAddInventory)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <FormControl>
                            <Input placeholder="Size (e.g. S, M, L, XL)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Alert will be triggered when available stock falls below this threshold
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Add Inventory</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={fetchInventory}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Inventory Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Stock Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventory.reduce((total, item) => total + item.quantity, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {inventory.filter(item => {
                  const available = getAvailableQuantity(item);
                  return available <= item.lowStockThreshold && available > 0;
                }).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Out of Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {inventory.filter(item => getAvailableQuantity(item) <= 0).length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b flex flex-col gap-4 md:flex-row md:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterSize} onValueChange={setFilterSize}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sizes</SelectItem>
                  {uniqueSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStock} onValueChange={setFilterStock}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Status</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="px-4 pt-2">
              <TabsList>
                <TabsTrigger value="all">All Inventory</TabsTrigger>
                <TabsTrigger value="low-stock" className="text-amber-500 font-medium">
                  Low Stock
                  <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                    {inventory.filter(item => {
                      const available = getAvailableQuantity(item);
                      return available <= item.lowStockThreshold && available > 0;
                    }).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="out-of-stock" className="text-red-500 font-medium">
                  Out of Stock
                  <Badge variant="outline" className="ml-2 bg-red-100 text-red-700 border-red-200">
                    {inventory.filter(item => getAvailableQuantity(item) <= 0).length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] cursor-pointer" onClick={() => toggleSort("productId")}>
                        ID
                        {sortField === "productId" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("productName")}>
                        Product
                        {sortField === "productName" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[80px] cursor-pointer" onClick={() => toggleSort("size")}>
                        Size
                        {sortField === "size" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => toggleSort("quantity")}>
                        Total
                        {sortField === "quantity" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => toggleSort("available")}>
                        Available
                        {sortField === "available" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => toggleSort("reserved")}>
                        Reserved
                        {sortField === "reserved" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[100px] cursor-pointer" onClick={() => toggleSort("threshold")}>
                        Threshold
                        {sortField === "threshold" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[120px] cursor-pointer" onClick={() => toggleSort("lastRestocked")}>
                        Last Restocked
                        {sortField === "lastRestocked" && (
                          <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortDirection === "desc" ? "rotate-180" : ""}`} />
                        )}
                      </TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : sortedInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          No inventory items found
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedInventory.map((item) => {
                        const stockStatus = getStockStatus(item);
                        const availableQuantity = getAvailableQuantity(item);
                        const stockPercentage = Math.min(
                          Math.max((availableQuantity / (item.lowStockThreshold * 2)) * 100, 0),
                          100
                        );
                        
                        return (
                          <TableRow key={`${item.productId}-${item.size}`}>
                            <TableCell>{item.productId}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {item.product?.name || `Product ID: ${item.productId}`}
                              </div>
                              {item.product && (
                                <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                              )}
                            </TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{availableQuantity}</TableCell>
                            <TableCell>{item.reservedQuantity || 0}</TableCell>
                            <TableCell>{item.lowStockThreshold}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {new Date(item.lastRestocked).toLocaleDateString()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {formatDate(item.lastRestocked)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className={stockStatus.color}>
                                  {stockStatus.label}
                                </Badge>
                                <div className={`h-2 w-full rounded-full ${
                                    stockStatus.status === "out-of-stock"
                                      ? "bg-red-100"
                                      : stockStatus.status === "low-stock"
                                      ? "bg-amber-100"
                                      : "bg-green-100"
                                  }`}>
                                  <div 
                                    className={`h-full rounded-full ${
                                      stockStatus.status === "out-of-stock"
                                        ? "bg-red-500"
                                        : stockStatus.status === "low-stock"
                                        ? "bg-amber-500"
                                        : "bg-green-500"
                                    }`}
                                    style={{ width: `${stockPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleEditInventory(item)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => viewInventoryLogs(item)}
                                      >
                                        <Package className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Logs</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleReserveInventory(item)}
                                        disabled={availableQuantity <= 0}
                                      >
                                        <ShoppingBag className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleReleaseInventory(item)}
                                        disabled={(item.reservedQuantity || 0) <= 0}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Release</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Deletion</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete this inventory item?
                                        This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button
                                        variant="destructive"
                                        onClick={() => deleteInventoryItem(item.productId, item.size)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="low-stock" className="p-0">
              {/* Content is the same as the "all" tab but filtered for low stock items */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[80px]">Size</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[100px]">Available</TableHead>
                      <TableHead className="w-[100px]">Reserved</TableHead>
                      <TableHead className="w-[100px]">Threshold</TableHead>
                      <TableHead className="w-[120px]">Last Restocked</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : sortedInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                          <p>No low stock items found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedInventory.map((item) => {
                        const availableQuantity = getAvailableQuantity(item);
                        const stockPercentage = Math.min(
                          Math.max((availableQuantity / item.lowStockThreshold) * 100, 0),
                          100
                        );
                        
                        return (
                          <TableRow key={`${item.productId}-${item.size}`}>
                            <TableCell>{item.productId}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {item.product?.name || `Product ID: ${item.productId}`}
                              </div>
                              {item.product && (
                                <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                              )}
                            </TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{availableQuantity}</TableCell>
                            <TableCell>{item.reservedQuantity || 0}</TableCell>
                            <TableCell>{item.lowStockThreshold}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {new Date(item.lastRestocked).toLocaleDateString()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {formatDate(item.lastRestocked)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-amber-500 text-white">
                                  Low Stock
                                </Badge>
                                <div className="h-2 w-full rounded-full bg-amber-100">
                                  <div 
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${stockPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleEditInventory(item)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => viewInventoryLogs(item)}
                                      >
                                        <Package className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Logs</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleReserveInventory(item)}
                                        disabled={availableQuantity <= 0}
                                      >
                                        <ShoppingBag className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleReleaseInventory(item)}
                                        disabled={(item.reservedQuantity || 0) <= 0}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Release</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Deletion</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete this inventory item?
                                        This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button
                                        variant="destructive"
                                        onClick={() => deleteInventoryItem(item.productId, item.size)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="out-of-stock" className="p-0">
              {/* Content is the same as the "all" tab but filtered for out of stock items */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[80px]">Size</TableHead>
                      <TableHead className="w-[100px]">Total</TableHead>
                      <TableHead className="w-[100px]">Available</TableHead>
                      <TableHead className="w-[100px]">Reserved</TableHead>
                      <TableHead className="w-[100px]">Threshold</TableHead>
                      <TableHead className="w-[120px]">Last Restocked</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                        </TableRow>
                      ))
                    ) : sortedInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                          <p>No out of stock items found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedInventory.map((item) => {
                        const availableQuantity = getAvailableQuantity(item);
                        
                        return (
                          <TableRow key={`${item.productId}-${item.size}`}>
                            <TableCell>{item.productId}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {item.product?.name || `Product ID: ${item.productId}`}
                              </div>
                              {item.product && (
                                <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                              )}
                            </TableCell>
                            <TableCell>{item.size}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>{item.reservedQuantity || 0}</TableCell>
                            <TableCell>{item.lowStockThreshold}</TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    {new Date(item.lastRestocked).toLocaleDateString()}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {formatDate(item.lastRestocked)}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-red-500 text-white">
                                  Out of Stock
                                </Badge>
                                <div className="h-2 w-full rounded-full bg-red-100">
                                  <div 
                                    className="h-full rounded-full bg-red-500"
                                    style={{ width: `0%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleEditInventory(item)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => viewInventoryLogs(item)}
                                      >
                                        <Package className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Logs</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        disabled
                                      >
                                        <ShoppingBag className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reserve (Not Available)</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => handleReleaseInventory(item)}
                                        disabled={(item.reservedQuantity || 0) <= 0}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Release</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Confirm Deletion</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to delete this inventory item?
                                        This action cannot be undone.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                      </DialogClose>
                                      <Button
                                        variant="destructive"
                                        onClick={() => deleteInventoryItem(item.productId, item.size)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Inventory Dialog */}
      <Dialog open={selectedInventory !== null && updateForm.formState.isSubmitted === false} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update stock for {selectedInventory?.product?.name || `Product ID: ${selectedInventory?.productId}`} - Size {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateInventory)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Current reserved quantity: {selectedInventory?.reservedQuantity || 0}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={updateForm.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert will be triggered when available stock falls below this threshold
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInventory(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Inventory</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reserve Inventory Dialog */}
      <Dialog open={selectedInventory !== null && reserveForm.formState.isSubmitted === false && !updateForm.formState.isSubmitting && !releaseForm.formState.isSubmitting} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Inventory</DialogTitle>
            <DialogDescription>
              Reserve stock for {selectedInventory?.product?.name || `Product ID: ${selectedInventory?.productId}`} - Size {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...reserveForm}>
            <form onSubmit={reserveForm.handleSubmit(onReserveInventory)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-sm font-medium">Available Stock</p>
                  <p className="text-2xl font-bold">
                    {selectedInventory ? getAvailableQuantity(selectedInventory) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Already Reserved</p>
                  <p className="text-2xl font-bold">
                    {selectedInventory?.reservedQuantity || 0}
                  </p>
                </div>
              </div>
              
              <FormField
                control={reserveForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Reserve</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={selectedInventory ? getAvailableQuantity(selectedInventory) : 1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reserveForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Order placed, Preorder" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={reserveForm.control}
                name="referenceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Order number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional order number or reference ID for tracking
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInventory(null)}>
                  Cancel
                </Button>
                <Button type="submit">Reserve Stock</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Release Inventory Dialog */}
      <Dialog open={selectedInventory !== null && releaseForm.formState.isSubmitted === false && !updateForm.formState.isSubmitting && !reserveForm.formState.isSubmitting} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Inventory</DialogTitle>
            <DialogDescription>
              Release reserved stock for {selectedInventory?.product?.name || `Product ID: ${selectedInventory?.productId}`} - Size {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...releaseForm}>
            <form onSubmit={releaseForm.handleSubmit(onReleaseInventory)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-sm font-medium">Total Stock</p>
                  <p className="text-2xl font-bold">
                    {selectedInventory?.quantity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Currently Reserved</p>
                  <p className="text-2xl font-bold">
                    {selectedInventory?.reservedQuantity || 0}
                  </p>
                </div>
              </div>
              
              <FormField
                control={releaseForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Release</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max={selectedInventory?.reservedQuantity || 1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={releaseForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Order cancelled, Inventory correction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={releaseForm.control}
                name="referenceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Order number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional order number or reference ID for tracking
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedInventory(null)}>
                  Cancel
                </Button>
                <Button type="submit">Release Stock</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inventory Logs Dialog */}
      <Dialog open={selectedInventory !== null && logsLoading} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Inventory Logs</DialogTitle>
            <DialogDescription>
              History for {selectedInventory?.product?.name || `Product ID: ${selectedInventory?.productId}`} - Size {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : inventoryLogs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No logs found for this inventory item</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] pr-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={
                          log.action === "add"
                            ? "bg-green-500 text-white"
                            : log.action === "subtract"
                            ? "bg-red-500 text-white"
                            : log.action === "reserve"
                            ? "bg-blue-500 text-white"
                            : "bg-amber-500 text-white"
                        }>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.quantity}</TableCell>
                      <TableCell>{log.previousQuantity}</TableCell>
                      <TableCell>{log.newQuantity}</TableCell>
                      <TableCell>{log.reason}</TableCell>
                      <TableCell>{log.referenceId || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setSelectedInventory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}