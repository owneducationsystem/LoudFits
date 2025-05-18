import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

interface CarouselImage {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  link?: string;
  linkText?: string;
  secondaryLink?: string;
  secondaryLinkText?: string;
}

interface AutoCarouselProps {
  images: CarouselImage[];
  autoplaySpeed?: number; 
  showDots?: boolean;
  height?: string;
  className?: string;
}

const AutoCarousel = ({
  images,
  autoplaySpeed = 4000,
  showDots = true,
  height = "h-[60vh] md:h-[80vh]",
  className = ""
}: AutoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Handle autoplay
  useEffect(() => {
    if (isPaused || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, autoplaySpeed);
    
    return () => clearInterval(interval);
  }, [isPaused, images.length, autoplaySpeed]);

  // Pause autoplay on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div 
      className={`relative overflow-hidden bg-black ${height} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Preload images in background */}
      <div className="hidden">
        {images.map((image, i) => (
          <img key={`preload-${i}`} src={image.src} alt="Preload" />
        ))}
      </div>
      
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <motion.img 
            src={images[currentIndex].src} 
            alt={images[currentIndex].alt} 
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ 
              scale: 1.05,
              transition: { duration: 8, ease: "easeInOut" }
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* Text Content (if provided) */}
          {images[currentIndex].title && (
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16">
              <motion.h1 
                key={`title-${currentIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
                dangerouslySetInnerHTML={{ __html: images[currentIndex].title || '' }}
              />
              
              {images[currentIndex].subtitle && (
                <motion.p 
                  key={`subtitle-${currentIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                  className="text-white text-sm md:text-base mb-8 max-w-md"
                >
                  {images[currentIndex].subtitle}
                </motion.p>
              )}
              
              {(images[currentIndex].link || images[currentIndex].secondaryLink) && (
                <motion.div 
                  key={`buttons-${currentIndex}`}
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.7 }}
                >
                  {images[currentIndex].link && (
                    <Link href={images[currentIndex].link}>
                      <motion.a 
                        className="bg-black text-white hover:bg-[#582A34] hover:text-white font-bold py-3 px-8 inline-block text-center transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {images[currentIndex].linkText || 'SHOP NOW'}
                      </motion.a>
                    </Link>
                  )}
                  
                  {images[currentIndex].secondaryLink && (
                    <Link href={images[currentIndex].secondaryLink}>
                      <motion.a 
                        className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold py-3 px-8 inline-block text-center transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {images[currentIndex].secondaryLinkText || 'LEARN MORE'}
                      </motion.a>
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Indicator Dots */}
      {showDots && images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "bg-white scale-125" 
                  : "bg-white bg-opacity-50 hover:bg-opacity-75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoCarousel;