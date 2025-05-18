import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { 
  Share2, 
  Heart, 
  TruckIcon, 
  RotateCcw, 
  Ruler,
  Upload,
  Camera,
  Plus,
  Minus
} from "lucide-react";
import ProductImageCarousel from "@/components/ui/product-image-carousel";
import { StockIndicator } from "@/components/ui/StockIndicator";
import { useStockStatus } from "@/hooks/useStockStatus";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartContext } from "@/context/CartContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ProductCarousel from "@/components/ui/product-carousel";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCartContext();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlistContext();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });
  
  // Get real-time stock status with enhanced details
  const stockDetails = useStockStatus(product);

  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get related products from the same collection, excluding current product
  const filteredRelatedProducts = (relatedProducts && relatedProducts.length > 0 && product) 
    ? relatedProducts.filter(p => p.id !== product.id).slice(0, 4) 
    : [];

  // Set initial size and color when product data is loaded
  if (product && !selectedSize && product.sizes && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }

  if (product && !selectedColor && product.colors && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }

  const nextImage = () => {
    if (!product || !product.images) return;
    
    setCurrentImageIndex((prevIndex) => 
      prevIndex === product.images.length - 1 ? 0 : prevIndex + 1
    );
    // Reset zoom and drag position when changing images
    resetZoom();
  };

  const prevImage = () => {
    if (!product || !product.images) return;
    
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? product.images.length - 1 : prevIndex - 1
    );
    // Reset zoom and drag position when changing images
    resetZoom();
  };
  
  const handleZoomIn = () => {
    if (zoomLevel < 2.5) {
      setZoomLevel(prev => prev + 0.5);
      setIsZoomed(true);
      setDragPosition({ x: 0, y: 0 }); // Reset position when zooming in
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prev => Math.max(1, prev - 0.5));
      setIsZoomed(zoomLevel - 0.5 > 1);
      
      // If zooming all the way out, reset drag position
      if (zoomLevel - 0.5 <= 1) {
        setDragPosition({ x: 0, y: 0 });
      }
    }
  };
  
  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setDragPosition({ x: 0, y: 0 });
  };
  
  // Handle drag start for the image
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startDragX = dragPosition.x;
    const startDragY = dragPosition.y;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!imageRef.current) return;
      
      // Calculate boundaries based on zoom level
      const maxDrag = (zoomLevel - 1) * 100; // Maximum drag distance in pixels
      
      // Calculate new position
      const newX = startDragX + (moveEvent.clientX - startX);
      const newY = startDragY + (moveEvent.clientY - startY);
      
      // Apply boundaries
      const boundedX = Math.max(-maxDrag, Math.min(maxDrag, newX));
      const boundedY = Math.max(-maxDrag, Math.min(maxDrag, newY));
      
      setDragPosition({ x: boundedX, y: boundedY });
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const incrementQuantity = () => {
    // If stock is low, don't allow increasing beyond available quantity
    if (stockDetails.status === 'LOW_STOCK' && quantity >= (stockDetails.quantity || 0)) {
      toast({
        title: "Maximum quantity reached",
        description: `Only ${stockDetails.quantity} item(s) available.`,
        variant: "destructive",
      });
      return;
    }
    
    // For safety, limit quantity to a reasonable number even for in-stock items
    if (quantity >= 10 && stockDetails.status === 'IN_STOCK') {
      toast({
        title: "Maximum quantity reached",
        description: "For larger orders, please contact customer service.",
      });
      return;
    }
    
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;
    
    // Check stock status before adding to cart
    if (stockDetails.status === 'OUT_OF_STOCK') {
      toast({
        title: "Out of Stock",
        description: "Sorry, this item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if trying to order more than available for low stock items
    if (stockDetails.status === 'LOW_STOCK' && quantity > (stockDetails.quantity || 0)) {
      toast({
        title: "Limited Stock",
        description: `Only ${stockDetails.quantity} item(s) available. Please adjust quantity.`,
        variant: "destructive",
      });
      return;
    }
    
    addToCart({
      productId: product.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
      product: product
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleCustomize = () => {
    if (!product) return;
    navigate(`/customize?productId=${product.id}`);
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(product.id, product.name);
    }
  };

  const handleShare = () => {
    if (!product) return;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[500px] rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-md" />
            <Skeleton className="h-6 w-1/4 rounded-md" />
            <Skeleton className="h-6 w-2/4 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    console.error("Error loading product:", error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-red-500">
          {error ? "Error loading product. Please try again later." : "Product not found."}
        </p>
        <Button 
          className="mt-4" 
          onClick={() => navigate("/shop")}
        >
          Back to Shop
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - Loudfits</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile breadcrumb */}
        <div className="mb-3 text-sm text-gray-500 hidden xs:flex items-center gap-1">
          <span onClick={() => navigate('/shop')} className="hover:text-[#582A34] transition-colors cursor-pointer">Shop</span>
          <span>/</span>
          <span onClick={() => navigate(`/shop?category=${product.category || 't-shirts'}`)} className="hover:text-[#582A34] transition-colors cursor-pointer">
            {product.category || 'T-Shirts'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          {/* Product Gallery */}
          <div className="relative h-[350px] xs:h-[450px] md:h-[500px]">
            {product.images?.length > 0 ? (
              <ProductImageCarousel 
                images={product.images} 
                productName={product.name}
                autoRotate={true}
                autoRotateInterval={5000}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
            )}
              
            {/* Zoom Controls */}
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                className="bg-white/80 p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                className="bg-white/80 p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex mt-4 gap-2">
            {product.images.map((image: string, index: number) => (
              <button
                key={index}
                className={`w-16 h-16 rounded-md overflow-hidden border-2 ${
                  index === currentImageIndex
                    ? "border-[#582A34]"
                    : "border-transparent"
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
              
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-xl font-bold text-[#582A34]">₹{product.price.toString()}</p>
                  {/* Stock Availability Indicator */}
                  <StockIndicator 
                    status={stockDetails.status}
                    quantity={stockDetails.quantity}
                    showQuantity={stockDetails.status === 'LOW_STOCK'}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="text-gray-600 hover:text-[#582A34] transition-colors"
                    aria-label="Share product"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className={`${isInWishlist(product?.id || 0) ? 'text-[#582A34]' : 'text-gray-600'} hover:text-[#582A34] transition-colors`}
                    aria-label={isInWishlist(product?.id || 0) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart 
                      className={`h-5 w-5 ${isInWishlist(product?.id || 0) ? 'fill-current' : ''}`} 
                    />
                  </button>
                </div>
              </div>
            </div>

            <Separator className="my-1" />

            {/* Compact Selectors Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Left column: Size and Color */}
              <div className="space-y-3">
                {/* Size Selection */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium text-sm">Size</h3>
                    <button 
                      className="text-xs flex items-center gap-1 text-gray-600 hover:text-[#582A34] transition-colors"
                      onClick={() => navigate("/size-guide")}
                    >
                      <Ruler className="h-3 w-3" />
                      <span>Size Guide</span>
                    </button>
                  </div>
                  <RadioGroup
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    className="flex flex-wrap gap-1.5"
                  >
                    {product.sizes.map((size: string) => (
                      <div key={size}>
                        <RadioGroupItem
                          value={size}
                          id={`size-${size}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`size-${size}`}
                          className={`h-9 min-w-9 px-2 flex items-center justify-center rounded-md border border-gray-200 cursor-pointer text-sm ${
                            selectedSize === size
                              ? "bg-[#582A34] text-white"
                              : "hover:border-[#582A34] hover:bg-gray-50"
                          }`}
                        >
                          {size}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                {/* Color Selection */}
                <div>
                  <h3 className="font-medium text-sm mb-1">Color</h3>
                  <RadioGroup
                    value={selectedColor}
                    onValueChange={setSelectedColor}
                    className="flex flex-wrap gap-1.5"
                  >
                    {product.colors.map((color: string) => (
                      <div key={color}>
                        <RadioGroupItem
                          value={color}
                          id={`color-${color}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`color-${color}`}
                          className={`
                            h-9 min-w-9 px-3 flex items-center justify-center rounded-md 
                            border border-gray-200 cursor-pointer text-sm
                            ${selectedColor === color
                              ? "border-[#582A34] ring-1 ring-[#582A34] font-medium"
                              : "hover:border-[#582A34] hover:bg-gray-50"
                            }
                          `}
                        >
                          {color}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              
              {/* Right column: Quantity and Action Buttons */}
              <div className="space-y-3">
                {/* Quantity Selector */}
                <div>
                  <h3 className="font-medium text-sm mb-1">Quantity</h3>
                  <div className="flex items-center border border-gray-200 rounded-md h-10 w-32">
                    <button
                      className="h-full w-10 flex items-center justify-center text-gray-600 hover:text-[#582A34] disabled:opacity-50 disabled:cursor-not-allowed border-r border-gray-200"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center text-sm font-medium">
                      {quantity}
                    </div>
                    <button
                      className="h-full w-10 flex items-center justify-center text-gray-600 hover:text-[#582A34] disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-200"
                      onClick={incrementQuantity}
                      disabled={
                        (stockDetails.status === 'LOW_STOCK' && quantity >= (stockDetails.quantity || 0)) ||
                        (stockDetails.status === 'IN_STOCK' && quantity >= 10)
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-[#582A34] text-[#582A34] hover:bg-[#582A34]/10"
                    onClick={handleCustomize}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#582A34] text-[#582A34] hover:bg-[#582A34]/10"
                    onClick={handleBuyNow}
                    disabled={!selectedSize || !selectedColor || stockDetails.status === 'OUT_OF_STOCK'}
                  >
                    Buy Now
                  </Button>
                </div>
                
                <Button 
                  className="w-full bg-[#582A34] hover:bg-[#582A34]/90 text-white" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || stockDetails.status === 'OUT_OF_STOCK'}
                >
                  Add to Cart
                </Button>
                
                {/* Shipping Info */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TruckIcon className="h-4 w-4" />
                  <span>Free shipping on orders over ₹999</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <RotateCcw className="h-4 w-4" />
                  <span>Easy 15-day returns</span>
                </div>
              </div>
            </div>
            
            {/* Product Tabs */}
            <Tabs defaultValue="description" className="mt-6">
              <TabsList className="w-full border-b border-gray-200 bg-transparent h-auto p-0 justify-start gap-6">
                <TabsTrigger 
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#582A34] data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-[#582A34] px-0 py-2 h-auto"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#582A34] data-[state=active]:bg-transparent text-gray-600 data-[state=active]:text-[#582A34] px-0 py-2 h-auto"
                >
                  Details
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-4">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </TabsContent>
              <TabsContent value="details" className="pt-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="material">
                    <AccordionTrigger className="text-sm font-medium">Material & Care</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>100% Cotton</li>
                        <li>Machine wash cold</li>
                        <li>Tumble dry low</li>
                        <li>Do not bleach</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-sm font-medium">Shipping & Returns</AccordionTrigger>
                    <AccordionContent className="text-sm">
                      <p className="text-gray-600 mb-2">
                        Free standard shipping on orders over ₹999. Delivery within 5-7 business days.
                      </p>
                      <p className="text-gray-600">
                        Easy returns within 15 days of delivery. Items must be unworn, unwashed, and with original tags attached.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-8 md:mt-16">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filteredRelatedProducts.map((relatedProduct) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/product/${relatedProduct.id}`)}
              >
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.name}
                      className="product-image w-full h-[250px] object-cover" 
                    />
                  </div>
                  <div className="mt-3 flex flex-col">
                    <h3 className="font-medium text-sm">{relatedProduct.name}</h3>
                    <p className="font-bold">₹{relatedProduct.price.toString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Add to Cart Button */}
      <div className="block md:hidden">
        <div className="h-16"></div> {/* Spacer to prevent content from being hidden behind sticky bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex items-center gap-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex-1 text-left">
            <p className="font-bold text-[#582A34]">₹{product?.price}</p>
            <p className="text-xs text-gray-500">{selectedSize ? selectedSize : 'Select size'}</p>
          </div>
          <Button 
            className="h-12 px-5 bg-[#582A34] hover:bg-[#582A34]/90 text-white flex-1"
            onClick={handleAddToCart}
            disabled={!selectedSize || stockDetails.status === 'OUT_OF_STOCK'}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
