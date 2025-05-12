import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { lazy, Suspense } from "react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotFound from "@/pages/not-found";
import AdminRoute from "@/components/layout/AdminRoute";

// Loading component for lazy-loaded pages
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
  </div>
);

// Lazy load all pages
const Home = lazy(() => import("@/pages/Home"));
const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Customize = lazy(() => import("@/pages/Customize"));
const Cart = lazy(() => import("@/pages/Cart"));
const Auth = lazy(() => import("@/pages/Auth"));
const Search = lazy(() => import("@/pages/Search"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const SizeGuide = lazy(() => import("@/pages/SizeGuide"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const ShippingReturns = lazy(() => import("@/pages/ShippingReturns"));
const Contact = lazy(() => import("@/pages/Contact"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
const Account = lazy(() => import("@/pages/Account"));
const Orders = lazy(() => import("@/pages/Orders"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const PaymentFailed = lazy(() => import("@/pages/PaymentFailed"));
const PaymentError = lazy(() => import("@/pages/PaymentError"));
const TestPhonePe = lazy(() => import("@/pages/TestPhonePe"));
const WebSocketTest = lazy(() => import("@/pages/WebSocketTest"));

// Admin pages
const Admin = lazy(() => import("@/pages/Admin"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminOrders = lazy(() => import("@/pages/AdminOrders"));
const AdminProducts = lazy(() => import("@/pages/AdminProducts"));
const AdminAddProduct = lazy(() => import("@/pages/AdminAddProduct"));
const AdminAddProductSimple = lazy(() => import("@/pages/AdminAddProductSimple"));
const AdminEditProduct = lazy(() => import("@/pages/AdminEditProduct"));
const AdminCategories = lazy(() => import("@/pages/AdminCategories"));
const AdminAddUser = lazy(() => import("@/pages/AdminAddUser"));
const AdminSettings = lazy(() => import("@/pages/AdminSettings"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminRealTime = lazy(() => import("@/pages/AdminRealTime"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminSimple = lazy(() => import("@/pages/AdminSimple"));
const AdminBasic = lazy(() => import("@/pages/AdminBasic"));
const AdminMini = lazy(() => import("@/pages/AdminMini"));
const AdminRealTimeFixed = lazy(() => import("@/pages/AdminRealTimeFixed"));
const AdminWsOnly = lazy(() => import("@/pages/AdminWsOnly"));
const AdminDebug = lazy(() => import("@/pages/AdminDebug"));

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

  // Wrap components in Suspense for lazy loading
  const wrapInSuspense = (Component: React.ComponentType<any>) => {
    return (props: any) => (
      <Suspense fallback={<PageLoading />}>
        <Component {...props} />
      </Suspense>
    );
  };

  // Handle admin route with suspense
  const wrapInAdminRouteSuspense = (Component: React.ComponentType<any>) => {
    const WrappedComponent = (props: any) => <Component {...props} />;
    return (props: any) => (
      <Suspense fallback={<PageLoading />}>
        <AdminRoute component={WrappedComponent} />
      </Suspense>
    );
  };

  const router = (
    <Switch>
      <Route path="/" component={wrapInSuspense(Home)} />
      <Route path="/shop" component={wrapInSuspense(Shop)} />
      <Route path="/product/:id" component={wrapInSuspense(ProductDetail)} />
      <Route path="/customize" component={wrapInSuspense(Customize)} />
      <Route path="/cart" component={wrapInSuspense(Cart)} />
      <Route path="/login" component={wrapInSuspense(Auth)} />
      <Route path="/signup" component={wrapInSuspense(Auth)} />
      <Route path="/search" component={wrapInSuspense(Search)} />
      <Route path="/wishlist" component={wrapInSuspense(Wishlist)} />
      <Route path="/size-guide" component={wrapInSuspense(SizeGuide)} />
      <Route path="/faqs" component={wrapInSuspense(FAQ)} />
      <Route path="/shipping-returns" component={wrapInSuspense(ShippingReturns)} />
      <Route path="/contact" component={wrapInSuspense(Contact)} />
      <Route path="/track-order" component={wrapInSuspense(TrackOrder)} />
      <Route path="/privacy-policy" component={wrapInSuspense(PrivacyPolicy)} />
      <Route path="/terms-conditions" component={wrapInSuspense(TermsConditions)} />
      <Route path="/account" component={wrapInSuspense(Account)} />
      <Route path="/orders" component={wrapInSuspense(Orders)} />
      <Route path="/checkout" component={wrapInSuspense(Checkout)} />
      <Route path="/order-confirmation/:orderId" component={wrapInSuspense(OrderConfirmation)} />
      <Route path="/payment-failed/:orderId" component={wrapInSuspense(PaymentFailed)} />
      <Route path="/payment-error" component={wrapInSuspense(PaymentError)} />
      <Route path="/test-phonepe" component={wrapInSuspense(TestPhonePe)} />
      <Route path="/websocket-test" component={wrapInSuspense(WebSocketTest)} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={wrapInSuspense(AdminLogin)} />
      <Route path="/admin" component={wrapInAdminRouteSuspense(Admin)} />
      <Route path="/admin/dashboard" component={wrapInAdminRouteSuspense(AdminDashboard)} />
      <Route path="/admin/users" component={wrapInAdminRouteSuspense(AdminUsers)} />
      <Route path="/admin/orders" component={wrapInAdminRouteSuspense(AdminOrders)} />
      <Route path="/admin/products/add" component={wrapInAdminRouteSuspense(AdminAddProductSimple)} />
      <Route path="/admin/products/edit/:id" component={wrapInAdminRouteSuspense(AdminEditProduct)} />
      <Route path="/admin/products/categories" component={wrapInAdminRouteSuspense(AdminCategories)} />
      <Route path="/admin/products" component={wrapInAdminRouteSuspense(AdminProducts)} />
      <Route path="/admin/users/add" component={wrapInAdminRouteSuspense(AdminAddUser)} />
      <Route path="/admin/settings" component={wrapInAdminRouteSuspense(AdminSettings)} />
      
      {/* Admin testing routes - some are accessible without auth for debugging */}
      <Route path="/admin/realtime-fixed" component={wrapInSuspense(AdminRealTimeFixed)} />
      <Route path="/admin/realtime" component={wrapInAdminRouteSuspense(AdminRealTime)} />
      <Route path="/admin/debug" component={wrapInAdminRouteSuspense(AdminDebug)} />
      <Route path="/admin/wsonly" component={wrapInAdminRouteSuspense(AdminWsOnly)} />
      
      <Route component={NotFound} />
    </Switch>
  );

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <WebSocketProvider initialAdminId={1}>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">
                  {router}
                </main>
                <Footer />
              </div>
              <Toaster />
            </WebSocketProvider>
          </TooltipProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
