import { Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Shield className="mr-2 h-6 w-6" />
          Privacy Policy
        </h1>
        
        <p className="text-gray-600 mb-8">
          Last Updated: May 12, 2025
        </p>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Introduction</h2>
            <p className="text-gray-700 mb-4">
              At Loudfits, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
            <p className="text-gray-700">
              This privacy policy applies to all information collected through our website, as well as any related services, sales, marketing, or events.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect several types of information from and about users of our website, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-medium">Personal Identifiers:</span> Name, email address, postal address, phone number, and other similar identifiers provided by you when creating an account, placing an order, or contacting customer service.
              </li>
              <li>
                <span className="font-medium">Commercial Information:</span> Products purchased, obtained, or considered, and other purchasing or consuming histories or tendencies.
              </li>
              <li>
                <span className="font-medium">Internet Activity:</span> Browsing history, search history, and information regarding your interaction with our website.
              </li>
              <li>
                <span className="font-medium">Payment Information:</span> We collect necessary data for processing payments, including credit/debit card numbers, billing addresses, and other payment details. However, we do not store complete payment information on our servers.
              </li>
            </ul>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect in the following ways:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>To provide, operate, and maintain our website</li>
              <li>To process and fulfill your orders, including delivery and payment processing</li>
              <li>To improve, personalize, and expand our website and services</li>
              <li>To understand and analyze how you use our website</li>
              <li>To develop new products, services, features, and functionality</li>
              <li>To communicate with you, provide updates, and respond to inquiries</li>
              <li>To send marketing and promotional communications (with your consent)</li>
              <li>To find and prevent fraud</li>
            </ul>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
            </p>
            <p className="text-gray-700 mb-4">
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
            <p className="text-gray-700">
              We use the following types of cookies:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>
                <span className="font-medium">Essential Cookies:</span> Necessary for the functioning of the website and enable core functionality.
              </li>
              <li>
                <span className="font-medium">Performance Cookies:</span> Help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </li>
              <li>
                <span className="font-medium">Functional Cookies:</span> Enable us to provide enhanced functionality and personalization.
              </li>
              <li>
                <span className="font-medium">Targeting Cookies:</span> Record your visit to our website, the pages you have visited, and the links you have followed to deliver more relevant ads.
              </li>
            </ul>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>The right to access your personal data</li>
              <li>The right to rectify or update your personal data</li>
              <li>The right to erase your personal data</li>
              <li>The right to restrict the processing of your personal data</li>
              <li>The right to object to the processing of your personal data</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise any of these rights, please contact us at privacy@loudfits.com.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Data Security</h2>
            <p className="text-gray-700 mb-4">
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please note that we cannot guarantee that the internet itself is 100% secure.
            </p>
            <p className="text-gray-700">
              Although we will do our best to protect your personal information, transmission of personal information to and from our website is at your own risk. You should only access the website within a secure environment.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              Our website may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
            </p>
            <p className="text-gray-700">
              We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.
            </p>
            <p className="text-gray-700">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>
          
          <Separator />
          
          <section>
            <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>By email: privacy@loudfits.com</li>
              <li>By mail: 123 Fashion Street, Design District, Bangalore, Karnataka 560001, India</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;