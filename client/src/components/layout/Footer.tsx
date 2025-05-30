import { useState } from "react";
import { Link } from "wouter";
import { 
  Facebook, Instagram, Twitter, Youtube, MapPin, Phone, Mail, 
  ChevronDown, ChevronUp 
} from "lucide-react";

const Footer = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  return (
    <footer className="bg-black text-white pt-12 pb-24 md:pb-6 px-4">
      <div className="container mx-auto">
        {/* Desktop Footer Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* About Column */}
          <div>
            <h3 className="text-xl font-bold mb-4">LOUDFITS</h3>
            <p className="text-gray-400 text-sm">
              Making noise with style since 2023. We create bold, expressive t-shirts that help you stand out and make a statement.
            </p>
            <div className="mt-4 flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[#582A34] transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[#582A34] transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[#582A34] transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[#582A34] transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">SHOP</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/shop?category=new-arrivals" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop?gender=men" className="hover:text-white transition-colors">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/shop?gender=women" className="hover:text-white transition-colors">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/shop?category=printed-tees" className="hover:text-white transition-colors">
                  Printed Tees
                </Link>
              </li>
              <li>
                <Link href="/customize" className="hover:text-white transition-colors">
                  Customize
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-lg font-bold mb-4">HELP</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link href="/faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping-returns" className="hover:text-white transition-colors">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">CONTACT US</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                <span>123 Style Street, Fashion Hub, New Delhi - 110001</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>hello@loudfits.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile Footer Accordion */}
        <div className="md:hidden">
          {/* About Section */}
          <div className="border-b border-gray-800">
            <button 
              className="w-full py-4 flex justify-between items-center"
              onClick={() => toggleSection('about')}
              aria-expanded={expandedSection === 'about'}
            >
              <h3 className="text-lg font-bold">LOUDFITS</h3>
              {expandedSection === 'about' ? 
                <ChevronUp size={18} /> : 
                <ChevronDown size={18} />
              }
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSection === 'about' ? 'max-h-40 pb-4' : 'max-h-0'
            }`}>
              <p className="text-gray-400 text-sm">
                Making noise with style since 2023. We create bold, expressive t-shirts that help you stand out and make a statement.
              </p>
              <div className="mt-4 flex space-x-6">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook size={18} className="text-gray-400 hover:text-white" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram size={18} className="text-gray-400 hover:text-white" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <Twitter size={18} className="text-gray-400 hover:text-white" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                  <Youtube size={18} className="text-gray-400 hover:text-white" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Shop Section */}
          <div className="border-b border-gray-800">
            <button 
              className="w-full py-4 flex justify-between items-center"
              onClick={() => toggleSection('shop')}
              aria-expanded={expandedSection === 'shop'}
            >
              <h3 className="text-lg font-bold">SHOP</h3>
              {expandedSection === 'shop' ? 
                <ChevronUp size={18} /> : 
                <ChevronDown size={18} />
              }
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSection === 'shop' ? 'max-h-60 pb-4' : 'max-h-0'
            }`}>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <Link href="/shop?category=new-arrivals" className="block py-1">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link href="/shop?gender=men" className="block py-1">
                    Men
                  </Link>
                </li>
                <li>
                  <Link href="/shop?gender=women" className="block py-1">
                    Women
                  </Link>
                </li>
                <li>
                  <Link href="/shop?category=printed-tees" className="block py-1">
                    Printed Tees
                  </Link>
                </li>
                <li>
                  <Link href="/customize" className="block py-1">
                    Customize
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Help Section */}
          <div className="border-b border-gray-800">
            <button 
              className="w-full py-4 flex justify-between items-center"
              onClick={() => toggleSection('help')}
              aria-expanded={expandedSection === 'help'}
            >
              <h3 className="text-lg font-bold">HELP</h3>
              {expandedSection === 'help' ? 
                <ChevronUp size={18} /> : 
                <ChevronDown size={18} />
              }
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSection === 'help' ? 'max-h-60 pb-4' : 'max-h-0'
            }`}>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>
                  <Link href="/faqs" className="block py-1">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-returns" className="block py-1">
                    Shipping & Returns
                  </Link>
                </li>
                <li>
                  <Link href="/size-guide" className="block py-1">
                    Size Guide
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="block py-1">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/track-order" className="block py-1">
                    Track Order
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="border-b border-gray-800">
            <button 
              className="w-full py-4 flex justify-between items-center"
              onClick={() => toggleSection('contact')}
              aria-expanded={expandedSection === 'contact'}
            >
              <h3 className="text-lg font-bold">CONTACT US</h3>
              {expandedSection === 'contact' ? 
                <ChevronUp size={18} /> : 
                <ChevronDown size={18} />
              }
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${
              expandedSection === 'contact' ? 'max-h-60 pb-4' : 'max-h-0'
            }`}>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                  <span>123 Style Street, Fashion Hub, New Delhi - 110001</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>hello@loudfits.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright and Legal - Both Mobile and Desktop */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-xs md:text-sm">
          <p>
            © {new Date().getFullYear()} Loudfits. All rights reserved.
            {process.env.NODE_ENV !== 'production' && (
              <span className="ml-1">
                (<Link href="/test-phonepe" className="text-gray-400 hover:text-gray-300 underline text-[10px]">
                  Test PhonePe
                </Link>)
              </span>
            )}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
