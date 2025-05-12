import { useQuery } from "@tanstack/react-query";
import ProductCarousel from "@/components/ui/product-carousel";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const TrendingProducts = () => {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products/trending"],
  });

  if (isLoading) {
    return (
      <section className="py-12 px-4 bg-[#BECCD5] bg-opacity-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">TRENDING NOW</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-[250px] w-full rounded-md" />
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-4 w-1/3 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !products) {
    console.error("Error loading trending products:", error);
    return null;
  }

  // If no products are available, display an empty state
  if (!products || products.length === 0) {
    return (
      <section className="py-12 px-4 bg-[#BECCD5] bg-opacity-20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">TRENDING NOW</h2>
          <p className="text-center text-gray-500">No trending products available at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  const displayProducts = products;

  return (
    <section className="py-12 px-4 bg-[#BECCD5] bg-opacity-20">
      <div className="container mx-auto">
        <ProductCarousel products={displayProducts} title="TRENDING NOW" />
      </div>
    </section>
  );
};

export default TrendingProducts;
