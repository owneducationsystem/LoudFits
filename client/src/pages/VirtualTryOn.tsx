import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import * as THREE from "three";
import { useQuery } from "@tanstack/react-query";
import { 
  Camera, 
  ArrowLeft, 
  RotateCcw, 
  ImagePlus,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  MoveVertical,
  RefreshCcw,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

const ARVirtualTryOn = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [tshirtPosition, setTshirtPosition] = useState({ x: 0, y: 0 });
  const [tshirtScale, setTshirtScale] = useState(1);
  const [tshirtRotation, setTshirtRotation] = useState(0);
  const [activeTab, setActiveTab] = useState("position");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Get product data
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });
  
  // Initialize AR
  useEffect(() => {
    if (product && cameraActive && webcamRef.current && canvasRef.current && !isInitialized) {
      initializeAR();
    }
    
    return () => {
      // Cleanup if needed
      if (isInitialized) {
        // Clean up AR resources
      }
    };
  }, [product, cameraActive, webcamRef.current, canvasRef.current]);
  
  // Initialize AR functionality
  const initializeAR = async () => {
    try {
      setIsInitialized(true);
      
      // Start rendering loop
      const renderFrame = () => {
        if (!webcamRef.current || !canvasRef.current || !cameraActive) return;
        
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        
        if (video && canvas) {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Draw the t-shirt overlay with current position, scale, and rotation
          if (product && product.images && product.images.length > 0) {
            drawTShirtOverlay(ctx, tshirtPosition, tshirtScale, tshirtRotation, product.images[0]);
          }
        }
        
        // Continue the render loop if camera is still active
        if (cameraActive) {
          requestAnimationFrame(renderFrame);
        }
      };
      
      // Start the rendering loop
      renderFrame();
      
    } catch (error) {
      console.error("Error initializing AR:", error);
      toast({
        title: "AR Initialization Failed",
        description: "Failed to initialize the AR experience. Please try again.",
        variant: "destructive",
      });
      setIsInitialized(false);
    }
  };
  
  // Function to draw the t-shirt overlay on the canvas
  const drawTShirtOverlay = (
    ctx: CanvasRenderingContext2D, 
    position: { x: number, y: number }, 
    scale: number,
    rotation: number,
    imageUrl: string
  ) => {
    // Create an image element for the t-shirt
    const tshirtImage = new Image();
    tshirtImage.src = imageUrl;
    
    // Draw the t-shirt when image is loaded
    tshirtImage.onload = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      
      // Center the image on the canvas with adjustments from user controls
      const centerX = canvas.width / 2 + position.x;
      const centerY = canvas.height / 2 + position.y;
      
      // Calculate width and height based on scale
      const width = tshirtImage.width * scale;
      const height = tshirtImage.height * scale;
      
      // Save the current context state
      ctx.save();
      
      // Translate to the center point
      ctx.translate(centerX, centerY);
      
      // Rotate
      ctx.rotate(rotation * Math.PI / 180);
      
      // Draw the image centered
      ctx.drawImage(tshirtImage, -width / 2, -height / 2, width, height);
      
      // Restore the context
      ctx.restore();
    };
  };
  
  // Start AR experience
  const startAR = () => {
    setCameraActive(true);
    setShowControls(true);
    setCapturedImage(null);
  };
  
  // Stop AR experience
  const stopAR = () => {
    setCameraActive(false);
    setIsInitialized(false);
  };
  
  // Capture current frame
  const captureImage = () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setCameraActive(false);
      
      toast({
        title: "Image Captured",
        description: "Your virtual try-on image has been captured successfully!",
      });
    } catch (error) {
      console.error("Error capturing image:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture the image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Reset t-shirt position and settings
  const resetTShirt = () => {
    setTshirtPosition({ x: 0, y: 0 });
    setTshirtScale(1);
    setTshirtRotation(0);
  };
  
  // Share captured image
  const shareImage = async () => {
    if (!capturedImage) return;
    
    if (navigator.share) {
      try {
        const blob = await fetch(capturedImage).then(r => r.blob());
        const file = new File([blob], "virtual-try-on.png", { type: "image/png" });
        
        await navigator.share({
          title: `Virtual Try-On - ${product?.name || "Loudfits T-Shirt"}`,
          text: "Check out how this t-shirt looks on me!",
          files: [file]
        });
      } catch (error) {
        console.error("Error sharing:", error);
        toast({
          title: "Share Failed",
          description: "Failed to share the image. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Sharing Not Supported",
        description: "Your browser doesn't support the Web Share API. Try downloading the image instead.",
        variant: "destructive",
      });
    }
  };
  
  // Handle download of captured image
  const downloadImage = () => {
    if (!capturedImage) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `virtual-try-on-${product?.name || "tshirt"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If product is loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate(`/product/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-md" />
      </div>
    );
  }

  // If error or no product found
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The product you're looking for doesn't exist or there was an error loading it.
        </p>
        <Button onClick={() => navigate('/shop')}>
          Return to Shop
        </Button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Virtual Try-On | {product.name}</title>
        <meta name="description" content={`Try on ${product.name} virtually with AR technology`} />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left column - AR View */}
          <div className="w-full md:w-2/3">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="outline" size="icon" onClick={() => navigate(`/product/${id}`)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">
                Virtual Try-On: {product.name}
              </h1>
            </div>
            
            <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
              {cameraActive ? (
                <>
                  {/* Webcam (hidden, used for video feed) */}
                  <Webcam 
                    ref={webcamRef}
                    audio={false}
                    videoConstraints={{
                      facingMode: "user"
                    }}
                    className="absolute inset-0 w-full h-full object-cover opacity-0"
                  />
                  
                  {/* Canvas for AR overlay */}
                  <canvas 
                    ref={canvasRef} 
                    className="w-full h-full object-contain"
                  />
                  
                  {/* AR controls overlay */}
                  {showControls && (
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="icon"
                        onClick={captureImage}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="icon"
                        onClick={resetTShirt}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={stopAR}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                capturedImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={capturedImage} 
                      alt="Virtual Try-On" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <Button 
                        onClick={downloadImage}
                        variant="secondary"
                      >
                        Download
                      </Button>
                      <Button 
                        onClick={shareImage}
                        variant="secondary"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      <Button 
                        onClick={startAR}
                        variant="default"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Camera className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Virtual Try-On</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      See how this t-shirt looks on you using your camera. Adjust the position and size for the best fit.
                    </p>
                    <Button onClick={startAR}>
                      Start Camera
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
          
          {/* Right column - Controls */}
          <div className="w-full md:w-1/3">
            {cameraActive && (
              <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">Adjust T-Shirt</h2>
                <Tabs 
                  defaultValue="position" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="position">
                      <MoveHorizontal className="h-4 w-4 mr-2" />
                      Position
                    </TabsTrigger>
                    <TabsTrigger value="size">
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Size
                    </TabsTrigger>
                    <TabsTrigger value="rotation">
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Rotation
                    </TabsTrigger>
                  </TabsList>

                  {/* Position Controls */}
                  <TabsContent value="position" className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Horizontal Position</Label>
                          <span>{tshirtPosition.x}</span>
                        </div>
                        <Slider
                          value={[tshirtPosition.x]}
                          min={-200}
                          max={200}
                          step={1}
                          onValueChange={(value) => 
                            setTshirtPosition(prev => ({ ...prev, x: value[0] }))
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Vertical Position</Label>
                          <span>{tshirtPosition.y}</span>
                        </div>
                        <Slider
                          value={[tshirtPosition.y]}
                          min={-200}
                          max={200}
                          step={1}
                          onValueChange={(value) => 
                            setTshirtPosition(prev => ({ ...prev, y: value[0] }))
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Size Controls */}
                  <TabsContent value="size" className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Size</Label>
                        <span>{tshirtScale.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[tshirtScale]}
                        min={0.5}
                        max={2}
                        step={0.1}
                        onValueChange={(value) => setTshirtScale(value[0])}
                      />
                    </div>
                  </TabsContent>

                  {/* Rotation Controls */}
                  <TabsContent value="rotation" className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Rotation</Label>
                        <span>{tshirtRotation}°</span>
                      </div>
                      <Slider
                        value={[tshirtRotation]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={(value) => setTshirtRotation(value[0])}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6">
                  <Button 
                    onClick={resetTShirt} 
                    variant="outline" 
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Adjustments
                  </Button>
                </div>
              </div>
            )}
            
            {/* Product info */}
            <div className="mt-6 rounded-lg border p-4">
              <div className="aspect-square rounded-md overflow-hidden mb-4">
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="font-bold text-xl mb-2">₹{product.price.toString()}</p>
              <p className="text-sm text-muted-foreground mb-4">{product.description.substring(0, 100)}...</p>
              <Button 
                onClick={() => navigate(`/product/${id}`)}
                variant="outline" 
                className="w-full"
              >
                View Product Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ARVirtualTryOn;