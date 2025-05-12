import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ui/product-card";
import { Separator } from "@/components/ui/separator";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Extract search term from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
      setSearchTerm(query);
    }
  }, []);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Filter products based on search term
  const filteredProducts = searchTerm.trim() === "" 
    ? [] 
    : (allProducts as Product[]).filter(
        (product) => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search term
    const params = new URLSearchParams();
    if (searchTerm) {
      params.set("q", searchTerm);
      setLocation(`/search?${params.toString()}`);
    } else {
      setLocation("/search");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Products</h1>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-xl">
        <Input
          type="text"
          placeholder="Search for products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit">
          <SearchIcon className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      <Separator className="mb-8" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-[350px] rounded-md"></div>
          ))}
        </div>
      ) : (
        <>
          {searchTerm && (
            <p className="mb-4 text-gray-600">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
            </p>
          )}
          
          {searchTerm && filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try a different search term or browse our collections</p>
              <Button onClick={() => setLocation("/shop")}>View All Products</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Search;