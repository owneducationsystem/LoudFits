import { Link } from "wouter";
import { motion } from "framer-motion";
import { staggerContainer, fadeIn } from "@/lib/motion";

interface HeroSectionProps {
  image: string;
  title: string;
  subtitle: string;
}

const HeroSection = ({ image, title, subtitle }: HeroSectionProps) => {
  return (
    <section className="relative">
      <div className="w-full h-[60vh] md:h-[80vh] overflow-hidden relative">
        <img 
          src={image} 
          alt="Model wearing Loudfits t-shirt" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <motion.div 
          className="absolute inset-0 flex flex-col justify-center px-6 md:px-16"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h1 
            className="text-white text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
            variants={fadeIn("up", "tween", 0.2, 1)}
          >
            {title.split('<br>').map((line, i) => (
              <span key={i}>
                {line}
                {i < title.split('<br>').length - 1 && <br />}
              </span>
            ))}
          </motion.h1>
          
          <motion.p 
            className="text-white text-sm md:text-base mb-8 max-w-md"
            variants={fadeIn("up", "tween", 0.4, 1)}
          >
            {subtitle}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4"
            variants={fadeIn("up", "tween", 0.6, 1)}
          >
            <Link href="/shop">
              <motion.a 
                className="bg-black text-white hover:bg-[#582A34] hover:text-white font-bold py-3 px-8 inline-block text-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                SHOP NOW
              </motion.a>
            </Link>
            <Link href="/shop?category=printed-tees">
              <motion.a 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold py-3 px-8 inline-block text-center transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                PRINTED TEES
              </motion.a>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
