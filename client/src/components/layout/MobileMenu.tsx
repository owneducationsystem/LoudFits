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
          className="md:hidden fixed inset-0 bg-black z-50 overflow-y-auto"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
        >
          <div className="relative p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center" onClick={onClose}>
                <img src={logoImage} alt="Loudfits" className="h-10 w-auto" />
              </Link>
              <button
                onClick={onClose}
                className="text-white hover:text-[#582A34] transition-colors p-1"
                aria-label="Close menu"
              >
                <X size={24} />
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
                    <div>
                      <button
                        className="w-full flex justify-between items-center py-4 border-b border-gray-800 hover:text-[#582A34] transition-colors"
                        onClick={() => toggleSubmenu(link.name)}
                      >
                        <span>{link.name}</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          expandedMenus.includes(link.name) && "transform rotate-180"
                        )} />
                      </button>
                      {expandedMenus.includes(link.name) && link.submenu && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gray-900 pl-4"
                        >
                          {link.submenu.map((subItem) => (
                            <Link
                              key={subItem.name}
                              href={subItem.path}
                              className="block py-3 border-b border-gray-800 text-gray-300 hover:text-white pl-2"
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
                      className="block py-4 border-b border-gray-800 hover:text-[#582A34] transition-colors"
                      onClick={onClose}
                    >
                      {link.name}
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-col space-y-4 text-gray-400 text-sm">
              <Link href="/privacy-policy" className="hover:text-white transition-colors" onClick={onClose}>
                Privacy Policy
              </Link>
              <Link href="/terms-conditions" className="hover:text-white transition-colors" onClick={onClose}>
                Terms & Conditions
              </Link>
            </div>

            <div className="mt-auto text-center text-white text-sm py-6">
              <p>© {new Date().getFullYear()} Loudfits</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
