import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/ui/product-card";
import { Product } from "@shared/schema";

interface ProductCarouselProps {
  products: Product[];
  title: string;
  autoScroll?: boolean;
  interval?: number;
}

const ProductCarousel = ({ 
  products, 
  title,
  autoScroll = true,
  interval = 3000 
}: ProductCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDisplayCount(2);
      } else if (width < 1024) {
        setDisplayCount(3);
      } else {
        setDisplayCount(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (autoScroll && !isPaused && products.length > displayCount) {
      autoScrollRef.current = setInterval(() => {
        nextSlide();
      }, interval);
      
      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
        }
      };
    }
  }, [currentIndex, displayCount, isPaused, autoScroll, products.length]);

  const nextSlide = () => {
    if (currentIndex + displayCount < products.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(products.length - displayCount);
    }
  };

  const pauseAutoScroll = () => {
    setIsPaused(true);
  };

  const resumeAutoScroll = () => {
    setIsPaused(false);
  };

  const maxIndex = Math.max(0, products.length - displayCount);

  return (
    <div className="w-full">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">{title}</h2>
      
      {/* Desktop Carousel with Controls */}
      <div 
        className="relative hidden md:block"
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={resumeAutoScroll}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScroll}
      >
        {/* Product Slider Controls */}
        <button 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        {/* Product Slider */}
        <div 
          ref={containerRef}
          className="overflow-hidden px-6"
        >
          <motion.div 
            className="flex transition-transform"
            initial={false}
            animate={{ 
              x: `calc(-${currentIndex * (100 / displayCount)}%)` 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className={cn(
                  "transition-opacity duration-300",
                  `w-1/${displayCount} flex-shrink-0 px-2`
                )}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </motion.div>
        </div>
        
        {/* Desktop Progress Indicator */}
        <div className="flex justify-center mt-4 gap-1.5">
          {Array.from({ length: Math.min(Math.ceil(products.length / displayCount), 5) }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300
                ${i === Math.min(Math.floor(currentIndex / displayCount), 4) ? 'w-6 bg-[#582A34]' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
      
      {/* Mobile Auto-Scrolling Carousel */}
      <div 
        className="md:hidden"
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScroll}
      >
        <div className="mobile-carousel">
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className={`mobile-carousel-item transition-opacity duration-300 ${
                index >= currentIndex && index < currentIndex + 2 ? 'opacity-100' : 'opacity-50'
              }`}
            > 
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Mobile indicator dots */}
        <div className="flex justify-center mt-4 gap-1.5">
          {Array.from({ length: Math.min(Math.ceil(products.length / 2), 5) }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300
                ${i === Math.min(Math.floor(currentIndex / 2), 4) ? 'w-6 bg-[#582A34]' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
      
      <div className="mt-6 md:mt-8 text-center">
        <a href="/shop" className="border-2 border-[#582A34] bg-white text-[#582A34] hover:bg-[#582A34] hover:text-white font-medium py-2.5 px-6 md:py-3 md:px-8 inline-block transition-colors rounded-md">
          VIEW ALL
        </a>
      </div>
    </div>
  );
};

export default ProductCarousel;
