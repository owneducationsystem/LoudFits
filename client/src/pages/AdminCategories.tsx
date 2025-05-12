import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  X,
  ArrowLeft,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";

// Category type
interface Category {
  id: number;
  name: string;
  description: string;
  slug: string;
  productCount: number;
}

// Categories Management Page
const AdminCategories = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Sample categories data (replace with API call)
  const sampleCategories: Category[] = [
    { id: 1, name: "Graphic Tees", description: "T-shirts with graphic designs", slug: "graphic-tees", productCount: 12 },
    { id: 2, name: "Printed Shirts", description: "Shirts with printed patterns", slug: "printed-shirts", productCount: 8 },
    { id: 3, name: "Typography", description: "Designs featuring creative text and typography", slug: "typography", productCount: 5 },
    { id: 4, name: "Abstract", description: "Abstract art and geometric patterns", slug: "abstract", productCount: 9 },
    { id: 5, name: "Artists", description: "Designs from our featured artists", slug: "artists", productCount: 7 },
    { id: 6, name: "Limited Edition", description: "Exclusive limited runs of special designs", slug: "limited-edition", productCount: 3 },
  ];
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call when ready
        // const response = await apiRequest("GET", "/api/admin/categories");
        // const data = await response.json();
        // setCategories(data);
        
        // Using sample data for now
        setCategories(sampleCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, [toast]);
  
  // Create a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      // const response = await apiRequest("POST", "/api/admin/categories", {
      //   name: newCategoryName,
      //   description: newCategoryDescription,
      // });
      // const newCategory = await response.json();
      
      // For demo purposes, create a new category locally
      const newCategory: Category = {
        id: Math.max(0, ...categories.map(c => c.id)) + 1,
        name: newCategoryName,
        description: newCategoryDescription,
        slug: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        productCount: 0,
      };
      
      setCategories([...categories, newCategory]);
      
      toast({
        title: "Category created",
        description: `Category "${newCategoryName}" has been created successfully.`,
      });
      
      // Reset form and close dialog
      setNewCategoryName("");
      setNewCategoryDescription("");
      setShowAddDialog(false);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update a category
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      // const response = await apiRequest("PATCH", `/api/admin/categories/${editingCategory.id}`, {
      //   name: editingCategory.name,
      //   description: editingCategory.description,
      // });
      // const updatedCategory = await response.json();
      
      // For demo purposes, update the category locally
      const updatedCategories = categories.map(category => 
        category.id === editingCategory.id
          ? { 
              ...editingCategory,
              slug: editingCategory.name.toLowerCase().replace(/\s+/g, '-')
            }
          : category
      );
      
      setCategories(updatedCategories);
      
      toast({
        title: "Category updated",
        description: `Category "${editingCategory.name}" has been updated successfully.`,
      });
      
      // Reset form and close dialog
      setEditingCategory(null);
      setShowEditDialog(false);
    } catch (error: any) {
      console.error("Failed to update category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a category
  const handleDeleteCategory = async (categoryId: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }
    
    try {
      // Simulate API call
      // await apiRequest("DELETE", `/api/admin/categories/${categoryId}`);
      
      // For demo purposes, remove the category locally
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);
      
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <AdminLayout title="Categories">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Categories">
      <Helmet>
        <title>Product Categories | Admin Dashboard</title>
      </Helmet>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage product categories
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Product Categories</CardTitle>
          <CardDescription>
            Organize your products with categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Slug</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                      {category.description}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{category.slug}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{category.productCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCategory(category);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={category.productCount > 0}
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
        </CardContent>
        <CardFooter className="border-t pt-5">
          <p className="text-sm text-muted-foreground">
            Note: Categories with products cannot be deleted. Move or delete all products in a category before deleting the category.
          </p>
        </CardFooter>
      </Card>
      
      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Graphic Tees"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update this product category
            </DialogDescription>
          </DialogHeader>
          
          {editingCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <p className="text-sm text-muted-foreground">
                  This will be automatically generated from the category name.
                </p>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {editingCategory.name.toLowerCase().replace(/\s+/g, '-')}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCategories;