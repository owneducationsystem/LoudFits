import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Plus, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentMethod {
  id: number;
  type: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const PaymentsPage = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    } else {
      // Sample data - would be replaced with real API call
      setPaymentMethods([
        {
          id: 1,
          type: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2025,
          isDefault: true
        },
        {
          id: 2,
          type: "mastercard",
          last4: "5678",
          expMonth: 10,
          expYear: 2024,
          isDefault: false
        }
      ]);
    }
  }, [currentUser, navigate]);

  const handleRemovePayment = (id: number) => {
    setPaymentMethods(prev => prev.filter(method => method.id !== id));
    toast({
      title: "Payment method removed",
      description: "Your payment method has been removed successfully.",
    });
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
    toast({
      title: "Default payment method updated",
      description: "Your default payment method has been updated.",
    });
  };

  const getCardIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return "💳"; // Replace with actual card icons from your icon library
      case 'mastercard':
        return "💳";
      case 'amex':
        return "💳";
      default:
        return "💳";
    }
  };

  return (
    <>
      <Helmet>
        <title>Payment Methods - Loudfits</title>
        <meta 
          name="description" 
          content="Manage your payment methods for faster checkout on Loudfits."
        />
      </Helmet>
      
      <div className="max-w-2xl mx-auto py-4 px-4 md:py-8">
        {/* Mobile back button */}
        <button 
          onClick={() => navigate("/account")}
          className="flex items-center text-gray-600 mb-4 md:hidden"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          <span>Back to Account</span>
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast({
              title: "Feature coming soon",
              description: "Adding new payment methods will be available soon.",
            })}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Payment
          </Button>
        </div>
        
        {currentUser ? (
          <>
            {paymentMethods.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No payment methods found</h3>
                <p className="text-gray-500 mb-4">You don't have any payment methods saved yet</p>
                <Button 
                  onClick={() => toast({
                    title: "Feature coming soon",
                    description: "Adding new payment methods will be available soon.",
                  })}
                  className="inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <div className="text-xl">{getCardIcon(method.type)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium capitalize">{method.type}</h3>
                                {method.isDefault && (
                                  <span className="bg-[#582A34]/10 text-[#582A34] text-xs px-2 py-0.5 rounded">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm mt-1">•••• •••• •••• {method.last4}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Expires {method.expMonth}/{method.expYear}
                              </p>
                              
                              <div className="flex gap-4 mt-3">
                                <button
                                  onClick={() => handleRemovePayment(method.id)}
                                  className="text-sm text-gray-600 hover:text-red-600"
                                >
                                  Remove
                                </button>
                                {!method.isDefault && (
                                  <button
                                    onClick={() => handleSetDefault(method.id)}
                                    className="text-sm text-[#582A34]"
                                  >
                                    Set as default
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading account information...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaymentsPage;