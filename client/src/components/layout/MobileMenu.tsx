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
          className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
        >
          <div className="relative p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
              <Link href="/" className="flex items-center" onClick={onClose}>
                <div className="relative flex flex-col items-center">
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
                </div>
              </Link>
              <button
                onClick={onClose}
                className="text-gray-600 bg-gray-100 hover:bg-[#582A34]/10 hover:text-[#582A34] transition-colors p-2 rounded-full"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex flex-col text-gray-800">
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
                        className="w-full flex justify-between items-center py-4 px-3 mb-1 border-b border-gray-200 hover:text-[#582A34] transition-colors rounded-md"
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
                          className="bg-gray-50 rounded-md ml-4 overflow-hidden border-l-2 border-[#582A34]/40"
                        >
                          {link.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.path}
                              className="block py-3 px-4 border-b border-gray-200 text-gray-600 hover:text-[#582A34] hover:bg-[#582A34]/10 transition-colors"
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
                      className="block py-4 px-3 mb-2 border-b border-gray-200 hover:text-[#582A34] hover:bg-gray-50 transition-colors rounded-md"
                      onClick={onClose}
                    >
                      <span className="font-medium tracking-wide">{link.name}</span>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-[#582A34] mb-3">Quick Links</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-600 text-sm">
                <Link 
                  href="/privacy-policy" 
                  className="hover:text-[#582A34] transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms-conditions" 
                  className="hover:text-[#582A34] transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Terms & Conditions
                </Link>
                <Link 
                  href="/contact" 
                  className="hover:text-[#582A34] transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Contact Us
                </Link>
                <Link 
                  href="/track-order" 
                  className="hover:text-[#582A34] transition-colors flex items-center gap-2" 
                  onClick={onClose}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#582A34]"></div>
                  Track Order
                </Link>
              </div>
            </div>

            <div className="mt-auto text-center text-gray-500 text-sm py-6 border-t border-gray-200 mt-8">
              <p>© {new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
