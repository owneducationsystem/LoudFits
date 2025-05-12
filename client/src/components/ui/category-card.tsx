import { Link } from "wouter";
import { motion } from "framer-motion";

interface CategoryCardProps {
  image: string;
  title: string;
  link: string;
  fullWidth?: boolean;
}

const CategoryCard = ({ image, title, link, fullWidth = false }: CategoryCardProps) => {
  return (
    <div className={`relative group cursor-pointer overflow-hidden ${fullWidth ? 'md:col-span-2' : ''}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <img 
          src={image} 
          alt={title} 
          className={`w-full ${fullWidth ? 'h-[300px] md:h-[400px]' : 'h-[300px]'} object-cover`} 
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center">
          <h3 className="text-white text-2xl md:text-3xl font-bold mb-4">{title}</h3>
          <Link href={link}>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black hover:bg-[#582A34] hover:text-white py-2 px-6 font-medium transition-colors"
            >
              {title.includes("COLLECTION") ? "EXPLORE" : "SHOP NOW"}
            </motion.a>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default CategoryCard;
