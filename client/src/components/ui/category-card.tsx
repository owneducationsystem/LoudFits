
import { Link } from "wouter";
import { motion } from "framer-motion";

interface CategoryCardProps {
  name: string;
  image: string;
  href: string;
}

export function CategoryCard({ name, image, href }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative overflow-hidden rounded-lg"
    >
      <Link href={href}>
        <div className="cursor-pointer">
          <img
            src={image}
            alt={name}
            className="h-64 w-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/40">
            <div className="flex h-full items-center justify-center">
              <h3 className="text-2xl font-bold text-white">{name}</h3>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
