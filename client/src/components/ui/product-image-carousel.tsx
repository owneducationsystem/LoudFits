import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
  autoRotate?: boolean;
  autoRotateInterval?: number;
}

const ProductImageCarousel = ({ 
  images, 
  productName,
  autoRotate = true,
  autoRotateInterval = 5000
}: ProductImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isPaused, setIsPaused] = useState(false);
  
  // Handle auto-rotation
  useEffect(() => {
    if (!autoRotate || isPaused || isZoomed || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, autoRotateInterval);
    
    return () => clearInterval(interval);
  }, [autoRotate, isPaused, isZoomed, images.length, autoRotateInterval]);
  
  const handleImageClick = () => {
    if (isZoomed) {
      // Reset zoom when clicking while zoomed
      setIsZoomed(false);
      setZoomLevel(1);
      setDragPosition({ x: 0, y: 0 });
    } else {
      // Initiate zoom
      setIsZoomed(true);
      setZoomLevel(1.5);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.5, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel((prevZoom) => {
      const newZoom = Math.max(prevZoom - 0.5, 1);
      if (newZoom === 1) {
        setIsZoomed(false);
        setDragPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed && zoomLevel > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      
      // Calculate the relative position of the mouse within the container
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the center of the container
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate the displacement from the center (limited range)
      const maxDisplacement = 100;
      const displacementX = Math.max(-maxDisplacement, Math.min(maxDisplacement, (x - centerX) / 2));
      const displacementY = Math.max(-maxDisplacement, Math.min(maxDisplacement, (y - centerY) / 2));
      
      setDragPosition({ x: displacementX, y: displacementY });
    }
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsPaused(true);
    // Resume auto-rotation after 5 seconds of inactivity
    setTimeout(() => setIsPaused(false), 5000);
  };
  
  const handleMouseEnter = () => {
    setIsPaused(true);
  };
  
  const handleMouseLeave = () => {
    setIsPaused(false);
    if (isZoomed) {
      setIsZoomed(false);
      setZoomLevel(1);
      setDragPosition({ x: 0, y: 0 });
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div 
        className={`relative w-full aspect-square bg-gray-100 overflow-hidden rounded-md ${isZoomed ? "cursor-move" : "cursor-zoom-in"}`}
        onClick={handleImageClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImageIndex}
            src={images[currentImageIndex]} 
            alt={`${productName} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ 
              transform: `scale(${zoomLevel}) translate(${dragPosition.x / (zoomLevel * 10)}px, ${dragPosition.y / (zoomLevel * 10)}px)`,
              transformOrigin: 'center'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            draggable={false}
          />
        </AnimatePresence>
        
        {/* Zoom controls */}
        {isZoomed && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-2 bg-white/80 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-2 bg-white/80 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`View image ${index + 1}`}
              className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                currentImageIndex === index 
                  ? "border-2 border-[#582A34] scale-105" 
                  : "border border-gray-200 opacity-70 hover:opacity-100"
              }`}
            >
              <img 
                src={image} 
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="w-full h-full object-cover" 
              />
            </button>
          ))}
        </div>
      )}
      
      {/* Indicator dots (only shown on mobile when there are multiple images) */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {images.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => handleThumbnailClick(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentImageIndex === index 
                  ? "bg-[#582A34] scale-110" 
                  : "bg-gray-300"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageCarousel;