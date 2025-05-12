import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, Heart, ShoppingBag, Menu, ChevronDown } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import MobileMenu from "./MobileMenu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/loudfits-logo.png";

const Header = () => {
  const [location] = useLocation();
  const { cartItems } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  // Track scroll position to add shadow when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { 
      name: "NEW ARRIVALS", 
      path: "/shop?category=new-arrivals",
      hasSubmenu: false
    },
    { 
      name: "MEN", 
      path: "/shop?gender=men",
      hasSubmenu: true,
      submenu: [
        { name: "T-Shirts", path: "/shop?gender=men&category=t-shirts" },
        { name: "Printed Tees", path: "/shop?gender=men&category=printed-tees" },
        { name: "Graphic Tees", path: "/shop?gender=men&category=graphic-tees" }
      ]
    },
    { 
      name: "WOMEN", 
      path: "/shop?gender=women",
      hasSubmenu: true,
      submenu: [
        { name: "T-Shirts", path: "/shop?gender=women&category=t-shirts" },
        { name: "Printed Tees", path: "/shop?gender=women&category=printed-tees" },
        { name: "Graphic Tees", path: "/shop?gender=women&category=graphic-tees" }
      ]
    },
    { 
      name: "PRINTED TEES", 
      path: "/shop?category=printed-tees",
      hasSubmenu: false
    },
    { 
      name: "CUSTOMIZE", 
      path: "/customize",
      hasSubmenu: false
    },
    { 
      name: "COLLECTIONS", 
      path: "/shop?type=collections",
      hasSubmenu: true,
      submenu: [
        { name: "Urban Streetwear", path: "/shop?collection=urban-streetwear" },
        { name: "Minimalist", path: "/shop?collection=minimalist" },
        { name: "Vintage", path: "/shop?collection=vintage" },
        { name: "Artistic Prints", path: "/shop?collection=artistic-prints" }
      ]
    },
  ];

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-black text-white transition-shadow duration-300",
      scrolled && "shadow-lg shadow-black/20"
    )}>
      {/* Top announcement bar */}
      <div className="bg-[#582A34] py-2 px-4 text-center text-xs md:text-sm font-medium">
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
        <Link href="/" className="flex items-center">
          <motion.img 
            src={logoImage} 
            alt="Loudfits" 
            className="h-11 w-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <div 
              key={link.name}
              className="relative group"
              onMouseEnter={() => link.hasSubmenu && setHoveredMenu(link.name)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <Link 
                href={link.path}
                className={cn(
                  "hover:text-[#582A34] transition-colors flex items-center",
                  (location === link.path || hoveredMenu === link.name) && "text-[#582A34]"
                )}
              >
                {link.name}
                {link.hasSubmenu && (
                  <ChevronDown className={cn(
                    "ml-1 h-4 w-4 transition-transform duration-200",
                    hoveredMenu === link.name && "transform rotate-180"
                  )} />
                )}
              </Link>
              
              {/* Submenu */}
              {link.hasSubmenu && (
                <div 
                  className={cn(
                    "absolute left-0 mt-2 w-48 bg-black border border-gray-800 rounded-md shadow-lg z-10 transform transition-all duration-200 ease-in-out origin-top-left",
                    hoveredMenu === link.name 
                      ? "opacity-100 scale-100 pointer-events-auto" 
                      : "opacity-0 scale-95 pointer-events-none"
                  )}
                >
                  <div className="py-2">
                    {link.submenu?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.path}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white"
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right header icons */}
        <div className="flex items-center space-x-5">
          <Link 
            href="/search" 
            className="hover:text-[#582A34] transition-colors relative group"
          >
            <Search className="h-5 w-5" />
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Search
            </span>
          </Link>
          <Link 
            href="/login" 
            className="hover:text-[#582A34] transition-colors relative group"
          >
            <User className="h-5 w-5" />
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Account
            </span>
          </Link>
          <Link 
            href="/wishlist" 
            className="hover:text-[#582A34] transition-colors relative group"
          >
            <Heart className="h-5 w-5" />
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Wishlist
            </span>
          </Link>
          <Link 
            href="/cart" 
            className="hover:text-[#582A34] transition-colors relative group"
          >
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
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Cart
            </span>
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
