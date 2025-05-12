import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { AlertTriangle, ArrowLeft, RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const PaymentError = () => {
  const [, navigate] = useLocation();
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    // Extract error message from URL query params
    const query = new URLSearchParams(window.location.search);
    const message = query.get('message');
    setErrorMessage(message || 'An unknown error occurred with your payment.');
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Payment Error | Loudfits</title>
        <meta name="description" content="Payment processing error - Loudfits" />
      </Helmet>
      
      <Header />
      
      <main className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center border-b pb-6">
            <div className="mx-auto bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-red-600">Payment Error</CardTitle>
            <CardDescription className="text-gray-600 text-lg mt-2">
              We were unable to process your payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{errorMessage}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">What happened?</h3>
                <p className="text-gray-600">
                  Your payment could not be processed due to an error. This could be due to:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Insufficient funds in your account</li>
                  <li>Bank declined the transaction</li>
                  <li>Payment gateway technical issues</li>
                  <li>Network connectivity problems</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">What should you do?</h3>
                <p className="text-gray-600">
                  You can try the following:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                  <li>Check your payment details and try again</li>
                  <li>Try a different payment method</li>
                  <li>Contact your bank if the issue persists</li>
                  <li>Contact our customer support for assistance</li>
                </ul>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button 
              variant="outline"
              className="w-full sm:w-auto" 
              onClick={() => navigate("/cart")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Cart
            </Button>
            
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/checkout")}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              className="w-full sm:w-auto bg-[#582A34] hover:bg-black"
              onClick={() => navigate("/shop")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </>
  );
};

export default PaymentError;