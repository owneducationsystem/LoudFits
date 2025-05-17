import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Heart, 
  TruckIcon, 
  RotateCcw, 
  Ruler,
  Upload,
  Plus,
  Minus,
  Camera
} from "lucide-react";
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

  // No fallback data - only use authenticated data

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
          <div className="relative">
            {/* Main Image */}
            <div className="relative overflow-hidden rounded-md bg-gray-100 h-[350px] xs:h-[450px] md:h-[500px]">
              <div 
                ref={imageRef}
                className={`w-full h-full ${isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`} 
                onClick={() => isZoomed ? resetZoom() : handleZoomIn()}
                onMouseDown={isZoomed ? handleDragStart : undefined}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{ 
                      transform: `scale(${zoomLevel}) translate(${dragPosition.x / (zoomLevel * 10)}px, ${dragPosition.y / (zoomLevel * 10)}px)`,
                      transformOrigin: 'center'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    draggable={false}
                  />
                </AnimatePresence>
              </div>
              
              {/* Zoom controls */}
              {isZoomed && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button 
                    onClick={handleZoomOut}
                    className="p-2 bg-white/80 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
                    aria-label="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={handleZoomIn}
                    className="p-2 bg-white/80 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
                    aria-label="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {/* Navigation Arrows */}
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
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
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xl font-bold text-[#582A34]">₹{product.price.toString()}</p>
                {/* Stock Availability Indicator */}
                <StockIndicator 
                  status={stockDetails.status}
                  quantity={stockDetails.quantity}
                  showQuantity={stockDetails.status === 'LOW_STOCK'}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
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

            <Separator />

            {/* Size Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Select Size</h3>
                <button 
                  className="text-sm flex items-center gap-1 text-gray-600 hover:text-[#582A34] transition-colors"
                  onClick={() => {
                    toast({
                      title: "Size Guide",
                      description: "Size guide information would be displayed here.",
                    });
                  }}
                >
                  <Ruler className="h-4 w-4" />
                  <span>Size Guide</span>
                </button>
              </div>
              <RadioGroup
                value={selectedSize}
                onValueChange={setSelectedSize}
                className="flex flex-wrap gap-2"
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
                      className={`flex items-center justify-center h-10 w-10 border border-gray-300 rounded-md cursor-pointer hover:border-black transition-colors ${
                        selectedSize === size
                          ? "bg-black text-white"
                          : "bg-white text-black"
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
              <h3 className="font-bold mb-2">Select Color</h3>
              <RadioGroup
                value={selectedColor}
                onValueChange={setSelectedColor}
                className="flex flex-wrap gap-2"
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
                      className={`flex items-center justify-center h-10 px-3 border border-gray-300 rounded-md cursor-pointer hover:border-black transition-colors ${
                        selectedColor === color
                          ? "bg-black text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {color}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Quantity Selection */}
            <div>
              <h3 className="font-bold mb-2">Quantity</h3>
              <div className="flex items-center">
                <button
                  onClick={decrementQuantity}
                  className="h-10 w-10 border border-gray-300 rounded-l-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <div className="h-10 w-12 border-t border-b border-gray-300 flex items-center justify-center">
                  {quantity}
                </div>
                <button
                  onClick={incrementQuantity}
                  className="h-10 w-10 border border-gray-300 rounded-r-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-black text-white hover:bg-[#582A34] transition-colors py-6"
                >
                  ADD TO CART
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-[#582A34] text-white hover:bg-black transition-colors py-6"
                >
                  BUY NOW
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCustomize}
                  variant="outline"
                  className="w-full border-black text-black hover:bg-black hover:text-white transition-colors py-6 flex items-center justify-center gap-2"
                >
                  <Upload className="h-5 w-5" />
                  CUSTOMIZE THIS TEE
                </Button>
              </motion.div>
            </div>

            {/* Shipping Info */}
            <div className="flex gap-5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5 text-[#582A34]" />
                <span>Free shipping above ₹1999</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-[#582A34]" />
                <span>30-day returns</span>
              </div>
            </div>

            {/* Product Details Tabs */}
            <Tabs defaultValue="description" className="mt-8">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4">
                <p className="text-gray-700">{product.description}</p>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <ul className="text-gray-700 space-y-2">
                  <li><span className="font-bold">Material:</span> 100% Premium Cotton</li>
                  <li><span className="font-bold">Fit:</span> Regular</li>
                  <li><span className="font-bold">Print:</span> High-quality digital print</li>
                  <li><span className="font-bold">Care:</span> Machine wash cold, inside out</li>
                </ul>
              </TabsContent>

              <TabsContent value="shipping" className="mt-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="shipping">
                    <AccordionTrigger>Shipping Information</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-700">We offer free shipping on all orders above ₹1999. Standard delivery takes 3-5 business days.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="returns">
                    <AccordionTrigger>Return Policy</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-700">We offer a 30-day return policy. Items must be unworn, unwashed, and in their original packaging.</p>
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
            {(isLoadingRelated ? [] : filteredRelatedProducts).map((relatedProduct: Product, index: number) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => {
                    setCurrentImageIndex(0);
                    navigate(`/product/${relatedProduct.id}`);
                  }}
                >
                  <div className="overflow-hidden">
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
            <p className="font-bold text-[#582A34]">₹{product.salePrice || product.price}</p>
            <p className="text-xs text-gray-500">{selectedSize ? selectedSize : 'Select size'}</p>
          </div>
          <Button 
            className="h-12 px-5 bg-[#582A34] hover:bg-[#582A34]/90 text-white flex-1"
            onClick={handleAddToCart}
            disabled={!selectedSize || stockDetails.status === "out-of-stock"}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductDetail;
