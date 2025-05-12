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
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-lg mb-2">Test Payments</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You can test the payment flow using the buttons below. This will create a test order and redirect you to the PhonePe payment page.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-2">
                    <Button 
                      className="bg-[#582A34] hover:bg-black flex items-center"
                      onClick={() => {
                        toast({
                          title: 'Coming Soon',
                          description: 'Test payment functionality will be implemented soon',
                        });
                      }}
                    >
                      <span>Test Payment</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
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