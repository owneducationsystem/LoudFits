import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, Heart, ShoppingBag, Menu } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import MobileMenu from "./MobileMenu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Header = () => {
  const [location] = useLocation();
  const { cartItems } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { name: "NEW ARRIVALS", path: "/shop?category=new-arrivals" },
    { name: "MEN", path: "/shop?gender=men" },
    { name: "WOMEN", path: "/shop?gender=women" },
    { name: "PRINTED TEES", path: "/shop?category=printed-tees" },
    { name: "CUSTOMIZE", path: "/customize" },
    { name: "COLLECTIONS", path: "/shop?type=collections" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black text-white">
      {/* Top announcement bar */}
      <div className="bg-[#582A34] py-2 px-4 text-center text-xs md:text-sm">
        <p>FREE SHIPPING ON ORDERS ABOVE ₹1999 | EASY RETURNS</p>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-wider">
          LOUDFITS
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.path}
              className={cn(
                "hover:text-[#582A34] transition-colors",
                location === link.path && "text-[#582A34]"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right header icons */}
        <div className="flex items-center space-x-4">
          <Link href="/search" className="hover:text-[#582A34] transition-colors">
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/login" className="hover:text-[#582A34] transition-colors">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/wishlist" className="hover:text-[#582A34] transition-colors">
            <Heart className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="hover:text-[#582A34] transition-colors relative">
            <ShoppingBag className="h-5 w-5" />
            {cartItems.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-[#582A34] text-white text-xs rounded-full h-4 w-4 flex items-center justify-center"
              >
                {cartItems.length}
              </motion.span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile navigation menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={toggleMobileMenu} 
        links={navLinks} 
      />
    </header>
  );
};

export default Header;
