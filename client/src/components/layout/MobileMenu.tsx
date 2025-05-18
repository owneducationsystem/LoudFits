import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, User, ShoppingBag, Heart, Search, Home, ShoppingCart, LogOut, Info, Phone, MapPin, FileText, ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useToast } from "@/hooks/use-toast";

interface LinkItem {
  name: string; 
  path: string;
  hasSubmenu?: boolean;
  submenu?: { name: string; path: string }[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
}

const MobileMenu = ({ isOpen, onClose, links }: MobileMenuProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [location] = useLocation();
  const { currentUser, logout } = useAuth();
  const { cartItems } = useCartContext();
  const { totalItems: wishlistCount } = useWishlistContext();
  const { toast } = useToast();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const toggleAccountMenu = () => {
    setAccountMenuOpen(!accountMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout successful",
        description: "You have been logged out successfully.",
      });
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuVariants = {
    hidden: {
      x: "-100%",
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      x: "-100%",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
      },
    }),
  };

  const linkWithIconClass = "flex items-center gap-3 px-4 py-3.5 rounded-md hover:bg-[#582A34]/10 text-gray-700 hover:text-[#582A34] transition-colors";
  const activeLinkClass = "bg-[#582A34]/10 text-[#582A34]";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Slide-in menu */}
          <motion.div
            className="md:hidden fixed inset-y-0 left-0 max-w-[85%] w-[320px] bg-white z-50 overflow-y-auto flex flex-col shadow-xl"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="flex justify-between items-center p-4">
                <Link href="/" className="flex items-center" onClick={onClose}>
                  <div className="relative flex flex-col items-center">
                    <div className="px-2 py-0.5">
                      <h1 className="text-2xl font-black text-black tracking-tighter flex items-center">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-[#582A34] to-[#532E4E]">
                          LOUD
                        </span>
                        <span className="relative">
                          <span className="text-[#582A34]">FITS</span>
                          <motion.span 
                            className="absolute w-1.5 h-1.5 bg-[#582A34] rounded-full -top-1 -right-1.5"
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
                    </div>
                  </div>
                </Link>
                <button
                  onClick={onClose}
                  className="text-gray-600 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X size={22} />
                </button>
              </div>

              {/* User info section */}
              {currentUser ? (
                <div className="px-4 py-3 bg-gray-50 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#582A34] text-white rounded-full flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex p-4 gap-2">
                  <Link 
                    href="/login" 
                    className="flex-1 py-2.5 text-center bg-[#582A34] text-white rounded-md font-medium"
                    onClick={onClose}
                  >
                    Log In
                  </Link>
                  <Link 
                    href="/signup" 
                    className="flex-1 py-2.5 text-center border border-[#582A34] text-[#582A34] rounded-md font-medium"
                    onClick={onClose}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="py-2 px-4 mb-2">
                <h2 className="text-base font-semibold text-[#582A34]">Browse Categories</h2>
              </div>

              <div className="px-3 mb-4">
                <Link 
                  href="/shop?category=all" 
                  className={cn(
                    "flex items-center justify-between py-3 px-4 bg-[#582A34] text-white rounded-md font-medium",
                    "hover:bg-[#532E4E] transition-colors"
                  )}
                  onClick={onClose}
                >
                  <span>Shop All Categories</span>
                  <ShoppingCart size={18} />
                </Link>
              </div>

              {/* Main navigation links */}
              <div className="px-3 space-y-1">
                {links.map((link, i) => (
                  <motion.div
                    key={link.name}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={itemVariants}
                  >
                    {link.hasSubmenu ? (
                      <div className="mb-1">
                        <button
                          className={cn(
                            "w-full flex justify-between items-center py-3 px-4 rounded-md font-medium",
                            expandedMenus.includes(link.name) 
                              ? "bg-[#582A34]/10 text-[#582A34]" 
                              : "text-gray-700 hover:bg-[#582A34]/5"
                          )}
                          onClick={() => toggleSubmenu(link.name)}
                        >
                          <span>{link.name}</span>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            expandedMenus.includes(link.name) && "transform rotate-180"
                          )} />
                        </button>
                        <AnimatePresence>
                          {expandedMenus.includes(link.name) && link.submenu && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden ml-3 pl-2 border-l-2 border-[#582A34]/20"
                            >
                              {link.submenu.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.path}
                                  className="block py-2.5 px-4 text-gray-600 hover:text-[#582A34] text-sm"
                                  onClick={onClose}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={link.name === "T-SHIRTS" ? "/shop" : link.path}
                        className={cn(
                          "block py-3 px-4 rounded-md font-medium",
                          location === link.path 
                            ? "bg-[#582A34]/10 text-[#582A34]" 
                            : "text-gray-700 hover:bg-[#582A34]/5 hover:text-[#582A34]"
                        )}
                        onClick={onClose}
                      >
                        {link.name}
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* We removed account links and help & info links from here as requested */}
            </div>

            <div className="mt-auto text-center text-gray-500 text-xs py-4 border-t border-gray-200">
              <p>© {new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
