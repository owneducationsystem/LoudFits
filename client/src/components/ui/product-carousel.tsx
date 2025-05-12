import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/ui/product-card";
import { Product } from "@shared/schema";

interface ProductCarouselProps {
  products: Product[];
  title: string;
}

const ProductCarousel = ({ products, title }: ProductCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const maxIndex = Math.max(0, products.length - displayCount);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>
      
      <div className="relative">
        {/* Product Slider Controls */}
        <button 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
          onClick={prevSlide}
          aria-label="Previous slide"
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-[#582A34] hover:text-white transition-colors"
          onClick={nextSlide}
          aria-label="Next slide"
          disabled={currentIndex === maxIndex}
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
      </div>
      
      <div className="mt-8 text-center">
        <a href="/shop" className="border-2 border-black bg-white text-black hover:bg-black hover:text-white font-bold py-3 px-8 inline-block transition-colors">
          VIEW ALL
        </a>
      </div>
    </div>
  );
};

export default ProductCarousel;
