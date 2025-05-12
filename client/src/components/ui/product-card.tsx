import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { Product } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCartContext();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      productId: product.id,
      quantity: 1,
      size: product.sizes[0],
      color: product.colors[0],
      product
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { y: -5, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="product-card group"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Link href={`/product/${product.id}`}>
        <div className="overflow-hidden">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="product-image w-full h-[250px] sm:h-[300px] object-cover" 
          />
        </div>
        <div className="mt-3 flex flex-col">
          <h3 className="font-medium text-sm sm:text-base">{product.name}</h3>
          <div className="flex justify-between items-center mt-1">
            <p className="font-bold">₹{product.price.toString()}</p>
            <div className="flex gap-2">
              <button 
                className="text-[#445672] hover:text-[#582A34] transition-colors"
                onClick={(e) => handleAddToCart(e)}
                aria-label="Add to cart"
              >
                <ShoppingBag className="h-5 w-5" />
              </button>
              <button 
                className="text-[#445672] hover:text-[#582A34] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast({
                    title: "Added to wishlist",
                    description: `${product.name} has been added to your wishlist.`,
                  });
                }}
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
