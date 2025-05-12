import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import logoImage from "@/assets/loudfits-logo.png";
import { cn } from "@/lib/utils";

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

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name) 
        : [...prev, name]
    );
  };

  const menuVariants = {
    hidden: {
      y: "-100%",
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    exit: {
      y: "-100%",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="md:hidden fixed inset-0 bg-black/95 backdrop-blur-md z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
        >
          <div className="relative p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-800">
              <Link href="/" className="flex items-center" onClick={onClose}>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 shadow-md transform hover:scale-105 transition-transform">
                  <img 
                    src={logoImage} 
                    alt="Loudfits" 
                    className="h-10 w-auto"
                    style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
                  />
                </div>
              </Link>
              <button
                onClick={onClose}
                className="text-white bg-gray-800 hover:bg-[#582A34] transition-colors p-2 rounded-full"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col text-white">
              {links.map((link, i) => (
                <motion.div
                  key={link.name}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                >
                  {link.hasSubmenu ? (
                    <div className="mb-2">
                      <button
                        className="w-full flex justify-between items-center py-4 px-2 mb-1 border-b border-gray-800 hover:text-[#582A34] transition-colors rounded-md"
                        onClick={() => toggleSubmenu(link.name)}
                      >
                        <span className="font-medium tracking-wide">{link.name}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expandedMenus.includes(link.name) && "transform rotate-180 text-[#582A34]"
                        )} />
                      </button>
                      {expandedMenus.includes(link.name) && link.submenu && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-900/60 backdrop-blur-sm rounded-md ml-4 overflow-hidden border-l-2 border-[#582A34]/40"
                        >
                          {link.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.path}
                              className="block py-3 px-4 border-b border-gray-800/70 text-gray-300 hover:text-white hover:bg-[#582A34]/20 transition-colors"
                              onClick={onClose}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={link.path}
                      className="block py-4 px-2 mb-2 border-b border-gray-800 hover:text-[#582A34] hover:bg-gray-900/40 transition-colors rounded-md"
                      onClick={onClose}
                    >
                      <span className="font-medium tracking-wide">{link.name}</span>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-gray-800/50">
              <h3 className="font-semibold text-[#582A34] mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
                <Link 
                  href="/privacy-policy" 
                  className="hover:text-white transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms-conditions" 
                  className="hover:text-white transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Terms & Conditions
                </Link>
                <Link 
                  href="/contact" 
                  className="hover:text-white transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Contact Us
                </Link>
                <Link 
                  href="/track-order" 
                  className="hover:text-white transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Track Order
                </Link>
              </div>
            </div>

            <div className="mt-auto text-center text-gray-400 text-sm py-6 border-t border-gray-800/50 mt-8">
              <p>© {new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
