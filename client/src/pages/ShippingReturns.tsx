import { Truck, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShippingReturns = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue="shipping">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Shipping & Returns</h1>
            <TabsList>
              <TabsTrigger value="shipping" className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="returns" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Returns
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="shipping">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Shipping Information</h2>
                <p className="text-gray-600 mb-4">
                  We aim to deliver your order as quickly and efficiently as possible. Here's everything you need to know about our shipping process.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Processing Time</h3>
                <p className="text-gray-600 mb-2">
                  All orders are processed within 24-48 hours (excluding weekends and holidays) after payment confirmation.
                  Custom-designed products may take an additional 1-2 business days for processing.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Shipping Options</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium">Standard Shipping</h4>
                    <p className="text-gray-600 mb-1">Delivery Time: 3-5 business days (metro cities), 5-7 business days (other locations)</p>
                    <p className="text-gray-600 mb-1">Cost: Free for orders above ₹1999, ₹99 for orders below ₹1999</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium">Express Shipping</h4>
                    <p className="text-gray-600 mb-1">Delivery Time: 1-2 business days</p>
                    <p className="text-gray-600 mb-1">Cost: ₹199 flat rate</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium">International Shipping</h4>
                    <p className="text-gray-600 mb-1">Delivery Time: 10-15 business days</p>
                    <p className="text-gray-600 mb-1">Cost: Calculated at checkout based on destination</p>
                    <p className="text-gray-600 mb-1">Note: Additional customs fees may apply based on your country's regulations</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Tracking Your Order</h3>
                <p className="text-gray-600 mb-4">
                  Once your order is shipped, you'll receive a confirmation email with a tracking number.
                  You can also track your order on our website by visiting the "Track Order" page and entering your order number.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Shipping Policies</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>We currently ship to all states and union territories in India, as well as select international destinations.</li>
                  <li>Orders placed after 2:00 PM IST will be processed the following business day.</li>
                  <li>We are not responsible for delays caused by customs or unforeseen circumstances such as weather conditions or natural disasters.</li>
                  <li>If your package is returned to us due to an incorrect address or failed delivery attempts, you will be responsible for the reshipping costs.</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="returns">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">Returns & Exchanges</h2>
                <p className="text-gray-600 mb-4">
                  We want you to be completely satisfied with your purchase. If you're not, we've made our return and exchange process simple and hassle-free.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Return Policy</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Returns are accepted within 15 days from the date of delivery.</li>
                  <li>Items must be unused, unwashed, and in their original packaging with tags attached.</li>
                  <li>Custom-designed products are non-returnable unless there's a manufacturing defect.</li>
                  <li>Sale items are final sale and cannot be returned unless there's a manufacturing defect.</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">How to Initiate a Return</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  <li>Log into your account and go to your order history.</li>
                  <li>Select the order and item you wish to return.</li>
                  <li>Choose your preferred return option: refund or exchange.</li>
                  <li>Print the return shipping label.</li>
                  <li>Pack the item securely in its original packaging.</li>
                  <li>Attach the return shipping label to the package.</li>
                  <li>Drop off the package at your nearest courier partner location.</li>
                </ol>
                <p className="mt-2 text-gray-600">
                  You can also contact our customer service team at support@loudfits.com for assistance with returns.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Refunds</h3>
                <p className="text-gray-600 mb-2">
                  Once we receive and inspect your return, we'll process your refund. The refund will be issued to your original payment method.
                </p>
                <p className="text-gray-600 mb-2">
                  Processing time: 3-5 business days after receiving the returned item.
                </p>
                <p className="text-gray-600 mb-2">
                  The time it takes for the refund to appear in your account depends on your payment method and financial institution,
                  typically 5-7 business days.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Exchanges</h3>
                <p className="text-gray-600 mb-2">
                  If you'd like to exchange an item for a different size or color, select the "Exchange" option when initiating your return.
                </p>
                <p className="text-gray-600 mb-2">
                  If the exchanged item has a different price, you will be charged or refunded the difference accordingly.
                </p>
                <p className="text-gray-600 mb-2">
                  Exchanges are subject to product availability.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Return Shipping Costs</h3>
                <p className="text-gray-600 mb-2">
                  For returns due to manufacturing defects, incorrect items, or damaged products, return shipping is free.
                </p>
                <p className="text-gray-600 mb-2">
                  For returns due to change of mind or size issues, a flat return shipping fee of ₹99 will be deducted from your refund.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="text-center mt-12 mb-8 py-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-0">
            If you have any questions about shipping or returns, please contact our customer service team at <a href="mailto:support@loudfits.com" className="text-[#582A34] font-medium">support@loudfits.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingReturns;