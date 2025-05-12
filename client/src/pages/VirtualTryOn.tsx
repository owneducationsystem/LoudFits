import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Webcam from "react-webcam";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowLeft, 
  Camera, 
  Maximize, 
  Minimize, 
  RotateCw, 
  Share2,
  Download,
  RefreshCw
} from "lucide-react";
import { Product } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const VirtualTryOn = () => {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // T-shirt positioning state
  const [tShirtScale, setTShirtScale] = useState<number>(50);
  const [tShirtPosition, setTShirtPosition] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [tShirtRotation, setTShirtRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Get product data
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: ({ signal }) => 
      fetch(`/api/products/${id}`, { signal }).then(res => {
        if (!res.ok) throw new Error("Failed to fetch product");
        return res.json();
      }),
  });
  
  // Handle back button
  const handleBack = () => {
    if (capturedImage) {
      setCapturedImage(null);
    } else {
      navigate(`/product/${id}`);
    }
  };
  
  // Handle camera capture
  const captureImage = () => {
    if (!webcamRef.current) return;
    
    setIsCapturing(true);
    const imageSrc = webcamRef.current.getScreenshot();
    
    // Draw the t-shirt on the canvas
    if (canvasRef.current && imageSrc) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Load the captured image
        const img = new Image();
        img.onload = () => {
          // Draw the background
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Draw the t-shirt
          if (product?.images && product.images.length > 0) {
            const tShirtImg = new Image();
            tShirtImg.onload = () => {
              // Calculate positioning
              const scale = tShirtScale / 100;
              const tShirtWidth = canvas.width * scale;
              const tShirtHeight = (tShirtImg.height / tShirtImg.width) * tShirtWidth;
              
              const posX = (canvas.width * tShirtPosition.x / 100) - (tShirtWidth / 2);
              const posY = (canvas.height * tShirtPosition.y / 100) - (tShirtHeight / 2);
              
              // Save context for rotation
              ctx.save();
              
              // Translate to the center of where we want to draw the image
              ctx.translate(
                posX + tShirtWidth / 2,
                posY + tShirtHeight / 2
              );
              
              // Rotate the canvas around that point
              ctx.rotate((tShirtRotation * Math.PI) / 180);
              
              // Draw the t-shirt
              ctx.drawImage(
                tShirtImg,
                -tShirtWidth / 2,
                -tShirtHeight / 2,
                tShirtWidth,
                tShirtHeight
              );
              
              // Restore the context
              ctx.restore();
              
              // Add product info and branding
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
              
              ctx.fillStyle = "white";
              ctx.font = "bold 16px sans-serif";
              ctx.fillText(`${product.name} - ${product.price}`, 10, canvas.height - 15);
              
              ctx.fillStyle = "white";
              ctx.font = "12px sans-serif";
              ctx.textAlign = "right";
              ctx.fillText("Loudfits Virtual Try-On", canvas.width - 10, canvas.height - 15);
              
              // Set the captured image
              setCapturedImage(canvas.toDataURL("image/png"));
              setIsCapturing(false);
            };
            tShirtImg.src = product.images[0];
          }
        };
        img.src = imageSrc;
      }
    }
  };
  
  // Handle share functionality
  const shareImage = async () => {
    if (!capturedImage) return;
    
    try {
      if (navigator.share) {
        const blob = await fetch(capturedImage).then(r => r.blob());
        const file = new File([blob], "loudfits-try-on.png", { type: "image/png" });
        
        await navigator.share({
          title: `${product?.name} Virtual Try-On`,
          text: "Check out how this t-shirt looks on me!",
          files: [file]
        });
        
        toast({
          title: "Shared Successfully",
          description: "Your virtual try-on has been shared!",
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        toast({
          title: "Share Not Supported",
          description: "Your browser doesn't support direct sharing. Try downloading the image instead.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share Failed",
        description: "Could not share the image. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle download functionality
  const downloadImage = () => {
    if (!capturedImage) return;
    
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `loudfits-${product?.name.toLowerCase().replace(/\s+/g, "-")}-try-on.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Complete",
      description: "Your virtual try-on image has been downloaded.",
    });
  };
  
  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate new position as percentage of container width/height
    const container = e.currentTarget.getBoundingClientRect();
    const deltaXPercent = (deltaX / container.width) * 100;
    const deltaYPercent = (deltaY / container.height) * 100;
    
    setTShirtPosition({
      x: Math.max(0, Math.min(100, tShirtPosition.x + deltaXPercent)),
      y: Math.max(0, Math.min(100, tShirtPosition.y + deltaYPercent))
    });
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    
    // Calculate new position as percentage of container width/height
    const container = e.currentTarget.getBoundingClientRect();
    const deltaXPercent = (deltaX / container.width) * 100;
    const deltaYPercent = (deltaY / container.height) * 100;
    
    setTShirtPosition({
      x: Math.max(0, Math.min(100, tShirtPosition.x + deltaXPercent)),
      y: Math.max(0, Math.min(100, tShirtPosition.y + deltaYPercent))
    });
    
    setDragStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleTouchEnd = () => {
    setIsDragging(false);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
  
  // Reset camera
  const resetCamera = () => {
    setCapturedImage(null);
    setTShirtScale(50);
    setTShirtPosition({ x: 50, y: 50 });
    setTShirtRotation(0);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading virtual try-on...</p>
        </div>
      </div>
    );
  }
  
  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">We couldn't load the virtual try-on experience. Please try again later.</p>
          <Button onClick={() => navigate(`/product/${id}`)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6">
      <Helmet>
        <title>Virtual Try On - {product.name} | Loudfits</title>
        <meta name="description" content={`Try on ${product.name} virtually using your camera. See how this Loudfits t-shirt looks on you before buying.`} />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={handleBack} 
            variant="ghost" 
            className="flex items-center text-lg font-medium"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {capturedImage ? 'Back to Camera' : 'Back to Product'}
          </Button>
          
          <h1 className="text-xl font-bold text-center">
            Virtual Try-On
          </h1>
          
          <div className="w-[100px]"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Product Info */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded overflow-hidden mr-4">
              <img 
                src={product.images?.[0] || ''} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg">{product.name}</h2>
              <p className="text-[#582A34] font-medium">{product.price}</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Camera View / Captured Image */}
          <div 
            className="relative bg-black w-full" 
            style={{ height: "60vh", maxHeight: "600px" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {!capturedImage ? (
              <>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  onUserMedia={() => setCameraReady(true)}
                  videoConstraints={{
                    facingMode: "user"
                  }}
                />
                
                {/* T-shirt Overlay */}
                {product.images && product.images.length > 0 && (
                  <div 
                    className="absolute pointer-events-none"
                    style={{
                      width: `${tShirtScale}%`,
                      left: `${tShirtPosition.x}%`,
                      top: `${tShirtPosition.y}%`,
                      transform: `translate(-50%, -50%) rotate(${tShirtRotation}deg)`
                    }}
                  >
                    <img 
                      src={product.images[0]} 
                      alt="T-shirt overlay" 
                      className="w-full h-auto"
                      style={{ opacity: 0.9 }}
                    />
                  </div>
                )}
                
                {/* Drag Instruction */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  Drag to position
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img 
                  src={capturedImage} 
                  alt="Captured virtual try-on" 
                  className="max-w-full max-h-full"
                />
              </div>
            )}
          </div>
          
          {/* Canvas for image processing - hidden */}
          <canvas 
            ref={canvasRef} 
            width={1280} 
            height={720} 
            className="hidden"
          />
          
          {/* Controls */}
          <div className="p-4 bg-white">
            {!capturedImage ? (
              <>
                {/* Camera Controls */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Size</span>
                    <span className="text-sm text-gray-500">{tShirtScale}%</span>
                  </div>
                  <Slider
                    value={[tShirtScale]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={(values) => setTShirtScale(values[0])}
                    className="mb-4"
                  />
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Rotation</span>
                    <span className="text-sm text-gray-500">{tShirtRotation}°</span>
                  </div>
                  <Slider
                    value={[tShirtRotation]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={(values) => setTShirtRotation(values[0])}
                    className="mb-4"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={resetCamera} 
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Reset
                  </Button>
                  
                  <Button 
                    onClick={captureImage}
                    disabled={!cameraReady || isCapturing}
                    className="bg-[#582A34] hover:bg-black text-white flex items-center justify-center gap-2"
                  >
                    <Camera className="h-5 w-5" />
                    {isCapturing ? 'Processing...' : 'Capture'}
                  </Button>
                </div>
              </>
            ) : (
              /* Share & Download Buttons */
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={shareImage} 
                  className="bg-black hover:bg-gray-800 text-white flex items-center justify-center gap-2"
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
                
                <Button 
                  onClick={downloadImage}
                  className="bg-[#582A34] hover:bg-[#47222b] text-white flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 text-sm text-gray-500 text-center">
          <p>This virtual try-on feature uses your camera to simulate how the t-shirt might look on you. 
          The actual product may differ slightly in appearance. No images are stored on our servers.</p>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;