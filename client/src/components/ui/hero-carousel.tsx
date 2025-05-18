import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fadeIn } from "@/lib/motion";

interface CarouselImage {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
  secondaryLink?: string;
  secondaryLinkText?: string;
}

interface HeroCarouselProps {
  images: CarouselImage[];
  autoplaySpeed?: number;
}

const HeroCarousel = ({ 
  images, 
  autoplaySpeed = 5000 
}: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Pause autoplay on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Autoplay
  useEffect(() => {
    let interval: number;
    
    if (isAutoPlaying) {
      interval = window.setInterval(() => {
        nextSlide();
      }, autoplaySpeed);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentIndex, isAutoPlaying, autoplaySpeed]);

  return (
    <div 
      className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img 
            src={images[currentIndex].src} 
            alt={images[currentIndex].alt} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </motion.div>
      </AnimatePresence>
      
      {/* Text Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16">
        <motion.h1 
          key={`title-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
        >
          {images[currentIndex].title.split('<br>').map((line, i) => (
            <span key={i}>
              {line}
              {i < images[currentIndex].title.split('<br>').length - 1 && <br />}
            </span>
          ))}
        </motion.h1>
        
        <motion.p 
          key={`subtitle-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-white text-sm md:text-base mb-8 max-w-md"
        >
          {images[currentIndex].subtitle}
        </motion.p>
        
        <motion.div 
          key={`buttons-${currentIndex}`}
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
        >
          <Link href={images[currentIndex].link}>
            <motion.a 
              className="bg-black text-white hover:bg-[#582A34] hover:text-white font-bold py-3 px-8 inline-block text-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {images[currentIndex].linkText}
            </motion.a>
          </Link>
          
          {images[currentIndex].secondaryLink && (
            <Link href={images[currentIndex].secondaryLink}>
              <motion.a 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold py-3 px-8 inline-block text-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {images[currentIndex].secondaryLinkText}
              </motion.a>
            </Link>
          )}
        </motion.div>
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full z-10 transition-all duration-200"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full z-10 transition-all duration-200"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      
      {/* Indicator Dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-white scale-125" 
                : "bg-white bg-opacity-50 hover:bg-opacity-75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;