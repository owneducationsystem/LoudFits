import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, ArrowLeft, Plus, X, Upload, ImagePlus } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/layout/AdminLayout";

// Simple schema for basic product creation
const addProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  category: z.string().min(1, "Category is required"),
  gender: z.string().min(1, "Gender is required"),
  images: z.array(z.string()).default([]),
});

type AddProductFormValues = z.infer<typeof addProductSchema>;

// Simplified Add Product Page
const AdminAddProductSimple = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<AddProductFormValues>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      gender: "Unisex",
      images: [],
    },
  });
  
  // Handle adding an image URL
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    
    // Simple validation for image URL
    if (!imageUrlInput.match(/\.(jpeg|jpg|gif|png)$/i)) {
      toast({
        title: "Invalid image URL",
        description: "Please enter a valid image URL (JPEG, JPG, GIF, PNG)",
        variant: "destructive",
      });
      return;
    }
    
    const formImages = form.getValues("images") || [];
    const newImages = [...formImages];
    
    if (!newImages.includes(imageUrlInput)) {
      newImages.push(imageUrlInput);
      form.setValue("images", newImages, { shouldValidate: true });
      setImageUrls(newImages);
    }
    
    setImageUrlInput("");
  };
  
  // Handle removing an image URL
  const handleRemoveImageUrl = (url: string) => {
    const formImages = form.getValues("images") || [];
    const newImages = formImages.filter(i => i !== url);
    form.setValue("images", newImages, { shouldValidate: true });
    setImageUrls(newImages);
  };
  
  // Handle file input change for image uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to array and filter for image files only
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Check maximum file size (5MB)
    const validFiles = newFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length < newFiles.length) {
      toast({
        title: "File size exceeded",
        description: "Some images were skipped because they exceed the 5MB limit.",
        variant: "destructive",
      });
    }
    
    if (validFiles.length === 0) return;
    
    // Create and add the local preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setUploadedImages(prev => [...prev, ...validFiles]);
    setUploadPreviews(prev => [...prev, ...newPreviews]);
    
    // Combine all images (URLs and file previews) for the form value
    const formImages = form.getValues("images") || [];
    const allImages = [...formImages, ...newPreviews];
    form.setValue("images", allImages, { shouldValidate: true });
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle removing uploaded image preview
  const handleRemoveUploadedImage = (index: number) => {
    setUploadPreviews(prev => {
      const newPreviews = [...prev];
      // Clean up the URL object
      URL.revokeObjectURL(newPreviews[index]); 
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    
    setUploadedImages(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    // Update the form value with remaining images
    const formImages = form.getValues("images") || [];
    const allImages = [
      ...imageUrls, 
      ...uploadPreviews.filter((_, i) => i !== index)
    ];
    form.setValue("images", allImages, { shouldValidate: true });
  };
  
  // Trigger file input click
  const handleImageUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit = async (values: AddProductFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Submitting product data:", values);
      
      // Create a product with minimal fields
      const productData = {
        ...values,
        // Add required fields for the database schema
        sizes: ["S", "M", "L"],
        colors: ["Black", "White"],
        // Use uploaded images if available, otherwise default to combined image arrays
        images: (imageUrls.length > 0 || uploadPreviews.length > 0) 
          ? [...imageUrls, ...uploadPreviews] 
          : ["https://placehold.co/600x400?text=Product+Image"],
      };
      
      // Create product via API
      const response = await apiRequest("POST", "/api/admin/products", productData);
      const data = await response.json();
      
      console.log("API response:", data);
      
      // Invalidate related queries to refresh data across the application
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/trending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
      
      toast({
        title: "Product created",
        description: `Product "${values.name}" has been successfully created.`,
      });
      
      // Redirect to products list
      navigate("/admin/products");
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AdminLayout title="Add Product (Simple)">
      <Helmet>
        <title>Add Product | Admin Dashboard</title>
      </Helmet>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Add Product</h2>
          <p className="text-muted-foreground">
            Create a new product (simplified version)
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
            Enter the basic details for the new product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="add-product-form" className="space-y-4">
              <Tabs 
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid grid-cols-2 md:w-[400px]">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6">
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
                </TabsContent>
                
                {/* Images Tab */}
                <TabsContent value="images" className="space-y-6">
                  <FormField
                    control={form.control}
                    name="images"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Product Images</FormLabel>
                          <FormDescription>
                            Upload images or add image URLs for this product. The first image will be used as the main image.
                          </FormDescription>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {/* URL Images */}
                          {imageUrls.map((url, index) => (
                            <div
                              key={`url-${url}-${index}`}
                              className="relative rounded-md overflow-hidden border aspect-square group"
                            >
                              <img
                                src={url}
                                alt={`Product image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImageUrl(url)}
                                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              {index === 0 && !uploadPreviews.length && (
                                <Badge 
                                  className="absolute bottom-2 left-2" 
                                  variant="secondary"
                                >
                                  Main Image
                                </Badge>
                              )}
                            </div>
                          ))}
                          
                          {/* File Upload Previews */}
                          {uploadPreviews.map((preview, index) => (
                            <div
                              key={`preview-${index}`}
                              className="relative rounded-md overflow-hidden border aspect-square group"
                            >
                              <img
                                src={preview}
                                alt={`Uploaded image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedImage(index)}
                                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              {index === 0 && imageUrls.length === 0 && (
                                <Badge 
                                  className="absolute bottom-2 left-2" 
                                  variant="secondary"
                                >
                                  Main Image
                                </Badge>
                              )}
                            </div>
                          ))}
                          
                          {/* Upload image button */}
                          {(imageUrls.length + uploadPreviews.length) < 6 && (
                            <div 
                              className="border border-dashed rounded-md flex items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={handleImageUploadClick}
                            >
                              <div className="text-center p-4">
                                <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium mb-1">Upload Images</p>
                                <p className="text-xs text-muted-foreground">
                                  JPG, PNG, GIF up to 5MB
                                </p>
                                {/* Hidden file input */}
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileChange}
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Separator className="my-4" />
                        <p className="text-sm font-medium mb-2">Or add an image by URL</p>
                        
                        <div className="flex gap-2">
                          <Input
                            value={imageUrlInput}
                            onChange={(e) => setImageUrlInput(e.target.value)}
                            placeholder="Enter image URL"
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="secondary"
                            onClick={handleAddImageUrl}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add URL
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
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
            form="add-product-form"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Product"}
          </Button>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default AdminAddProductSimple;