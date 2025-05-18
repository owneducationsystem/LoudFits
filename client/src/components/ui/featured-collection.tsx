import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import CategoryCard from "@/components/ui/category-card";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedCollection = () => {
  // Fetch all products from the database
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Extract unique collections from products
  const collections = products ? 
    Array.from(new Set(products.map(product => product.collection)))
      .filter(Boolean)
      .map((collection, index) => {
        // Use the first product image from this collection as the collection image
        const productsInCollection = products.filter(p => p.collection === collection);
        const image = productsInCollection[0]?.images[0] || "";
        
        return {
          image: image,
          title: collection?.toUpperCase() || "",
          link: `/shop?collection=${collection}`,
          fullWidth: index === 0 // Make the first collection full width
        };
      }) : [];

  // Don't render the section if there are no collections
  if (collections.length === 0 && !isLoading) {
    return null;
  }

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
        
        {isLoading ? (
          // Loading state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-md md:col-span-2" />
            <Skeleton className="h-[200px] w-full rounded-md" />
            <Skeleton className="h-[200px] w-full rounded-md" />
          </div>
        ) : (
          // Render collections - Mobile Carousel / Desktop Grid
          <div className="md:grid md:grid-cols-2 md:gap-6 hidden">
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
          
          {/* Mobile horizontal carousel */}
          <div className="md:hidden">
            <div className="mobile-carousel">
              {collections.map((collection, index) => (
                <motion.div
                  key={index}
                  className="mobile-carousel-item"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.15 }}
                >
                  <CategoryCard
                    image={collection.image}
                    title={collection.title}
                    link={collection.link}
                    fullWidth={false}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCollection;
