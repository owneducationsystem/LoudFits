import { useState, useRef, ChangeEvent } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Shirt, Upload, X, Undo, Check } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartContext } from "@/context/CartContext";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const Customize = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCartContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse product ID from URL if available
  const searchParams = new URLSearchParams(window.location.search);
  const productId = searchParams.get("productId");

  // State for customization
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("White");
  const [quantity, setQuantity] = useState(1);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [verticalPosition, setVerticalPosition] = useState([50]); // Vertical position - 0 to 100
  const [horizontalPosition, setHorizontalPosition] = useState([50]); // Horizontal position - 0 to 100
  const [imageSize, setImageSize] = useState([50]); // 50% size - 0 to 100
  const [rotation, setRotation] = useState([0]); // Rotation angle in degrees
  const [isFlipped, setIsFlipped] = useState(false); // Whether the image is flipped horizontally
  const [view, setView] = useState<'front' | 'back'>('front'); // Current view - front or back
  const [frontImage, setFrontImage] = useState<string | null>(null); // Image for front side
  const [backImage, setBackImage] = useState<string | null>(null); // Image for back side
  const [frontPosition, setFrontPosition] = useState({ vertical: 50, horizontal: 50, size: 50, rotation: 0, flipped: false });
  const [backPosition, setBackPosition] = useState({ vertical: 50, horizontal: 50, size: 50, rotation: 0, flipped: false });
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch product if ID is provided
  const { data: product } = useQuery<Product>({
    queryKey: productId ? [`/api/products/${productId}`] : [],
    enabled: !!productId,
  });

  // Color options based on the color selected
  const tshirtColors = [
    { name: "White", hex: "#FFFFFF", border: "border-gray-300" },
    { name: "Black", hex: "#000000", border: "border-black" },
    { name: "Gray", hex: "#808080", border: "border-gray-500" },
    { name: "Navy", hex: "#000080", border: "border-blue-900" },
    { name: "Red", hex: "#FF0000", border: "border-red-600" },
  ];
  
  // Available sizes
  const availableSizes = ["S", "M", "L", "XL", "XXL"];

  // Handle file upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      
      if (side === 'front') {
        setFrontImage(imageData);
        // Legacy state update for compatibility
        setUploadedImage(imageData);
      } else {
        setBackImage(imageData);
      }
      
      setIsLoading(false);
      // Set the view to the side we just uploaded
      setView(side);
    };
    reader.readAsDataURL(file);
  };

  // Clear uploaded image
  const clearImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontImage(null);
      setUploadedImage(null); // Legacy state update
    } else {
      setBackImage(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Reset position, size, rotation and flip
  const resetCustomization = (side: 'front' | 'back' = 'front') => {
    // Always update the legacy state for compatibility
    setVerticalPosition([50]);
    setHorizontalPosition([50]);
    setImageSize([50]);
    setRotation([0]);
    setIsFlipped(false);
    
    // Update the correct side's state
    if (side === 'front') {
      setFrontPosition({
        vertical: 50,
        horizontal: 50,
        size: 50,
        rotation: 0,
        flipped: false
      });
    } else {
      setBackPosition({
        vertical: 50,
        horizontal: 50,
        size: 50,
        rotation: 0,
        flipped: false
      });
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedImage) {
      toast({
        title: "Please upload an image",
        description: "You need to upload a design to customize your t-shirt",
        variant: "destructive",
      });
      return;
    }

    // If we have a product from the query, use it, otherwise create a basic custom product
    const baseProduct = product || {
      id: 999, // Custom product placeholder ID
      name: "Custom T-shirt",
      description: "Your custom designed t-shirt",
      price: "999" as any,
      category: "custom",
      gender: "unisex",
      sizes: availableSizes,
      colors: tshirtColors.map(c => c.name),
      images: [],
      trending: false,
      featured: false,
      collection: null,
      inStock: true
    };

    // Add custom product to cart
    addToCart({
      productId: baseProduct.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
      product: baseProduct,
      customization: {
        frontImage: frontImage || uploadedImage,
        backImage: backImage,
        verticalPosition: verticalPosition[0],
        horizontalPosition: horizontalPosition[0],
        size: imageSize[0],
        rotation: rotation[0],
        flipped: isFlipped,
        frontDesign: frontImage ? {
          vertical: frontPosition.vertical,
          horizontal: frontPosition.horizontal,
          size: frontPosition.size,
          rotation: frontPosition.rotation,
          flipped: frontPosition.flipped
        } : null,
        backDesign: backImage ? {
          vertical: backPosition.vertical,
          horizontal: backPosition.horizontal,
          size: backPosition.size,
          rotation: backPosition.rotation,
          flipped: backPosition.flipped
        } : null
      }
    });

    toast({
      title: "Added to cart",
      description: "Your custom t-shirt has been added to your cart.",
    });

    navigate("/cart");
  };

  // Increment quantity
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  // Decrement quantity
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <>
      <Helmet>
        <title>Customize Your Tee - Loudfits</title>
        <meta name="description" content="Create your own custom t-shirt design. Upload your image, choose your colors, and make a t-shirt that's uniquely yours." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">CUSTOMIZE YOUR TEE</h1>
          <p className="text-gray-600 mt-2">
            Upload your design, adjust the placement, and create a tee that's uniquely yours.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Preview Section */}
          <div className="flex flex-col items-center">
            {/* Front/Back Toggle */}
            <div className="mb-4 flex justify-center">
              <div className="bg-gray-100 rounded-full p-1 flex">
                <button
                  className={`py-2 px-4 rounded-full transition-colors ${
                    view === 'front' 
                      ? 'bg-white shadow-md text-black' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setView('front')}
                >
                  Front View
                </button>
                <button
                  className={`py-2 px-4 rounded-full transition-colors ${
                    view === 'back' 
                      ? 'bg-white shadow-md text-black' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setView('back')}
                >
                  Back View
                </button>
              </div>
            </div>
            
            {/* T-shirt Preview */}
            <div 
              className="relative w-full max-w-md h-[500px] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: tshirtColors.find(c => c.name === selectedColor)?.hex || "#FFFFFF" }}
            >
              {/* T-shirt silhouette SVG */}
              <svg
                className="absolute top-0 left-0 w-full h-full"
                viewBox="0 0 300 400"
                style={{ 
                  fill: "none", 
                  stroke: selectedColor === "White" ? "#e5e5e5" : "#ffffff20", 
                  strokeWidth: "2"
                }}
              >
                {view === 'front' ? (
                  <>
                    <path d="M100,50 L60,80 L60,150 L30,150 L50,350 L250,350 L270,150 L240,150 L240,80 L200,50 L180,20 L120,20 L100,50 Z" />
                    <path d="M100,50 L150,60 L200,50" />
                  </>
                ) : (
                  <>
                    <path d="M100,50 L60,80 L60,150 L30,150 L50,350 L250,350 L270,150 L240,150 L240,80 L200,50 L180,20 L120,20 L100,50 Z" />
                  </>
                )}
              </svg>
              
              {/* Side label indicator */}
              <div 
                className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs font-bold"
              >
                {view === 'front' ? 'FRONT' : 'BACK'}
              </div>
              
              {/* Uploaded Image - Front */}
              {view === 'front' && frontImage && (
                <motion.div
                  className="absolute"
                  style={{ 
                    top: `${verticalPosition[0]}%`,
                    left: `${horizontalPosition[0]}%`,
                    transform: `translate(-50%, -50%) scale(${imageSize[0] / 50}) rotate(${rotation[0]}deg) ${isFlipped ? 'scaleX(-1)' : ''}`,
                    maxWidth: "60%",
                    maxHeight: "60%"
                  }}
                  drag
                  dragConstraints={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                  }}
                  onDragEnd={(e, info) => {
                    // Update position based on drag end position
                    const target = e.target as HTMLDivElement;
                    const container = target.parentElement;
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      const x = (info.point.x - rect.left) / rect.width * 100;
                      const y = (info.point.y - rect.top) / rect.height * 100;
                      
                      // Constrain within safe boundaries (20-80%)
                      const safeX = Math.max(20, Math.min(80, x));
                      const safeY = Math.max(20, Math.min(80, y));
                      
                      setHorizontalPosition([safeX]);
                      setVerticalPosition([safeY]);
                      
                      // Update front position state
                      setFrontPosition({
                        ...frontPosition,
                        vertical: safeY,
                        horizontal: safeX
                      });
                    }
                  }}
                >
                  <img
                    src={frontImage}
                    alt="Your front design"
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              )}
              
              {/* Uploaded Image - Back */}
              {view === 'back' && backImage && (
                <motion.div
                  className="absolute"
                  style={{ 
                    top: `${backPosition.vertical}%`,
                    left: `${backPosition.horizontal}%`,
                    transform: `translate(-50%, -50%) scale(${backPosition.size / 50}) rotate(${backPosition.rotation}deg) ${backPosition.flipped ? 'scaleX(-1)' : ''}`,
                    maxWidth: "60%",
                    maxHeight: "60%"
                  }}
                  drag
                  dragConstraints={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                  }}
                  onDragEnd={(e, info) => {
                    // Update position based on drag end position
                    const target = e.target as HTMLDivElement;
                    const container = target.parentElement;
                    if (container) {
                      const rect = container.getBoundingClientRect();
                      const x = (info.point.x - rect.left) / rect.width * 100;
                      const y = (info.point.y - rect.top) / rect.height * 100;
                      
                      // Constrain within safe boundaries (20-80%)
                      const safeX = Math.max(20, Math.min(80, x));
                      const safeY = Math.max(20, Math.min(80, y));
                      
                      // Update back position state
                      setBackPosition({
                        ...backPosition,
                        vertical: safeY,
                        horizontal: safeX
                      });
                    }
                  }}
                >
                  <img
                    src={backImage}
                    alt="Your back design"
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              )}
              
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Skeleton className="h-32 w-32 rounded-full" />
                </div>
              )}
              
              {/* Empty state prompt - based on current view */}
              {((view === 'front' && !frontImage) || (view === 'back' && !backImage)) && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6" style={{ color: selectedColor === "White" ? "#000000" : "#FFFFFF" }}>
                  <Upload className="h-12 w-12 mb-4 opacity-70" />
                  <p className="text-lg font-semibold opacity-70">
                    Upload your {view} design
                  </p>
                  <p className="text-sm opacity-50">
                    Your image will appear here
                  </p>
                </div>
              )}
            </div>
            
            {/* Color selector */}
            <div className="mt-8">
              <h3 className="font-bold mb-3 text-center">Select T-shirt Color</h3>
              <RadioGroup
                value={selectedColor}
                onValueChange={setSelectedColor}
                className="flex flex-wrap justify-center gap-3"
              >
                {tshirtColors.map((color) => (
                  <div key={color.name}>
                    <RadioGroupItem
                      value={color.name}
                      id={`color-${color.name}`}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={`color-${color.name}`}
                      className={`flex flex-col items-center gap-1 cursor-pointer`}
                    >
                      <div 
                        className={`h-8 w-8 rounded-full border ${color.border} ${selectedColor === color.name ? 'ring-2 ring-offset-2 ring-[#582A34]' : ''}`}
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs">{color.name}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          
          {/* Customization Controls */}
          <div className="flex flex-col">
            <Tabs defaultValue="design" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="sizing">Size & Quantity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="design" className="space-y-6 pt-4">
                {/* Upload Button */}
                <div>
                  <h3 className="font-bold mb-3">Upload {view === 'front' ? 'Front' : 'Back'} Design</h3>
                  <div className="flex gap-3">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, view)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-black hover:bg-[#582A34]"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {view === 'front' ? 'Front' : 'Back'} Image
                    </Button>
                    
                    {(view === 'front' && frontImage) || (view === 'back' && backImage) ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => clearImage(view)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Max file size: 5MB. Supported formats: JPG, PNG, SVG
                  </p>
                </div>
                
                {/* Adjustments (only displayed if image is uploaded) */}
                {uploadedImage && (
                  <>
                    {/* Image Size Slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Design Size</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetCustomization}
                          className="h-8 text-sm text-gray-500 hover:text-black"
                        >
                          <Undo className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                      <Slider
                        value={imageSize}
                        onValueChange={setImageSize}
                        min={10}
                        max={100}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Smaller</span>
                        <span>Larger</span>
                      </div>
                    </div>
                    
                    {/* Vertical Position Slider */}
                    <div>
                      <h3 className="font-bold mb-2">Vertical Position</h3>
                      <Slider
                        value={verticalPosition}
                        onValueChange={setVerticalPosition}
                        min={20}
                        max={80}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Higher</span>
                        <span>Lower</span>
                      </div>
                    </div>
                    
                    {/* Horizontal Position Slider */}
                    <div>
                      <h3 className="font-bold mb-2">Horizontal Position</h3>
                      <Slider
                        value={horizontalPosition}
                        onValueChange={setHorizontalPosition}
                        min={20}
                        max={80}
                        step={1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Left</span>
                        <span>Right</span>
                      </div>
                    </div>
                    
                    {/* Rotation Slider */}
                    <div>
                      <h3 className="font-bold mb-2">Rotation</h3>
                      <Slider
                        value={rotation}
                        onValueChange={setRotation}
                        min={0}
                        max={360}
                        step={5}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0°</span>
                        <span>360°</span>
                      </div>
                    </div>
                    
                    {/* Flip Button */}
                    <div>
                      <h3 className="font-bold mb-2">Flip Design</h3>
                      <Button
                        type="button"
                        variant={isFlipped ? "default" : "outline"}
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M9 3H3v6"></path>
                          <path d="M21 13v6h-6"></path>
                          <path d="M3 3l6 6"></path>
                          <path d="M15 15l6 6"></path>
                          <path d="M21 3v6"></path>
                          <path d="M3 13v6"></path>
                          <path d="M21 9l-6-6"></path>
                          <path d="M9 15l-6 6"></path>
                        </svg>
                        {isFlipped ? "Flipped Horizontally" : "Flip Horizontally"}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      <span className="font-bold">Pro tip:</span> You can also drag your design to position it exactly where you want it on the t-shirt.
                    </p>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="sizing" className="space-y-6 pt-4">
                {/* Size Selection */}
                <div>
                  <h3 className="font-bold mb-3">Select Size</h3>
                  <RadioGroup
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                    className="flex flex-wrap gap-2"
                  >
                    {availableSizes.map((size) => (
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
                
                {/* Quantity Selection */}
                <div>
                  <h3 className="font-bold mb-3">Quantity</h3>
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
                
                {/* Price Info */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span>Base Price:</span>
                    <span className="font-semibold">₹999</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Custom Design:</span>
                    <span className="font-semibold">₹0</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>₹{999 * quantity}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Add to Cart Button */}
            <motion.div 
              className="mt-8"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleAddToCart}
                className="w-full bg-[#582A34] text-white hover:bg-black transition-colors py-6 text-lg"
                disabled={!uploadedImage || !selectedSize}
              >
                <Check className="h-5 w-5 mr-2" />
                ADD TO CART
              </Button>
            </motion.div>
            
            {/* Information Notes */}
            <div className="mt-6 text-sm text-gray-600 space-y-2">
              <p className="flex items-start gap-2">
                <Shirt className="h-5 w-5 flex-shrink-0 text-[#582A34]" />
                <span>Our customizable t-shirts are made of premium 100% cotton fabric for comfort and durability.</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="h-5 w-5 flex-shrink-0 text-[#582A34]" />
                <span>Your design will be printed with high-quality digital printing that ensures vibrant, long-lasting colors.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Customize;
