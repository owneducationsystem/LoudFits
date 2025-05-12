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
      "sticky top-0 z-50 text-white transition-all duration-300",
      scrolled 
        ? "bg-black/95 backdrop-blur-md shadow-lg shadow-black/30 border-b border-white/5" 
        : "bg-gradient-to-b from-black via-black/95 to-black/90"
    )}>
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-[#32222A] via-[#582A34] to-[#32222A] py-2 px-4 text-center text-xs md:text-sm font-medium relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDEwMFYwaC0xMDB2MTAwaDEwMHptLTEwMC0xMDBjMjUgMCA3NSAyNSA3NSAyNXMtNTAgNzUtNzUgNzV2LTEwMHoiIGZpbGw9IiNmZmZmZmYwOCIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="container mx-auto">
          <p className="tracking-wide flex items-center justify-center gap-2 uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
            FREE SHIPPING ON ORDERS ABOVE ₹1999
            <span className="inline-block mx-1 w-1 h-1 rounded-full bg-white"></span>
            EASY RETURNS
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="w-full mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-white bg-gray-900 p-2 rounded-md hover:bg-[#582A34] transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-lg transform hover:scale-105 transition-transform">
            <motion.img 
              src={logoImage} 
              alt="Loudfits" 
              className="h-12 w-auto object-contain"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
            />
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-1 md:space-x-2 lg:space-x-5 text-sm font-medium">
          {navLinks.map((link) => (
            <div 
              key={link.name}
              className="relative group py-2"
              onMouseEnter={() => link.hasSubmenu && setHoveredMenu(link.name)}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <Link 
                href={link.path}
                className={cn(
                  "px-3 py-2 hover:text-[#582A34] transition-colors flex items-center relative",
                  (location === link.path || hoveredMenu === link.name) && "text-[#582A34]"
                )}
              >
                <span className="relative z-10">
                  {link.name}
                  {/* Active underline animation */}
                  <span 
                    className={cn(
                      "absolute bottom-0 left-0 w-0 h-0.5 bg-[#582A34] transition-all duration-300 group-hover:w-full",
                      (location === link.path || hoveredMenu === link.name) && "w-full"
                    )}
                  ></span>
                </span>
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
                    "absolute left-0 mt-1 w-52 bg-gray-900/90 backdrop-blur-md border border-gray-800 rounded-md shadow-xl z-10 transform transition-all duration-200 ease-in-out origin-top-left",
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
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#582A34]/20 hover:text-white transition-colors"
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
        <div className="flex items-center space-x-1 md:space-x-5">
          <Link 
            href="/search" 
            className="relative group p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="h-[22px] w-[22px] text-white group-hover:text-[#582A34] transition-colors" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Search
            </span>
          </Link>
          <Link 
            href="/login" 
            className="relative group p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Account"
          >
            <User className="h-[22px] w-[22px] text-white group-hover:text-[#582A34] transition-colors" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Account
            </span>
          </Link>
          <Link 
            href="/wishlist" 
            className="relative group p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-[22px] w-[22px] text-white group-hover:text-[#582A34] transition-colors" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Wishlist
            </span>
          </Link>
          <Link 
            href="/cart" 
            className="relative group p-2 hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-[22px] w-[22px] text-white group-hover:text-[#582A34] transition-colors" />
            {cartItems.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-[#582A34] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-lg"
              >
                {cartItems.length}
              </motion.span>
            )}
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
