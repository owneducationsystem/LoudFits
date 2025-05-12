import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: { name: string; path: string }[];
}

const MobileMenu = ({ isOpen, onClose, links }: MobileMenuProps) => {
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
          className="md:hidden fixed inset-0 bg-black z-50"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={menuVariants}
        >
          <div className="relative p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="text-2xl font-bold tracking-wider text-white">
                LOUDFITS
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
                  <Link
                    href={link.path}
                    className="block py-4 border-b border-gray-800 hover:text-[#582A34] transition-colors"
                    onClick={onClose}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
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
