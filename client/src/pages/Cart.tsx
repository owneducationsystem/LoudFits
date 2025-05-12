import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { Trash2, ChevronLeft, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCartContext } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@/context/CartContext";

const Cart = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartContext();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Calculate subtotal
  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = parseFloat(item.product.price as any);
    return total + (itemPrice * item.quantity);
  }, 0);

  // Apply fixed shipping fee
  const shippingCost = subtotal >= 1999 ? 0 : 150;
  
  // Calculate total
  const total = subtotal + shippingCost - discount;

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(item.productId, item.size, item.color, newQuantity);
  };

  const handleRemoveItem = (item: CartItem) => {
    removeFromCart(item.productId, item.size, item.color);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingCoupon(true);
    
    // Simulate coupon validation
    setTimeout(() => {
      if (couponCode.toUpperCase() === "WELCOME10") {
        const discountAmount = subtotal * 0.1; // 10% discount
        setDiscount(discountAmount);
        setAppliedCoupon(couponCode);
        toast({
          title: "Coupon applied",
          description: "You received a 10% discount on your order.",
        });
      } else if (couponCode.toUpperCase() === "FREESHIP") {
        setDiscount(shippingCost);
        setAppliedCoupon(couponCode);
        toast({
          title: "Coupon applied",
          description: "You received free shipping on your order.",
        });
      } else {
        toast({
          title: "Invalid coupon",
          description: "The coupon code you entered is invalid or expired.",
          variant: "destructive",
        });
      }
      setIsApplyingCoupon(false);
    }, 1000);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    toast({
      title: "Coupon removed",
      description: "The coupon has been removed from your order.",
    });
  };

  const handleCheckout = () => {
    // Simulate checkout process
    toast({
      title: "Processing checkout",
      description: "You will be redirected to the payment gateway.",
    });
    
    // Simulate redirect after a delay
    setTimeout(() => {
      clearCart();
      navigate("/checkout/success");
      
      // For demo purposes, display a toast message
      toast({
        title: "Order Placed",
        description: "Thank you for your order! Your order has been placed successfully.",
      });
    }, 2000);
  };

  const cartItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <>
      <Helmet>
        <title>Your Cart - Loudfits</title>
        <meta name="description" content="View and manage the items in your shopping cart. Proceed to checkout to complete your purchase." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Button
              onClick={() => navigate("/shop")}
              className="bg-black hover:bg-[#582A34]"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="hidden md:flex text-sm text-gray-500 mb-4 px-4">
                  <div className="w-1/2">Product</div>
                  <div className="w-1/6 text-center">Price</div>
                  <div className="w-1/6 text-center">Quantity</div>
                  <div className="w-1/6 text-center">Total</div>
                </div>
                
                <Separator className="mb-4" />
                
                {/* Cart Items List */}
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={cartItemVariants}
                      className="flex flex-col md:flex-row items-center gap-4 p-4 border border-gray-100 rounded-lg"
                    >
                      {/* Product Image and Details */}
                      <div className="flex items-center gap-4 w-full md:w-1/2">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {item.product.images.length > 0 ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.customization?.frontImage || item.customization?.image ? (
                            <div 
                              className="w-full h-full flex items-center justify-center"
                              style={{ backgroundColor: item.color.toLowerCase() }}
                            >
                              {/* Front design */}
                              <div
                                style={{
                                  position: 'relative',
                                  top: `${item.customization.frontDesign ? 
                                    (item.customization.frontDesign.vertical - 50) / 2 : 
                                    (item.customization.verticalPosition !== undefined ? 
                                      (item.customization.verticalPosition - 50) / 2 : 
                                      (item.customization.position !== undefined ? (item.customization.position - 50) / 2 : 0))}%`,
                                  left: `${item.customization.frontDesign ?
                                    (item.customization.frontDesign.horizontal - 50) / 2 :
                                    (item.customization.horizontalPosition !== undefined ? 
                                      (item.customization.horizontalPosition - 50) / 2 : 0)}%`,
                                  transform: `
                                    scale(${item.customization.frontDesign ? 
                                      item.customization.frontDesign.size / 70 : 
                                      (item.customization.size ? item.customization.size / 70 : 0.7)}) 
                                    rotate(${item.customization.frontDesign ?
                                      item.customization.frontDesign.rotation :
                                      (item.customization.rotation !== undefined ? item.customization.rotation : 0)}deg)
                                    ${(item.customization.frontDesign && item.customization.frontDesign.flipped) ||
                                      (item.customization.flipped !== undefined && item.customization.flipped) ? 'scaleX(-1)' : ''}
                                  `,
                                  maxWidth: '80%',
                                  maxHeight: '80%'
                                }}
                              >
                                <img
                                  src={item.customization.frontImage || item.customization.image}
                                  alt="Custom design (front)"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            <span>Size: {item.size}</span>
                            <span className="mx-2">•</span>
                            <span>Color: {item.color}</span>
                          </div>
                          {item.customization && (
                            <div className="text-xs text-[#582A34] mt-1 flex items-center">
                              <svg 
                                className="w-3 h-3 mr-1" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                              <span className="font-medium">Custom Design</span>
                              <span className="text-gray-500 ml-1">
                                {item.customization.frontImage && item.customization.backImage ? 'Front & Back' : 'Front Only'}
                                {item.customization.frontDesign 
                                  ? ` (${Math.round(item.customization.frontDesign.size)}% size${
                                     item.customization.frontDesign.rotation ? `, ${item.customization.frontDesign.rotation}° rotation` : ''}${
                                     item.customization.frontDesign.flipped ? ', flipped' : ''})`
                                  : ` (${Math.round(item.customization.size)}% size${
                                     item.customization.rotation !== undefined ? `, ${item.customization.rotation}° rotation` : ''}${
                                     item.customization.flipped !== undefined && item.customization.flipped ? ', flipped' : ''})`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Price (Mobile and Desktop) */}
                      <div className="flex justify-between items-center w-full md:w-1/2">
                        <div className="md:hidden font-medium">Price:</div>
                        <div className="md:w-1/3 text-center font-medium">
                          ₹{parseFloat(item.product.price as any).toFixed(2)}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center md:w-1/3 justify-center">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="h-8 w-8 border border-gray-300 rounded-l-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <div className="h-8 w-8 border-t border-b border-gray-300 flex items-center justify-center">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="h-8 w-8 border border-gray-300 rounded-r-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Item Total Price */}
                        <div className="md:w-1/3 text-center font-bold">
                          ₹{(parseFloat(item.product.price as any) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      
                      {/* Remove Item Button */}
                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="text-red-500 hover:text-red-700 transition-colors md:ml-2"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/shop")}
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      clearCart();
                      toast({
                        title: "Cart cleared",
                        description: "All items have been removed from your cart.",
                      });
                    }}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : "FREE"}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-[#582A34]">
                      <span>Discount ({appliedCoupon})</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Coupon Code */}
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Apply Coupon</h3>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div>
                        <div className="font-medium">{appliedCoupon}</div>
                        <div className="text-sm text-[#582A34]">Saved ₹{discount.toFixed(2)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-grow"
                      />
                      <Button
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="bg-black hover:bg-[#582A34]"
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Try WELCOME10 for 10% off or FREESHIP for free shipping
                  </div>
                </div>
                
                {/* Checkout Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-[#582A34] hover:bg-black text-white py-6 text-lg"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                </motion.div>
                
                {/* Payment Options */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">We accept:</p>
                  <div className="flex justify-center gap-2">
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196578.png" alt="Visa" className="h-8" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196561.png" alt="Mastercard" className="h-8" />
                    <img src="https://download.logo.wine/logo/PhonePe/PhonePe-Logo.wine.png" alt="PhonePe" className="h-8" />
                    <img src="https://cdn-icons-png.flaticon.com/512/196/196566.png" alt="PayPal" className="h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
