import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FAQ = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <HelpCircle className="mr-2 h-6 w-6" />
          Frequently Asked Questions
        </h1>
        
        <p className="text-gray-600 mb-8">
          Find answers to the most common questions about our products, orders, shipping, returns, and more.
        </p>
        
        <Separator className="my-8" />
        
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Orders & Payment</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="order-1">
              <AccordionTrigger>How can I track my order?</AccordionTrigger>
              <AccordionContent>
                Once your order is shipped, you'll receive a tracking number via email.
                You can also check your order status on our <a href="/track-order" className="text-[#582A34] font-medium">Track Order</a> page by entering your order number.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="order-2">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major credit/debit cards, UPI, net banking, wallets, and PhonePe.
                All transactions are secure and encrypted.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="order-3">
              <AccordionTrigger>Can I modify or cancel my order after placing it?</AccordionTrigger>
              <AccordionContent>
                You can cancel your order within 12 hours of placing it if it hasn't been shipped yet.
                To modify an order, please cancel and place a new one. Contact our customer service for assistance.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Shipping & Delivery</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="shipping-1">
              <AccordionTrigger>How long will it take to receive my order?</AccordionTrigger>
              <AccordionContent>
                Standard delivery takes 3-5 business days for metro cities and 5-7 business days for other locations.
                Express delivery (additional charges apply) takes 1-2 business days.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="shipping-2">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                Yes, we ship internationally to select countries. International shipping typically takes 10-15 business days.
                Additional customs fees may apply based on your country's regulations.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="shipping-3">
              <AccordionTrigger>Is shipping free?</AccordionTrigger>
              <AccordionContent>
                We offer free standard shipping on all orders above ₹1999 within India.
                For orders below this amount, a flat shipping fee of ₹99 is charged.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Products & Sizing</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="product-1">
              <AccordionTrigger>What material are your t-shirts made of?</AccordionTrigger>
              <AccordionContent>
                Our t-shirts are made from 100% premium combed cotton for maximum comfort and durability.
                The fabric is pre-shrunk and has a soft, breathable feel.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="product-2">
              <AccordionTrigger>How do I care for my t-shirts?</AccordionTrigger>
              <AccordionContent>
                We recommend machine washing in cold water and tumble drying on low heat.
                Avoid using bleach or harsh detergents to preserve print quality and fabric life.
                For best results, turn your t-shirt inside out before washing.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="product-3">
              <AccordionTrigger>How do I find my size?</AccordionTrigger>
              <AccordionContent>
                Please refer to our comprehensive <a href="/size-guide" className="text-[#582A34] font-medium">Size Guide</a> page.
                If you're between sizes, we recommend going up a size for a more comfortable fit.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Returns & Exchanges</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="return-1">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                We offer a 15-day return policy from the date of delivery. Items must be unused,
                unwashed, and in their original packaging with tags attached. Please see our
                <a href="/shipping-returns" className="text-[#582A34] font-medium ml-1">Shipping & Returns</a> page for detailed information.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="return-2">
              <AccordionTrigger>How do I initiate a return or exchange?</AccordionTrigger>
              <AccordionContent>
                To initiate a return or exchange, log into your account and go to your order history.
                Select the order and item you wish to return and follow the prompts.
                You can also contact our customer service for assistance.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="return-3">
              <AccordionTrigger>How long do refunds take to process?</AccordionTrigger>
              <AccordionContent>
                Once we receive your returned items, refunds are processed within 3-5 business days.
                The time it takes for the amount to reflect in your account depends on your payment method
                and financial institution, typically 5-7 business days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="text-center mt-12 mb-8 py-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-0">
            Contact our customer service team at <a href="mailto:support@loudfits.com" className="text-[#582A34] font-medium">support@loudfits.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;