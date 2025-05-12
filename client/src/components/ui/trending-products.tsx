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

  // Fallback data if API hasn't been implemented
  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: "Abstract Design Tee",
      description: "Stylish black t-shirt with abstract graphic design",
      price: "899" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "White", "Gray"],
      images: ["https://images.unsplash.com/photo-1527719327859-c6ce80353573?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: false,
      collection: null,
      inStock: true
    },
    {
      id: 2,
      name: "Geometric Print Tee",
      description: "White t-shirt with minimal geometric design",
      price: "799" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Black"],
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: true,
      collection: "minimalist",
      inStock: true
    },
    {
      id: 3,
      name: "Vintage Graphic Tee",
      description: "Gray t-shirt with vintage-style graphic print",
      price: "999" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Gray", "Black"],
      images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: false,
      collection: "vintage",
      inStock: true
    },
    {
      id: 4,
      name: "Statement Logo Tee",
      description: "Navy blue t-shirt with bold logo print",
      price: "849" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Navy", "Black", "White"],
      images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: true,
      collection: "urban-streetwear",
      inStock: true
    },
    {
      id: 5,
      name: "Artistic Pattern Tee",
      description: "Creative pattern design on premium cotton",
      price: "949" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Black"],
      images: ["https://images.unsplash.com/photo-1503341733017-1901578f9f1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: false,
      collection: "artistic-prints",
      inStock: true
    },
    {
      id: 6,
      name: "Urban Style Tee",
      description: "Modern urban design for street style",
      price: "899" as any,
      category: "printed-tees",
      gender: "unisex",
      sizes: ["S", "M", "L", "XL"],
      colors: ["Black", "Gray"],
      images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
      trending: true,
      featured: true,
      collection: "urban-streetwear",
      inStock: true
    }
  ];

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-12 px-4 bg-[#BECCD5] bg-opacity-20">
      <div className="container mx-auto">
        <ProductCarousel products={displayProducts} title="TRENDING NOW" />
      </div>
    </section>
  );
};

export default TrendingProducts;
