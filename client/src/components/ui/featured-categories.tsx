import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CategoryCard from "@/components/ui/category-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

const FeaturedCategories = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch all products from the database
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Extract unique categories from products
  const productCategories = products ? 
    Array.from(new Set(products.map(product => product.category)))
      .filter(Boolean)
      .map((category, index) => {
        // Use the first product image from this category as the category image
        const productsInCategory = products.filter(p => p.category === category);
        const image = productsInCategory[0]?.images[0] || "";
        
        return {
          image: image,
          title: category?.toUpperCase().replace(/-/g, " ") || "",
          link: `/shop?category=${category}`
        };
      }).slice(0, 3) : []; // Get up to 3 categories for better scrolling
      
  // Always add the customize option
  const categories = [
    ...productCategories,
    {
      image: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "CUSTOMIZE YOUR TEE",
      link: "/customize"
    }
  ];
  
  // Auto-scroll functionality for mobile carousel
  useEffect(() => {
    if (!isPaused && categories.length > 1) {
      autoScrollRef.current = setInterval(() => {
        nextSlide();
      }, 4000);
      
      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
        }
      };
    }
  }, [currentIndex, isPaused, categories.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === categories.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    );
  };

  const pauseAutoScroll = () => {
    setIsPaused(true);
  };

  const resumeAutoScroll = () => {
    setIsPaused(false);
  };

  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          FEATURED CATEGORIES
        </motion.h2>
        
        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-md" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
        ) : (
          <>
            {/* Desktop Grid Layout */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {categories.map((category, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <CategoryCard
                    image={category.image}
                    title={category.title}
                    link={category.link}
                  />
                </motion.div>
              ))}
            </div>
            
            {/* Mobile Auto-Scrolling Carousel */}
            <div 
              className="md:hidden relative"
              onTouchStart={pauseAutoScroll}
              onTouchEnd={resumeAutoScroll}
            >
              {/* Navigation arrows */}
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 p-2 rounded-full shadow-md text-gray-700"
                onClick={prevSlide}
                aria-label="Previous category"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 p-2 rounded-full shadow-md text-gray-700"
                onClick={nextSlide}
                aria-label="Next category"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              {/* Carousel container */}
              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  initial={false}
                  animate={{ x: `-${currentIndex * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {categories.map((category, index) => (
                    <div 
                      key={index}
                      className="w-full flex-shrink-0 px-1"
                    >
                      <CategoryCard
                        image={category.image}
                        title={category.title}
                        link={category.link}
                      />
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Indicator dots */}
              <div className="flex justify-center mt-4 gap-1.5">
                {categories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'w-6 bg-[#582A34]' : 'w-2 bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
