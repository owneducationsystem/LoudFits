import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const MobileNavigation = () => {
  const [location, navigate] = useLocation();
  const { cartItems } = useCartContext();
  const { totalItems: wishlistCount } = useWishlistContext();
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide navigation when scrolling down on small screens
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 10) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 10) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Don't show on admin pages
  if (location.startsWith("/admin")) {
    return null;
  }

  return (
    <motion.div 
      className="mobile-nav-bar md:hidden"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '100%' }}
      transition={{ duration: 0.3 }}
    >
      <button 
        onClick={() => navigate("/")}
        className={`mobile-nav-item ${location === "/" ? "active" : ""}`}
        aria-label="Home"
      >
        <Home size={22} />
        <span className="text-xs">Home</span>
      </button>
      
      <button 
        onClick={() => navigate("/search")}
        className={`mobile-nav-item ${location === "/search" ? "active" : ""}`}
        aria-label="Search"
      >
        <Search size={22} />
        <span className="text-xs">Search</span>
      </button>
      
      <button 
        onClick={() => navigate("/wishlist")}
        className={`mobile-nav-item ${location === "/wishlist" ? "active" : ""} relative`}
        aria-label="Wishlist"
      >
        <div className="relative">
          <Heart size={22} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#582A34] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
        <span className="text-xs">Wishlist</span>
      </button>
      
      <button 
        onClick={() => navigate("/cart")}
        className={`mobile-nav-item ${location === "/cart" ? "active" : ""} relative`}
        aria-label="Cart"
      >
        <div className="relative">
          <ShoppingBag size={22} />
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#582A34] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </div>
        <span className="text-xs">Cart</span>
      </button>
      
      <button 
        onClick={() => navigate(currentUser ? "/account" : "/login")}
        className={`mobile-nav-item ${location === "/account" || location === "/login" ? "active" : ""}`}
        aria-label="Account"
      >
        <User size={22} />
        <span className="text-xs">{currentUser ? "Account" : "Login"}</span>
      </button>
    </motion.div>
  );
};

export default MobileNavigation;