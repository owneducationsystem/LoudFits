import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';

const TestPhonePe = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  const initiateTestPayment = async (amount: number, success: boolean) => {
    try {
      const response = await fetch('/api/payment/test-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, success })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setTestResults(prev => ({ ...prev, testPayment: data }));
      
      if (data.success) {
        toast({
          title: 'Test Payment Created',
          description: `Order: ${data.data.orderNumber}, Amount: ₹${amount}`,
        });
        
        // Direct to the mock payment page
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to create test payment');
      }
    } catch (err: any) {
      toast({
        title: 'Error Creating Test Payment',
        description: err.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/payment/config');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setConfig(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch PhonePe configuration');
        toast({
          title: 'API Error',
          description: err.message || 'Failed to fetch PhonePe configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
    
    // Also fetch order number for testing
    const fetchOrderNumber = async () => {
      try {
        const response = await fetch('/api/payment/test-order-number');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setOrderNumber(data.orderNumber);
        setTestResults(prev => ({ ...prev, orderNumber: data }));
      } catch (err: any) {
        console.error("Error fetching order number:", err);
      }
    };
    
    fetchOrderNumber();
  }, [toast]);
  
  return (
    <>
      <Helmet>
        <title>PhonePe Test | Loudfits</title>
        <meta name="description" content="Testing PhonePe integration" />
      </Helmet>
      
      <Header />
      
      <main className="container max-w-4xl mx-auto py-12 px-4 md:px-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b pb-6">
            <CardTitle className="text-2xl md:text-3xl font-bold">PhonePe Integration Test</CardTitle>
            <CardDescription className="text-gray-600 text-lg mt-2">
              Testing the PhonePe payment gateway configuration
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#582A34] rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium">Error Loading Configuration</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-2">PhonePe Configuration</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">Merchant ID:</div>
                    <div className="text-sm">{config?.merchantId}</div>
                    
                    <div className="text-sm font-medium">Salt Key:</div>
                    <div className="text-sm">{config?.saltKey}</div>
                    
                    <div className="text-sm font-medium">Salt Index:</div>
                    <div className="text-sm">{config?.saltIndex}</div>
                    
                    <div className="text-sm font-medium">Environment:</div>
                    <div className="text-sm">{config?.environment}</div>
                    
                    <div className="text-sm font-medium">Base URL:</div>
                    <div className="text-sm">{config?.baseUrl}</div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                  <h3 className="font-medium text-lg mb-2">Test Order Number</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Generated order number for testing:
                  </p>
                  
                  {orderNumber ? (
                    <div className="bg-white border border-slate-200 p-3 rounded text-lg font-mono">
                      {orderNumber}
                    </div>
                  ) : (
                    <div className="animate-pulse h-10 bg-slate-200 rounded"></div>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      Generated at: {testResults.orderNumber?.timestamp || 'Loading...'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-2">Test Payments</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You can test the payment flow using the buttons below. This will create a test order and redirect you to the PhonePe payment page.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="bg-white border p-4 rounded-lg">
                      <h4 className="font-medium text-base mb-2">Success Payment Flow</h4>
                      <p className="text-sm text-gray-600 mb-3">Test a successful payment scenario</p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm"
                          className="bg-[#582A34] hover:bg-black"
                          onClick={() => initiateTestPayment(100, true)}
                        >
                          ₹100
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-[#582A34] hover:bg-black"
                          onClick={() => initiateTestPayment(499, true)}
                        >
                          ₹499
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-[#582A34] hover:bg-black"
                          onClick={() => initiateTestPayment(999, true)}
                        >
                          ₹999
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-white border p-4 rounded-lg">
                      <h4 className="font-medium text-base mb-2">Failure Payment Flow</h4>
                      <p className="text-sm text-gray-600 mb-3">Test a payment failure scenario</p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => initiateTestPayment(100, false)}
                        >
                          ₹100
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => initiateTestPayment(499, false)}
                        >
                          ₹499
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => initiateTestPayment(999, false)}
                        >
                          ₹999
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
                    <h4 className="font-medium text-base mb-2">Test Live API</h4>
                    <p className="text-sm text-gray-600 mb-3">Test the actual checkout flow using the API</p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={async () => {
                        try {
                          // Create mock cart data for testing
                          const testOrderData = {
                            amount: {
                              subtotal: "999",
                              tax: "99.9",
                              shipping: "0",
                              discount: "0",
                              total: "1098.9"
                            },
                            cartItems: [
                              {
                                productId: 1,
                                quantity: 1,
                                size: "M",
                                color: "Black",
                                product: {
                                  id: 1,
                                  name: "Test Product",
                                  price: "999",
                                  description: "Test description",
                                  images: ["https://example.com/image.jpg"]
                                }
                              }
                            ],
                            shippingAddress: "123 Test Street, Test City, Test State, 12345",
                            shippingMethod: "standard",
                            paymentMethod: "phonepe"
                          };
                          
                          toast({
                            title: 'Testing API',
                            description: 'Initiating payment through the API...',
                          });
                          
                          const response = await fetch('/api/payment/initiate', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(testOrderData)
                          });
                          
                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                          }
                          
                          const data = await response.json();
                          setTestResults(prev => ({ ...prev, apiTest: data }));
                          
                          if (data.success && data.paymentUrl) {
                            toast({
                              title: 'Payment Initiated',
                              description: `Order: ${data.order.orderNumber}, redirecting to payment gateway...`,
                            });
                            
                            // Redirect to payment URL
                            window.location.href = data.paymentUrl;
                          } else {
                            throw new Error(data.error || 'Failed to initiate payment');
                          }
                        } catch (err: any) {
                          console.error('API test error:', err);
                          toast({
                            title: 'Error Testing API',
                            description: err.message || 'An unknown error occurred',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      Test Full Checkout
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      variant="outline"
                      className="flex items-center"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/payment/test-order-number');
                          const data = await response.json();
                          setOrderNumber(data.orderNumber);
                          setTestResults(prev => ({ ...prev, orderNumber: data }));
                          
                          toast({
                            title: 'New Order Number Generated',
                            description: `Order number: ${data.orderNumber}`,
                          });
                        } catch (err: any) {
                          toast({
                            title: 'Error',
                            description: err.message || 'Failed to generate new order number',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <span>Generate New Order Number</span>
                    </Button>
                  </div>
                </div>
                
                {testResults.testPayment && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100">
                    <h3 className="font-medium text-lg mb-2">Test Payment Details</h3>
                    <div className="bg-white p-3 rounded border border-blue-200 overflow-x-auto">
                      <pre className="text-xs font-mono">
                        {JSON.stringify(testResults.testPayment, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </>
  );
};

export default TestPhonePe;