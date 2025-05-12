import React, { lazy, Suspense } from 'react';
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
  </div>
);

// Import essential pages
const Home = lazy(() => import("@/pages/Home"));
const Shop = lazy(() => import("@/pages/Shop"));
const NotFound = lazy(() => import("@/pages/not-found"));

const SimplifiedApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <div className="flex flex-col min-h-screen">
                <header className="bg-white p-4 shadow-md">
                  <div className="container mx-auto">
                    <h1 className="text-2xl font-bold text-[#582A34]">Loudfits</h1>
                  </div>
                </header>
                
                <main className="flex-grow">
                  <Suspense fallback={<Loading />}>
                    <Switch>
                      <Route path="/" component={Home} />
                      <Route path="/shop" component={Shop} />
                      <Route component={NotFound} />
                    </Switch>
                  </Suspense>
                </main>
                
                <footer className="bg-gray-100 p-4">
                  <div className="container mx-auto text-center text-gray-600">
                    &copy; 2025 Loudfits. All rights reserved.
                  </div>
                </footer>
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