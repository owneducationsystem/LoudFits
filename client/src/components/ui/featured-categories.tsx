import { motion } from "framer-motion";
import CategoryCard from "@/components/ui/category-card";

const FeaturedCategories = () => {
  const categories = [
    {
      image: "https://images.unsplash.com/photo-1562157873-818bc0726f68?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "PRINTED TEES",
      link: "/shop?category=printed-tees"
    },
    {
      image: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "CUSTOMIZE YOUR TEE",
      link: "/customize"
    }
  ];

  return (
    <section className="py-12 px-4 bg-white">
      <div className="container mx-auto">
        <motion.h2 
          className="text-3xl font-bold mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          FEATURED CATEGORIES
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <CategoryCard
                image={category.image}
                title={category.title}
                link={category.link}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
