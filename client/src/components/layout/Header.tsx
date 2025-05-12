import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, Heart, ShoppingBag, Menu, ChevronDown, LogOut } from "lucide-react";
import { useCartContext } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlistContext } from "@/context/WishlistContext";
import MobileMenu from "./MobileMenu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/loudfits-logo.png";

const Header = () => {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { cartItems } = useCartContext();
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
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
      "sticky top-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-white shadow-lg shadow-gray-200/30 border-b border-gray-200/80" 
        : "bg-white"
    )}>
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-[#32222A] via-[#582A34] to-[#32222A] py-2 px-4 text-center text-xs md:text-sm font-medium relative overflow-hidden text-white">
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
          className="md:hidden text-gray-600 bg-gray-100 p-2 rounded-md hover:bg-[#582A34]/10 hover:text-[#582A34] transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="relative flex flex-col items-center group transform hover:scale-105 transition-transform">
            <div className="px-2 py-0.5 bg-gradient-to-r from-white to-white shadow-sm rounded-lg">
              <h1 className="text-3xl font-black text-black tracking-tighter flex items-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-[#582A34] to-[#532E4E]">
                  LOUD
                </span>
                <span className="relative">
                  <span className="text-[#582A34]">FITS</span>
                  <motion.span 
                    className="absolute w-2 h-2 bg-[#582A34] rounded-full -top-1 -right-2"
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: [0.8, 1.2, 0.8], 
                      opacity: [0.7, 1, 0.7] 
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop"
                    }}
                  ></motion.span>
                </span>
              </h1>
              <p className="text-xs tracking-wider text-gray-500 text-center uppercase font-medium mt-1">
                Make Noise With Your Style
              </p>
            </div>
            <div className="h-0.5 w-0 bg-gradient-to-r from-[#582A34] via-[#532E4E] to-[#582A34] absolute -bottom-2 group-hover:w-full transition-all duration-300"></div>
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
                  "px-3 py-2 text-gray-800 hover:text-[#582A34] transition-colors flex items-center relative",
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
                    "absolute left-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-xl z-10 transform transition-all duration-200 ease-in-out origin-top-left",
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
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#582A34]/10 hover:text-[#582A34] transition-colors"
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
            className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="h-[22px] w-[22px] text-gray-600 group-hover:text-[#582A34] transition-colors" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white text-gray-700 shadow-md px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-200">
              Search
            </span>
          </Link>
          <div className="relative">
            <button 
              onClick={toggleUserMenu}
              className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Account"
            >
              <User className={cn(
                "h-[22px] w-[22px] transition-colors",
                currentUser ? "text-[#582A34]" : "text-gray-600 group-hover:text-[#582A34]"
              )} />
              <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white text-gray-700 shadow-md px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-200">
                {currentUser ? 'My Account' : 'Login'}
              </span>
              
              {/* User status indicator */}
              {currentUser && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                {currentUser ? (
                  <div>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {currentUser.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          <Link 
            href="/wishlist" 
            className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-[22px] w-[22px] text-gray-600 group-hover:text-[#582A34] transition-colors" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white text-gray-700 shadow-md px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-200">
              Wishlist
            </span>
          </Link>
          <Link 
            href="/cart" 
            className="relative group p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-[22px] w-[22px] text-gray-600 group-hover:text-[#582A34] transition-colors" />
            {cartItems.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-[#582A34] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md"
              >
                {cartItems.length}
              </motion.span>
            )}
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-white text-gray-700 shadow-md px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-200">
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
