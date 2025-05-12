import { useState, useEffect } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { type Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

// This is a temporary solution until we have backend wishlist functionality
// In a real app, wishlist would be stored in the database and linked to the user
const getLocalWishlist = (): number[] => {
  if (typeof window !== 'undefined') {
    const wishlist = localStorage.getItem("wishlist");
    return wishlist ? JSON.parse(wishlist) : [];
  }
  return [];
};

const setLocalWishlist = (wishlist: number[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }
};

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<number[]>(getLocalWishlist());
  const { addToCart } = useCartContext();
  const { toast } = useToast();

  // Use React Query to fetch all products
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Filter products that are in the wishlist
  const wishlistProducts = Array.isArray(allProducts) 
    ? allProducts.filter((product: Product) => wishlistItems.includes(product.id))
    : [];

  const removeFromWishlist = (productId: number) => {
    const updatedWishlist = wishlistItems.filter(id => id !== productId);
    setWishlistItems(updatedWishlist);
    setLocalWishlist(updatedWishlist);
    toast({
      title: "Item removed",
      description: "Product removed from your wishlist",
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      quantity: 1,
      size: product.sizes[0],
      color: product.colors[0],
      product,
    });
    toast({
      title: "Added to cart",
      description: "Product added to your cart",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Heart className="mr-2 h-6 w-6 text-[#582A34]" />
        My Wishlist
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-[150px] rounded-md"></div>
          ))}
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save your favorite items to buy later</p>
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="flex flex-col md:flex-row gap-4 border rounded-lg p-4">
              <div className="w-full md:w-48 h-48 overflow-hidden rounded-md shrink-0">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="text-lg font-bold">
                  <Link href={`/product/${product.id}`} className="hover:text-[#582A34]">
                    {product.name}
                  </Link>
                </h3>
                <p className="text-gray-500 mt-1 mb-2">₹{product.price}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button onClick={() => handleAddToCart(product)}>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;