import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface WishlistContextType {
  wishlistItems: number[];
  addToWishlist: (productId: number, productName: string) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

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

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<number[]>([]);
  const { toast } = useToast();

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    setWishlistItems(getLocalWishlist());
  }, []);

  const addToWishlist = (productId: number, productName: string) => {
    if (wishlistItems.includes(productId)) {
      // If already in wishlist, show a different toast message
      toast({
        title: "Already in wishlist",
        description: `${productName} is already in your wishlist.`,
      });
      return;
    }
    
    const updatedWishlist = [...wishlistItems, productId];
    setWishlistItems(updatedWishlist);
    setLocalWishlist(updatedWishlist);
    
    toast({
      title: "Added to wishlist",
      description: `${productName} has been added to your wishlist.`,
    });
  };

  const removeFromWishlist = (productId: number) => {
    const updatedWishlist = wishlistItems.filter(id => id !== productId);
    setWishlistItems(updatedWishlist);
    setLocalWishlist(updatedWishlist);
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        totalItems: wishlistItems.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlistContext must be used within a WishlistProvider");
  }
  return context;
};