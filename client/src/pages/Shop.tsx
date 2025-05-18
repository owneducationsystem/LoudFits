import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Product } from "@shared/schema";
import ProductCard from "@/components/ui/product-card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Shop = () => {
  const [location, navigate] = useLocation();
  const [, params] = useRoute('/shop');
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams());
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Handle filter changes and update the URL
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    
    if (category && category !== "all") {
      newParams.set("category", category);
    } else {
      newParams.delete("category");
    }
    
    const queryString = newParams.toString();
    const newLocation = queryString ? `/shop?${queryString}` : '/shop';
    navigate(newLocation);
  };
  
  // Load filters from URL when the page loads or URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setSearchParams(urlParams);
    
    // Get filters from URL parameters
    const category = urlParams.get("category");
    const gender = urlParams.get("gender");
    const collection = urlParams.get("collection");
    const size = urlParams.get("size");
    const color = urlParams.get("color");
    
    // Apply filters from URL parameters
    setSelectedCategory(category || "");
    setSelectedGender(gender || "");
    setSelectedCollection(collection || "");
    setSelectedSizes(size ? size.split(",") : []);
    setSelectedColors(color ? color.split(",") : []);
  }, [location]);

  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (error) {
    console.error("Error loading products:", error);
  }

  // No fallback products - only use database data

  const displayProducts = products || [];

  // Filter products based on selected filters
  const filteredProducts = displayProducts.filter((product: Product) => {
    let matches = true;
    
      // Handle category filtering
    if (selectedCategory && 
        selectedCategory !== "all" && 
        selectedCategory !== "" && 
        !product.category.includes(selectedCategory)) {
      matches = false;
    }
    
    if (selectedGender && product.gender !== selectedGender) {
      matches = false;
    }
    
    if (selectedCollection && product.collection !== selectedCollection) {
      matches = false;
    }
    
    if (selectedSizes.length > 0) {
      const sizeMatches = selectedSizes.some((size) => product.sizes.includes(size));
      if (!sizeMatches) {
        matches = false;
      }
    }
    
    if (selectedColors.length > 0) {
      const colorMatches = selectedColors.some((color) => product.colors.includes(color));
      if (!colorMatches) {
        matches = false;
      }
    }
    
    return matches;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return parseFloat(a.price as any) - parseFloat(b.price as any);
      case "price-desc":
        return parseFloat(b.price as any) - parseFloat(a.price as any);
      case "newest":
      default:
        return b.id - a.id;
    }
  });

  const handleSizeChange = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const pageTitle = selectedCategory 
    ? `${selectedCategory.replace('-', ' ').toUpperCase()} - Loudfits`
    : selectedCollection
    ? `${selectedCollection.replace('-', ' ').toUpperCase()} Collection - Loudfits`
    : selectedGender
    ? `${selectedGender.toUpperCase()} - Loudfits`
    : "Shop All - Loudfits";

  const allSizes = ["S", "M", "L", "XL", "XXL"];
  const allColors = ["Black", "White", "Gray", "Navy", "Red", "Blue", "Green"];

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta 
          name="description" 
          content="Shop Loudfits collection of bold, expressive t-shirts. Find printed tees, custom designs, and stylish streetwear for men and women." 
        />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">
              {selectedCategory 
                ? selectedCategory.replace('-', ' ').toUpperCase()
                : selectedCollection
                ? `${selectedCollection.replace('-', ' ').toUpperCase()} COLLECTION`
                : selectedGender
                ? `${selectedGender.toUpperCase()}'S T-SHIRTS`
                : "ALL PRODUCTS"}
            </h1>
            
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 md:hidden px-4 py-2 border border-gray-300 rounded">
                    <Filter size={18} />
                    <span>Filters</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                    <SheetDescription>
                      Refine your product selection
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Mobile filters - same as desktop but in a sheet */}
                    <div>
                      <h3 className="font-medium mb-3">Category</h3>
                      <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="category-all-mobile" />
                            <Label htmlFor="category-all-mobile">All Categories</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="printed-tees" id="category-printed-mobile" />
                            <Label htmlFor="category-printed-mobile">Printed Tees</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="graphic-tees" id="category-graphic-mobile" />
                            <Label htmlFor="category-graphic-mobile">Graphic Tees</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new-arrivals" id="category-new-mobile" />
                            <Label htmlFor="category-new-mobile">New Arrivals</Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-3">Size</h3>
                      <div className="space-y-2">
                        {allSizes.map((size) => (
                          <div className="flex items-center space-x-2" key={size}>
                            <Checkbox 
                              id={`size-${size.toLowerCase()}-mobile`} 
                              checked={selectedSizes.includes(size)}
                              onCheckedChange={() => handleSizeChange(size)}
                            />
                            <Label htmlFor={`size-${size.toLowerCase()}-mobile`}>{size}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-3">Color</h3>
                      <div className="space-y-2">
                        {allColors.map((color) => (
                          <div className="flex items-center space-x-2" key={color}>
                            <Checkbox 
                              id={`color-${color.toLowerCase()}-mobile`} 
                              checked={selectedColors.includes(color)}
                              onCheckedChange={() => handleColorChange(color)}
                            />
                            <Label htmlFor={`color-${color.toLowerCase()}-mobile`}>{color}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center">
                <Select 
                  value={sortBy} 
                  onValueChange={(value) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Desktop Filters */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Category</h3>
                  <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="category-all" />
                        <Label htmlFor="category-all">All Categories</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="printed-tees" id="category-printed" />
                        <Label htmlFor="category-printed">Printed Tees</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="graphic-tees" id="category-graphic" />
                        <Label htmlFor="category-graphic">Graphic Tees</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new-arrivals" id="category-new" />
                        <Label htmlFor="category-new">New Arrivals</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Size</h3>
                  <div className="space-y-2">
                    {allSizes.map((size) => (
                      <div className="flex items-center space-x-2" key={size}>
                        <Checkbox 
                          id={`size-${size.toLowerCase()}`} 
                          checked={selectedSizes.includes(size)}
                          onCheckedChange={() => handleSizeChange(size)}
                        />
                        <Label htmlFor={`size-${size.toLowerCase()}`}>{size}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Color</h3>
                  <div className="space-y-2">
                    {allColors.map((color) => (
                      <div className="flex items-center space-x-2" key={color}>
                        <Checkbox 
                          id={`color-${color.toLowerCase()}`} 
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorChange(color)}
                        />
                        <Label htmlFor={`color-${color.toLowerCase()}`}>{color}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Products Grid */}
            <div className="flex-grow">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                      <Skeleton className="h-[250px] w-full rounded-md" />
                      <Skeleton className="h-4 w-2/3 rounded-md" />
                      <Skeleton className="h-4 w-1/3 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-lg text-gray-500">No products found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Shop;
