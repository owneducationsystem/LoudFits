import { FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TermsConditions = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <FileText className="mr-2 h-6 w-6" />
          Terms and Conditions
        </h1>
        
        <p className="text-gray-600 mb-8">
          Last Updated: May 12, 2025
        </p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Introduction</h2>
            <p className="text-gray-700 mb-4">
              These Terms and Conditions ("Terms") govern your use of the Loudfits website and services, including any content, functionality, and services offered on or through www.loudfits.com ("Website").
            </p>
            <p className="text-gray-700">
              By using our Website, you accept and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use our Website.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">User Accounts</h2>
            <p className="text-gray-700 mb-4">
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for safeguarding the password you use to access the Website and for any activities or actions under your password. We encourage you to use a strong password and not to share it with any third party.
            </p>
            <p className="text-gray-700">
              You agree to notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Products and Orders</h2>
            <p className="text-gray-700 mb-4">
              All products displayed on our Website are subject to availability. We reserve the right to discontinue any product at any time.
            </p>
            <p className="text-gray-700 mb-4">
              We take reasonable steps to ensure that the colors, designs, and descriptions of our products are accurate. However, we cannot guarantee that your computer's display of the colors or the physical products will be exactly as displayed.
            </p>
            <p className="text-gray-700 mb-4">
              By placing an order, you are making an offer to purchase. We reserve the right to refuse or cancel any order for any reason, including but not limited to product unavailability, errors in pricing or description, or concerns about fraudulent activity.
            </p>
            <p className="text-gray-700">
              Once an order is placed, you will receive an order confirmation email. This email is an acknowledgment that we have received your order, but it does not constitute acceptance of your order. The contract for sale will only be formed when we send you a shipping confirmation email.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Pricing and Payment</h2>
            <p className="text-gray-700 mb-4">
              All prices are in Indian Rupees (INR) and include applicable taxes unless stated otherwise. Shipping costs, if applicable, will be added at checkout.
            </p>
            <p className="text-gray-700 mb-4">
              We reserve the right to change prices at any time without prior notice. The price applicable to your order will be the price displayed on the Website at the time you place your order.
            </p>
            <p className="text-gray-700 mb-4">
              Payment must be made at the time of placing an order. We accept various payment methods as displayed on our Website. By providing your payment information, you represent and warrant that you have the legal right to use the payment method you provide.
            </p>
            <p className="text-gray-700">
              We use secure payment processing services from trusted third-party providers. However, we are not responsible for any issues or errors with payment processing services.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Shipping and Delivery</h2>
            <p className="text-gray-700 mb-4">
              We aim to deliver products within the estimated delivery times indicated on our Website. However, delivery times are not guaranteed and may vary due to factors beyond our control.
            </p>
            <p className="text-gray-700 mb-4">
              Risk of loss and title for items purchased from our Website pass to you upon delivery of the items to the carrier. You are responsible for filing any claims with the carrier for damaged or lost shipments.
            </p>
            <p className="text-gray-700">
              International customers may be subject to import duties and taxes, which are your responsibility as the customer.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Returns and Refunds</h2>
            <p className="text-gray-700 mb-4">
              Please see our Returns and Refunds Policy on our Shipping & Returns page for detailed information about returns, exchanges, and refunds.
            </p>
            <p className="text-gray-700">
              Custom-designed products are non-returnable unless there's a manufacturing defect. Sale items are final sale and cannot be returned unless there's a manufacturing defect.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Website and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof), are owned by Loudfits, its licensors, or other providers of such material and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p className="text-gray-700 mb-4">
              You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Website without our prior written consent.
            </p>
            <p className="text-gray-700">
              The Loudfits name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Loudfits or its affiliates. You may not use such marks without our prior written permission.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">User Content</h2>
            <p className="text-gray-700 mb-4">
              Our Website may allow you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material. By providing such material, you grant us a non-exclusive, royalty-free, transferable, sub-licensable, worldwide license to use the material in connection with the operation of our business.
            </p>
            <p className="text-gray-700 mb-4">
              You represent and warrant that your material does not violate anyone's rights, including copyright, trademark, privacy, or other personal or proprietary rights, and that it does not contain any material that is false, defamatory, obscene, threatening, or otherwise unlawful.
            </p>
            <p className="text-gray-700">
              We reserve the right to remove any material that we consider inappropriate, offensive, or in violation of these Terms.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the fullest extent permitted by applicable law, Loudfits, its affiliates, officers, directors, employees, agents, suppliers, or licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Website.
            </p>
            <p className="text-gray-700">
              In no event shall our total liability to you for all claims, damages, losses, and causes of action exceed the amount paid by you, if any, for accessing our Website or purchasing products through our Website during the six (6) months preceding your claim.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Indemnification</h2>
            <p className="text-gray-700">
              You agree to defend, indemnify, and hold harmless Loudfits, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Website.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any legal action or proceeding arising out of or related to these Terms shall be instituted exclusively in the courts of Bangalore, Karnataka, India.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Changes to These Terms</h2>
            <p className="text-gray-700 mb-4">
              We may revise and update these Terms from time to time at our sole discretion. All changes are effective immediately when we post them and apply to all access to and use of the Website thereafter.
            </p>
            <p className="text-gray-700">
              Your continued use of the Website following the posting of revised Terms means that you accept and agree to the changes.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>By email: legal@loudfits.com</li>
              <li>By mail: 123 Fashion Street, Design District, Bangalore, Karnataka 560001, India</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;