import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CategoryCard from "@/components/ui/category-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedCategories = () => {
  // Fetch all products from the database
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Extract unique categories from products
  const productCategories = products ? 
    Array.from(new Set(products.map(product => product.category)))
      .filter(Boolean)
      .map((category, index) => {
        // Use the first product image from this category as the category image
        const productsInCategory = products.filter(p => p.category === category);
        const image = productsInCategory[0]?.images[0] || "";
        
        return {
          image: image,
          title: category?.toUpperCase().replace(/-/g, " ") || "",
          link: `/shop?category=${category}`
        };
      }).slice(0, 2) : []; // Limit to 2 categories
      
  // Always add the customize option
  const categories = [
    ...productCategories,
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
        
        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-md" />
            <Skeleton className="h-[300px] w-full rounded-md" />
          </div>
        ) : (
          // Render categories
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
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;
