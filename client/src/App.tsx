import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Customize from "@/pages/Customize";
import Cart from "@/pages/Cart";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/not-found";
import Search from "@/pages/Search";
import Wishlist from "@/pages/Wishlist";
import SizeGuide from "@/pages/SizeGuide";
import FAQ from "@/pages/FAQ";
import ShippingReturns from "@/pages/ShippingReturns";
import Contact from "@/pages/Contact";
import TrackOrder from "@/pages/TrackOrder";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import Account from "@/pages/Account";
import Orders from "@/pages/Orders";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import PaymentFailed from "@/pages/PaymentFailed";
import PaymentError from "@/pages/PaymentError";
import TestPhonePe from "@/pages/TestPhonePe";
import NotificationTest from "@/pages/NotificationTest";
import EmailTest from "@/pages/EmailTest";
import DirectEmailTest from "@/pages/DirectEmailTest";
// Admin pages
import Admin from "@/pages/Admin";
import AdminUsers from "@/pages/AdminUsers";
import AdminOrders from "@/pages/AdminOrders";
import AdminProducts from "@/pages/AdminProducts";
import AdminAddProduct from "@/pages/AdminAddProduct";
import AdminAddProductSimple from "@/pages/AdminAddProductSimple";
import AdminEditProduct from "@/pages/AdminEditProduct";
import AdminCategories from "@/pages/AdminCategories";
import AdminAddUser from "@/pages/AdminAddUser";
import AdminSettings from "@/pages/AdminSettings";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboardPage from "@/pages/AdminDashboard";
import AdminRoute from "@/components/layout/AdminRoute";

import { useEffect, useState } from "react";
import { handleAuthRedirect } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

function App() {
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  // Handle redirect results from Firebase Authentication
  useEffect(() => {
    const processRedirect = async () => {
      try {
        const result = await handleAuthRedirect();
        if (result) {
          toast({
            title: "Authentication Success",
            description: `Welcome, ${result.user.displayName || result.user.email}!`,
          });
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
        toast({
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Failed to complete authentication",
          variant: "destructive",
        });
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    processRedirect();
  }, [toast]);

  if (isProcessingRedirect) {
    // Show loading state while processing redirect
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <NotificationProvider>
            <TooltipProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/shop" component={Shop} />
                <Route path="/product/:id" component={ProductDetail} />
                <Route path="/customize" component={Customize} />
                <Route path="/cart" component={Cart} />
                <Route path="/login" component={Auth} />
                <Route path="/signup" component={Auth} />
                <Route path="/search" component={Search} />
                <Route path="/wishlist" component={Wishlist} />
                <Route path="/size-guide" component={SizeGuide} />
                <Route path="/faqs" component={FAQ} />
                <Route path="/shipping-returns" component={ShippingReturns} />
                <Route path="/contact" component={Contact} />
                <Route path="/track-order" component={TrackOrder} />
                <Route path="/privacy-policy" component={PrivacyPolicy} />
                <Route path="/terms-conditions" component={TermsConditions} />
                <Route path="/account" component={Account} />
                <Route path="/orders" component={Orders} />
                <Route path="/checkout" component={Checkout} />
                <Route path="/order-confirmation/:orderId" component={OrderConfirmation} />
                <Route path="/payment-failed/:orderId" component={PaymentFailed} />
                <Route path="/payment-error" component={PaymentError} />
                <Route path="/test-phonepe" component={TestPhonePe} />
                <Route path="/test-notifications" component={NotificationTest} />
                <Route path="/test-emails" component={EmailTest} />
                <Route path="/direct-email-test" component={DirectEmailTest} />
                
                {/* Admin Routes - Protected */}
                <Route path="/admin/login" component={AdminLogin} />
                <Route path="/admin">
                  <AdminRoute component={Admin} />
                </Route>
                <Route path="/admin/dashboard" component={AdminDashboardPage} />
                <Route path="/admin/users">
                  <AdminRoute component={AdminUsers} />
                </Route>
                <Route path="/admin/orders">
                  <AdminRoute component={AdminOrders} />
                </Route>
                <Route path="/admin/products/add">
                  <AdminRoute component={AdminAddProductSimple} />
                </Route>
                <Route path="/admin/products/edit/:id">
                  <AdminRoute component={AdminEditProduct} />
                </Route>
                <Route path="/admin/products/categories">
                  <AdminRoute component={AdminCategories} />
                </Route>
                <Route path="/admin/products">
                  <AdminRoute component={AdminProducts} />
                </Route>
                <Route path="/admin/users/add">
                  <AdminRoute component={AdminAddUser} />
                </Route>
                <Route path="/admin/settings">
                  <AdminRoute component={AdminSettings} />
                </Route>
                
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
            </div>
            <Toaster />
          </TooltipProvider>
          </NotificationProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
