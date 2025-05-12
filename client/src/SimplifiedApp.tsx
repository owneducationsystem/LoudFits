import React, { lazy, Suspense } from 'react';
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

// Import core components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
  </div>
);

// Import essential pages
const Home = lazy(() => import("@/pages/Home"));
const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const NotFound = lazy(() => import("@/pages/not-found"));

const SimplifiedApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                
                <main className="flex-grow">
                  <Suspense fallback={<Loading />}>
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/shop" component={Shop} />
                      <Route path="/product/:id" component={ProductDetail} />
                      <Route path="/cart" component={Cart} />
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
                </main>
                
                <Footer />
              </div>
              <Toaster />
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default SimplifiedApp;