import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
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

function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
