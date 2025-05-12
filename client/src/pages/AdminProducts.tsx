import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Pencil, 
  Trash2, 
  Search, 
  Plus, 
  Filter, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import AdminLayout from "@/components/layout/AdminLayout";
import { Product } from "@shared/schema";

// Product Management Page
const AdminProducts = () => {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [collections, setCollections] = useState<string[]>([]);
  const productsPerPage = 10;

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", "/api/products");
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
        
        // Extract unique collections
        const uniqueCollections = Array.from(
          new Set(data.map((product: Product) => product.collection))
        ).filter(Boolean) as string[];
        
        setCollections(uniqueCollections);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query and collection
  useEffect(() => {
    let result = [...products];
    
    // Filter by collection
    if (selectedCollection !== "all") {
      result = result.filter(product => product.collection === selectedCollection);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          product.description.toLowerCase().includes(query)
      );
    }
    
    // Sort products
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Product];
      let bValue: any = b[sortField as keyof Product];
      
      // Handle numeric values
      if (typeof aValue === "string" && !isNaN(Number(aValue))) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      // Handle string values
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    setFilteredProducts(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchQuery, sortField, sortDirection, selectedCollection]);

  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle delete product
  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await apiRequest("DELETE", `/api/admin/products/${productId}`);
        
        // Update products state
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== productId)
        );
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <AdminLayout title="Products">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Products">
      <Helmet>
        <title>Manage Products | Admin Dashboard</title>
      </Helmet>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your store's products and inventory
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate("/admin/products/categories")}
          >
            <Filter className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          
          <Button onClick={() => navigate("/admin/products/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={selectedCollection}
                onValueChange={setSelectedCollection}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collections</SelectItem>
                  {collections.map(collection => (
                    <SelectItem key={collection} value={collection}>
                      {collection}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 font-medium"
                      onClick={() => handleSort("id")}
                    >
                      ID
                      {sortField === "id" && (
                        sortDirection === "asc" ? 
                        <ArrowUp className="ml-1 h-3 w-3" /> : 
                        <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Name
                      {sortField === "name" && (
                        sortDirection === "asc" ? 
                        <ArrowUp className="ml-1 h-3 w-3" /> : 
                        <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 font-medium"
                      onClick={() => handleSort("collection")}
                    >
                      Collection
                      {sortField === "collection" && (
                        sortDirection === "asc" ? 
                        <ArrowUp className="ml-1 h-3 w-3" /> : 
                        <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 font-medium"
                      onClick={() => handleSort("price")}
                    >
                      Price
                      {sortField === "price" && (
                        sortDirection === "asc" ? 
                        <ArrowUp className="ml-1 h-3 w-3" /> : 
                        <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 font-medium"
                      onClick={() => handleSort("stock")}
                    >
                      Stock
                      {sortField === "stock" && (
                        sortDirection === "asc" ? 
                        <ArrowUp className="ml-1 h-3 w-3" /> : 
                        <ArrowDown className="ml-1 h-3 w-3" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {currentProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.id}
                      </TableCell>
                      <TableCell>
                        <div className="h-12 w-12 rounded overflow-hidden bg-gray-100">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            <span className="text-xs">Category: {product.category}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {product.collection ? (
                          <Badge variant="outline">{product.collection}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(Number(product.price))}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => handlePageChange(page)}
                    className="w-8 h-8"
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminProducts;