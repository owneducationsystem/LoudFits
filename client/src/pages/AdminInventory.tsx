import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, AlertCircle, CheckCircle2, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/layout/AdminLayout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

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

// Form schemas
const addInventorySchema = z.object({
  productId: z.coerce.number().min(1, "Please select a product"),
  size: z.string().min(1, "Size is required"),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  lowStockThreshold: z.coerce.number().min(1, "Threshold must be at least 1"),
});

const updateInventorySchema = z.object({
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  lowStockThreshold: z.coerce.number().min(1, "Threshold must be at least 1"),
  reason: z.string().min(3, "Please provide a reason for the update"),
});

const reserveInventorySchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(3, "Please provide a reason for reserving inventory"),
  referenceId: z.string().optional(),
});

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<InventoryWithProduct | null>(null);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [viewType, setViewType] = useState<'all' | 'low-stock' | 'out-of-stock'>('all');
  
  // Form for adding new inventory
  const addForm = useForm<z.infer<typeof addInventorySchema>>({
    resolver: zodResolver(addInventorySchema),
    defaultValues: {
      productId: 0,
      size: "",
      quantity: 0,
      lowStockThreshold: 5,
    },
  });
  
  // Form for updating inventory
  const updateForm = useForm<z.infer<typeof updateInventorySchema>>({
    resolver: zodResolver(updateInventorySchema),
    defaultValues: {
      quantity: 0,
      lowStockThreshold: 5,
      reason: "",
    },
  });
  
  // Form for reserving inventory
  const reserveForm = useForm<z.infer<typeof reserveInventorySchema>>({
    resolver: zodResolver(reserveInventorySchema),
    defaultValues: {
      quantity: 1,
      reason: "",
      referenceId: "",
    },
  });
  
  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/admin/inventory");
      const data = await response.json();
      
      // Get all products first in a single call
      const productsResponse = await fetch("/api/products");
      const productsData = await productsResponse.json();
      
      // Create a map for quick product lookup
      const productsMap = productsData.reduce((map: Record<string, Product>, product: Product) => {
        map[product.id] = product;
        return map;
      }, {});
      
      // Attach product details to each inventory item
      const inventoryWithProducts = data.map((item: InventoryItem) => {
        return { 
          ...item, 
          product: productsMap[item.productId] || null
        };
      });
      
      setInventory(inventoryWithProducts);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };
  
  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  
  // Handle adding new inventory
  const handleAddInventory = async (data: z.infer<typeof addInventorySchema>) => {
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        // Close the dialog
        addForm.reset();
        
        // Force a timeout before fetching to ensure the server has processed the data
        setTimeout(() => {
          fetchInventory();
          // Also refresh the products data
          fetchProducts();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error("Error adding inventory:", errorData);
      }
    } catch (error) {
      console.error("Error adding inventory:", error);
    }
  };
  
  // View inventory logs
  const viewInventoryLogs = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    
    // Fetch logs for this inventory item
    fetch(`/api/admin/inventory/${item.id}/logs`)
      .then(response => response.json())
      .then(data => {
        setInventoryLogs(data);
      })
      .catch(error => {
        console.error("Error fetching inventory logs:", error);
      });
  };
  
  // Handle editing inventory
  const handleEditInventory = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    updateForm.reset({
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      reason: "",
    });
  };
  
  // Handle updating inventory
  const handleUpdateInventory = async (data: z.infer<typeof updateInventorySchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch(`/api/admin/inventory/${selectedInventory.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          action: data.quantity > selectedInventory.quantity ? 'add' : 'subtract',
          quantityChange: Math.abs(data.quantity - selectedInventory.quantity),
        }),
      });
      
      if (response.ok) {
        updateForm.reset();
        setSelectedInventory(null);
        
        // Force a timeout before fetching to ensure the server has processed the data
        setTimeout(() => {
          fetchInventory();
          // Also refresh the products data
          fetchProducts();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error("Error updating inventory:", errorData);
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };
  
  // Handle reserving inventory
  const handleReserveInventory = (item: InventoryWithProduct) => {
    setSelectedInventory(item);
    reserveForm.reset({
      quantity: 1,
      reason: "",
      referenceId: "",
    });
  };
  
  // Handle submitting reserve
  const handleSubmitReserve = async (data: z.infer<typeof reserveInventorySchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch(`/api/admin/inventory/${selectedInventory.id}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        reserveForm.reset();
        setSelectedInventory(null);
        
        // Force a timeout before fetching to ensure the server has processed the data
        setTimeout(() => {
          fetchInventory();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error("Error reserving inventory:", errorData);
      }
    } catch (error) {
      console.error("Error reserving inventory:", error);
    }
  };
  
  // Handle releasing reserved inventory
  const handleReleaseInventory = (item: InventoryWithProduct) => {
    if (item.reservedQuantity === 0) return;
    
    setSelectedInventory(item);
    reserveForm.reset({
      quantity: item.reservedQuantity,
      reason: "Released reserved inventory",
      referenceId: "",
    });
  };
  
  // Handle submitting release
  const handleSubmitRelease = async (data: z.infer<typeof reserveInventorySchema>) => {
    if (!selectedInventory) return;
    
    try {
      const response = await fetch(`/api/admin/inventory/${selectedInventory.id}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        reserveForm.reset();
        setSelectedInventory(null);
        
        // Force a timeout before fetching to ensure the server has processed the data
        setTimeout(() => {
          fetchInventory();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error("Error releasing inventory:", errorData);
      }
    } catch (error) {
      console.error("Error releasing inventory:", error);
    }
  };
  
  // Filter inventory based on search and view type
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewType === 'low-stock') {
      return matchesSearch && item.quantity <= item.lowStockThreshold && item.quantity > 0;
    } else if (viewType === 'out-of-stock') {
      return matchesSearch && item.quantity === 0;
    }
    
    return matchesSearch;
  });
  
  // Get available quantity (total - reserved)
  const getAvailableQuantity = (item: InventoryItem) => {
    return item.quantity - (item.reservedQuantity || 0);
  };
  
  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (item.quantity <= item.lowStockThreshold) {
      return { label: "Low Stock", variant: "warning" as const };
    } else {
      return { label: "In Stock", variant: "success" as const };
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const content = (
    <div>
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
                <DialogTitle>Add New Inventory</DialogTitle>
                <DialogDescription>
                  Add inventory for a product with size-specific quantities.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddInventory)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.sku})
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
                          <Input {...field} placeholder="e.g. S, M, L, XL" />
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
                          <Input type="number" {...field} min={0} />
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
                          <Input type="number" {...field} min={1} />
                        </FormControl>
                        <FormDescription>
                          Notifications will be sent when stock falls below this level.
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
        </div>
      </div>
      
      <div className="mb-6 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by product name, SKU, or size..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs defaultValue="all" className="w-auto" onValueChange={(value) => setViewType(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Restocked</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm 
                    ? "No inventory items match your search."
                    : viewType === 'low-stock'
                      ? "No low stock items found."
                      : viewType === 'out-of-stock'
                        ? "No out of stock items found."
                        : "No inventory items found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const status = getStockStatus(item);
                const stockPercentage = Math.min(100, Math.max(0, Math.round((item.quantity / Math.max(item.lowStockThreshold * 2, 1)) * 100)));
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {item.product && item.product.images && item.product.images.length > 0 && (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name || 'Product image'} 
                            className="h-10 w-10 object-cover rounded mr-3" 
                          />
                        )}
                        <div>
                          <div className="font-medium">{item.product?.name || 'Unknown product'}</div>
                          <div className="text-sm text-gray-500">{item.product?.sku || 'No SKU'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{getAvailableQuantity(item)}</TableCell>
                    <TableCell>{item.reservedQuantity || 0}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          variant={status.variant === 'success' ? 'default' : 
                            status.variant === 'warning' ? 'outline' : 'destructive'}
                        >
                          {status.label}
                        </Badge>
                        <Progress value={stockPercentage} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>{new Date(item.lastRestocked).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" onClick={() => handleEditInventory(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => viewInventoryLogs(item)}>
                          <Layers className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleReserveInventory(item)}>
                          <AlertCircle className="h-4 w-4" />
                        </Button>
                        {item.reservedQuantity > 0 && (
                          <Button variant="outline" size="icon" onClick={() => handleReleaseInventory(item)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Inventory Dialog */}
      <Dialog open={selectedInventory !== null && updateForm.formState.isSubmitted === false} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update inventory for {selectedInventory?.product?.name} - Size: {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(handleUpdateInventory)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={0} />
                    </FormControl>
                    <FormDescription>
                      Current quantity: {selectedInventory?.quantity}
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
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormDescription>
                      Current threshold: {selectedInventory?.lowStockThreshold}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Update</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Restocking, Inventory adjustment" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSelectedInventory(null)}>Cancel</Button>
                <Button type="submit">Update Inventory</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reserve Inventory Dialog */}
      <Dialog open={selectedInventory !== null && reserveForm.formState.isSubmitted === false && updateForm.formState.isSubmitted === true} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve Inventory</DialogTitle>
            <DialogDescription>
              Reserve inventory for {selectedInventory?.product?.name} - Size: {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          <Form {...reserveForm}>
            <form onSubmit={reserveForm.handleSubmit(handleSubmitReserve)} className="space-y-4">
              <FormField
                control={reserveForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Reserve</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} max={selectedInventory?.quantity} />
                    </FormControl>
                    <FormDescription>
                      Available: {selectedInventory?.quantity} | Reserved: {selectedInventory?.reservedQuantity}
                    </FormDescription>
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
                      <Input {...field} placeholder="e.g. Order #12345, Customer hold" />
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
                      <Input {...field} placeholder="e.g. Order number, Customer ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSelectedInventory(null)}>Cancel</Button>
                <Button type="submit">Reserve</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Release Inventory Dialog */}
      <Dialog open={selectedInventory !== null && reserveForm.formState.isSubmitted === false && updateForm.formState.isSubmitted === true && selectedInventory?.reservedQuantity > 0} onOpenChange={(open) => !open && setSelectedInventory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Reserved Inventory</DialogTitle>
            <DialogDescription>
              Release reserved inventory for {selectedInventory?.product?.name} - Size: {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          <Form {...reserveForm}>
            <form onSubmit={reserveForm.handleSubmit(handleSubmitRelease)} className="space-y-4">
              <FormField
                control={reserveForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Release</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} max={selectedInventory?.reservedQuantity} />
                    </FormControl>
                    <FormDescription>
                      Currently Reserved: {selectedInventory?.reservedQuantity}
                    </FormDescription>
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
                      <Input {...field} placeholder="e.g. Order cancelled, Reservation expired" />
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
                      <Input {...field} placeholder="e.g. Order number, Customer ID" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setSelectedInventory(null)}>Cancel</Button>
                <Button type="submit">Release</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inventory Logs Dialog */}
      <Dialog open={selectedInventory !== null && inventoryLogs.length > 0} onOpenChange={(open) => !open && setInventoryLogs([])}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Inventory History</DialogTitle>
            <DialogDescription>
              History for {selectedInventory?.product?.name} - Size: {selectedInventory?.size}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-96 overflow-y-auto">
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
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.action === 'add' ? 'default' :
                        log.action === 'subtract' ? 'destructive' :
                        log.action === 'reserve' ? 'outline' : 'secondary'
                      }>
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.quantity}</TableCell>
                    <TableCell>{log.previousQuantity}</TableCell>
                    <TableCell>{log.newQuantity}</TableCell>
                    <TableCell>{log.reason}</TableCell>
                    <TableCell>{log.referenceId || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setInventoryLogs([])}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  return (
    <AdminLayout title="Inventory Management">
      {content}
    </AdminLayout>
  );
}