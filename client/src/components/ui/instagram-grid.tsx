import { motion } from "framer-motion";

interface InstagramGridProps {
  images: { src: string; alt: string }[];
}

const InstagramGrid = ({ images }: InstagramGridProps) => {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold mb-2">@LOUDFITS</h2>
          <p className="text-gray-600">Follow us on Instagram for style inspiration</p>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.1
              }}
              whileHover={{ scale: 1.03 }}
            >
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  className="w-full h-40 md:h-64 object-cover hover:opacity-90 transition-opacity cursor-pointer" 
                />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramGrid;
