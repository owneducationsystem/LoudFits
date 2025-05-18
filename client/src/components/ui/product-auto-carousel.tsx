import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductAutoCarouselProps {
  images: string[];
  productName: string;
  autoplaySpeed?: number;
}

export default function ProductAutoCarousel({ 
  images, 
  productName,
  autoplaySpeed = 5000 
}: ProductAutoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Auto-rotation
  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, autoplaySpeed);
    
    return () => clearInterval(interval);
  }, [isPaused, images.length, autoplaySpeed]);

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Handle thumbnail click
  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center rounded-md">
        <div className="text-gray-400">No image available</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main carousel image */}
      <div 
        className="relative w-full aspect-square bg-gray-100 overflow-hidden rounded-md"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Preload images */}
        <div className="hidden">
          {images.map((src, i) => (
            <img key={`preload-${i}`} src={src} alt="Loading" />
          ))}
        </div>
        
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <img 
              src={images[currentIndex]} 
              alt={`${productName} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
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
                currentIndex === index 
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
      
      {/* Indicator dots (on mobile) */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {images.map((_, index) => (
            <button
              key={`indicator-${index}`}
              onClick={() => handleThumbnailClick(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentIndex === index 
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
}