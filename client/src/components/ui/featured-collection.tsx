import { motion } from "framer-motion";
import CategoryCard from "@/components/ui/category-card";

const FeaturedCollection = () => {
  const collections = [
    {
      image: "https://images.unsplash.com/photo-1529720317453-c8da503f2051?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=500",
      title: "URBAN STREETWEAR",
      link: "/shop?collection=urban-streetwear",
      fullWidth: true
    },
    {
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "MINIMALIST",
      link: "/shop?collection=minimalist",
      fullWidth: false
    },
    {
      image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400",
      title: "ARTISTIC PRINTS",
      link: "/shop?collection=artistic-prints",
      fullWidth: false
    }
  ];

  return (
    <section className="py-12 px-4 bg-[#52534B] text-white">
      <div className="container mx-auto">
        <motion.h2 
          className="text-3xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          FEATURED COLLECTION
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={index}
              className={collection.fullWidth ? "md:col-span-2" : ""}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <CategoryCard
                image={collection.image}
                title={collection.title}
                link={collection.link}
                fullWidth={collection.fullWidth}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
