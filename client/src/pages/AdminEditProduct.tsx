import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, ArrowLeft } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";
import { Product } from "@shared/schema";

// Schema for editing product
const editProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  category: z.string().min(1, "Category is required"),
  gender: z.string().min(1, "Gender is required"),
  inStock: z.boolean().default(true),
});

type EditProductFormValues = z.infer<typeof editProductSchema>;

// Edit Product Page
const AdminEditProduct = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/admin/products/edit/:id");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!params?.id) return;
      
      try {
        setIsLoading(true);
        // Get product from API
        const response = await apiRequest("GET", `/api/products/${params.id}`);
        const productData = await response.json();
        
        setProduct(productData);
        
        // Set form values
        form.reset({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          category: productData.category,
          gender: productData.gender,
          inStock: productData.inStock,
        });
      } catch (error) {
        console.error("Failed to load product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProduct();
  }, [params?.id, toast]);
  
  const form = useForm<EditProductFormValues>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      gender: "Unisex",
      inStock: true,
    },
  });
  
  const onSubmit = async (values: EditProductFormValues) => {
    if (!params?.id || !product) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Updating product data:", values);
      
      // Update product via API
      const response = await apiRequest("PATCH", `/api/admin/products/${params.id}`, {
        ...values,
        price: values.price.toString(),
      });
      
      const data = await response.json();
      console.log("API response:", data);
      
      toast({
        title: "Product updated",
        description: `Product "${values.name}" has been successfully updated.`,
      });
      
      // Redirect to products list
      navigate("/admin/products");
    } catch (error: any) {
      console.error("Failed to update product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }
  
  // Show error if product not found
  if (!product && !isLoading) {
    return (
      <AdminLayout title="Edit Product">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-500">Product Not Found</CardTitle>
            <CardDescription>
              The product you are trying to edit could not be found.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-t pt-6">
            <Button onClick={() => navigate("/admin/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </CardFooter>
        </Card>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout title="Edit Product">
      <Helmet>
        <title>Edit Product | Admin Dashboard</title>
      </Helmet>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Edit Product</h2>
          <p className="text-muted-foreground">
            Update product information
          </p>
        </div>
        
        <Button variant="outline" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>
            Update the details for this product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="edit-product-form" className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bold Abstract T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A premium t-shirt with a striking abstract design..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹)</FormLabel>
                      <FormControl>
                        <Input placeholder="599.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Graphic Tees" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Input placeholder="Unisex, Men, or Women" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">In Stock</FormLabel>
                      <FormMessage />
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/products")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-product-form"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default AdminEditProduct;