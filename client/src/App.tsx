import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Customize from "@/pages/Customize";
import Cart from "@/pages/Cart";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/not-found";

function App() {
  return (
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
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </CartProvider>
  );
}

export default App;
