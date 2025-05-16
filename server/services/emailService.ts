import mail from '@sendgrid/mail';
import { NotificationType } from './notificationService';

// Initialize SendGrid client with environment variable
// Note: Set up with process.env.SENDGRID_API_KEY later when API key is available
if (process.env.SENDGRID_API_KEY) {
  mail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid email service initialized');
} else {
  console.warn('SendGrid API key not found. Email sending will be disabled.');
}

// Email template types
export enum EmailTemplate {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  SHIPPING_CONFIRMATION = 'shipping_confirmation',
  PASSWORD_RESET = 'password_reset',
  ORDER_STATUS_UPDATE = 'order_status_update',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_FAILED = 'payment_failed',
}

// Interface for email data
export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: any[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

class EmailService {
  private senderEmail: string = 'orders@loudfits.com';
  private senderName: string = 'Loudfits Team';
  
  // Check if the service is configured properly
  private get isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }
  
  /**
   * Send an email using the provided email data
   * @param emailData The email data to send
   * @returns A promise that resolves when the email is sent
   */
  async sendEmail(emailData: EmailData): Promise<boolean> {
    // If not configured, return false (but don't throw error)
    if (!this.isConfigured) {
      console.log('Email service not configured. Would have sent:', JSON.stringify(emailData, null, 2));
      return false;
    }
    
    try {
      const msg = {
        to: emailData.to,
        from: emailData.from || {
          email: this.senderEmail,
          name: this.senderName
        },
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        // Add optional fields if present
        ...(emailData.cc && { cc: emailData.cc }),
        ...(emailData.bcc && { bcc: emailData.bcc }),
        ...(emailData.replyTo && { replyTo: emailData.replyTo }),
        ...(emailData.attachments && { attachments: emailData.attachments }),
        ...(emailData.templateId && { templateId: emailData.templateId }),
        ...(emailData.dynamicTemplateData && { dynamicTemplateData: emailData.dynamicTemplateData })
      };
      
      await mail.send(msg);
      console.log(`Email sent to ${emailData.to}: ${emailData.subject}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  /**
   * Send a welcome email to a new user
   * @param email User's email address
   * @param name User's name
   * @returns A promise that resolves when the email is sent
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Loudfits!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #582A34; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Loudfits!</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>Thank you for joining Loudfits. We're excited to have you as part of our community!</p>
          <p>At Loudfits, we offer a wide range of trendy t-shirts with unique designs that help you express your personality.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse our latest collections</li>
            <li>Save your favorite items to your wishlist</li>
            <li>Track your orders easily</li>
            <li>Get exclusive access to new arrivals and special offers</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://loudfits.com/shop" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Shopping</a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
          <p>If you have any questions, please contact our customer support at support@loudfits.com</p>
        </div>
      </div>
    `;
    
    const text = `Welcome to Loudfits, ${name}! Thank you for joining. Browse our latest collections, save your favorites, and track your orders easily. Visit us at https://loudfits.com/shop to start shopping.`;
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
  
  /**
   * Send an order confirmation email
   * @param email User's email address
   * @param name User's name
   * @param orderNumber Order number
   * @param orderDetails Order details
   * @returns A promise that resolves when the email is sent
   */
  async sendOrderConfirmationEmail(
    email: string, 
    name: string, 
    orderNumber: string, 
    orderDetails: any
  ): Promise<boolean> {
    const subject = `Order Confirmation #${orderNumber}`;
    
    // Format the items HTML
    const itemsHtml = orderDetails.items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.productImage}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.productName}<br>
          <span style="color: #777; font-size: 12px;">Size: ${item.size}, Color: ${item.color}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${parseFloat(item.price).toFixed(2)}</td>
      </tr>
    `).join('');
    
    // Format the totals
    const subtotal = parseFloat(orderDetails.subtotal).toFixed(2);
    const shipping = parseFloat(orderDetails.shippingCost).toFixed(2);
    const tax = parseFloat(orderDetails.tax).toFixed(2);
    const discount = orderDetails.discount ? parseFloat(orderDetails.discount).toFixed(2) : '0.00';
    const total = parseFloat(orderDetails.total).toFixed(2);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #582A34; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmation</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>Thank you for your order! We're processing it now and will ship it soon.</p>
          <p>Order Number: <strong>${orderNumber}</strong></p>
          <p>Order Date: <strong>${new Date().toLocaleDateString()}</strong></p>
          
          <h3 style="margin-top: 30px;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: left;">Details</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; text-align: right;">
            <p><span style="display: inline-block; width: 100px;">Subtotal:</span> ₹${subtotal}</p>
            <p><span style="display: inline-block; width: 100px;">Shipping:</span> ₹${shipping}</p>
            <p><span style="display: inline-block; width: 100px;">Tax:</span> ₹${tax}</p>
            ${parseFloat(discount) > 0 ? `<p><span style="display: inline-block; width: 100px;">Discount:</span> -₹${discount}</p>` : ''}
            <p style="font-weight: bold; font-size: 18px;"><span style="display: inline-block; width: 100px;">Total:</span> ₹${total}</p>
          </div>
          
          <h3 style="margin-top: 30px;">Shipping Address</h3>
          <p>
            ${orderDetails.shippingAddress.fullName || name}<br>
            ${orderDetails.shippingAddress.address}<br>
            ${orderDetails.shippingAddress.addressLine2 ? orderDetails.shippingAddress.addressLine2 + '<br>' : ''}
            ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.postalCode}<br>
            ${orderDetails.shippingAddress.country}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://loudfits.com/orders/${orderNumber}" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
          <p>If you have any questions, please contact our customer support at support@loudfits.com</p>
        </div>
      </div>
    `;
    
    const text = `Order Confirmation #${orderNumber}\n\nHello ${name},\n\nThank you for your order! We're processing it now and will ship it soon.\n\nOrder Number: ${orderNumber}\nOrder Date: ${new Date().toLocaleDateString()}\n\nShipping Address:\n${orderDetails.shippingAddress.fullName || name}\n${orderDetails.shippingAddress.address}\n${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state} ${orderDetails.shippingAddress.postalCode}\n${orderDetails.shippingAddress.country}\n\nTotal: ₹${total}\n\nTrack your order at: https://loudfits.com/orders/${orderNumber}\n\nIf you have any questions, please contact our customer support at support@loudfits.com`;
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
  
  /**
   * Send an order status update email
   * @param email User's email address
   * @param name User's name
   * @param orderNumber Order number
   * @param status New status
   * @param additionalInfo Additional information
   * @returns A promise that resolves when the email is sent
   */
  async sendOrderStatusUpdateEmail(
    email: string, 
    name: string, 
    orderNumber: string, 
    status: string,
    additionalInfo?: string
  ): Promise<boolean> {
    const subject = `Order Update: #${orderNumber} is now ${status}`;
    
    // Different messages based on status
    let statusMessage = '';
    let statusClass = '';
    
    switch(status.toLowerCase()) {
      case 'processing':
        statusMessage = 'We\'re preparing your order for shipment.';
        statusClass = 'status-processing';
        break;
      case 'shipped':
        statusMessage = 'Your order has been shipped and is on its way to you!';
        statusClass = 'status-shipped';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered. We hope you enjoy your purchase!';
        statusClass = 'status-delivered';
        break;
      case 'cancelled':
        statusMessage = 'Your order has been cancelled.';
        statusClass = 'status-cancelled';
        break;
      default:
        statusMessage = `Your order status is now: ${status}.`;
        statusClass = 'status-default';
    }
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #582A34; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Update</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>We're writing to let you know that your order #${orderNumber} has been updated.</p>
          
          <div style="margin: 30px 0; padding: 15px; border-radius: 4px; ${statusClass === 'status-processing' ? 'background-color: #e3f2fd; border-left: 4px solid #2196f3;' : 
                                                                           statusClass === 'status-shipped' ? 'background-color: #e8f5e9; border-left: 4px solid #4caf50;' :
                                                                           statusClass === 'status-delivered' ? 'background-color: #f1f8e9; border-left: 4px solid #8bc34a;' :
                                                                           statusClass === 'status-cancelled' ? 'background-color: #ffebee; border-left: 4px solid #f44336;' :
                                                                           'background-color: #f5f5f5; border-left: 4px solid #9e9e9e;'}">
            <h3 style="margin-top: 0;">Status: ${status.toUpperCase()}</h3>
            <p>${statusMessage}</p>
            ${additionalInfo ? `<p>${additionalInfo}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://loudfits.com/orders/${orderNumber}" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
          <p>If you have any questions, please contact our customer support at support@loudfits.com</p>
        </div>
      </div>
    `;
    
    const text = `Order Update: #${orderNumber} is now ${status}\n\nHello ${name},\n\nWe're writing to let you know that your order #${orderNumber} has been updated.\n\nStatus: ${status.toUpperCase()}\n${statusMessage}\n${additionalInfo || ''}\n\nView your order details at: https://loudfits.com/orders/${orderNumber}\n\nIf you have any questions, please contact our customer support at support@loudfits.com`;
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
  
  /**
   * Send a payment confirmation email
   * @param email User's email address
   * @param name User's name
   * @param orderNumber Order number
   * @param amount Payment amount
   * @param paymentMethod Payment method
   * @returns A promise that resolves when the email is sent
   */
  async sendPaymentConfirmationEmail(
    email: string, 
    name: string, 
    orderNumber: string, 
    amount: string,
    paymentMethod: string
  ): Promise<boolean> {
    const subject = `Payment Confirmation: Order #${orderNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #582A34; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmation</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>We're writing to confirm that we've received your payment for order #${orderNumber}.</p>
          
          <div style="margin: 30px 0; padding: 15px; border-radius: 4px; background-color: #e8f5e9; border-left: 4px solid #4caf50;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> ₹${parseFloat(amount).toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
          </div>
          
          <p>Your order is now being processed and will be shipped soon.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://loudfits.com/orders/${orderNumber}" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
          <p>If you have any questions, please contact our customer support at support@loudfits.com</p>
        </div>
      </div>
    `;
    
    const text = `Payment Confirmation: Order #${orderNumber}\n\nHello ${name},\n\nWe're writing to confirm that we've received your payment for order #${orderNumber}.\n\nPayment Details:\nAmount: ₹${parseFloat(amount).toFixed(2)}\nPayment Method: ${paymentMethod}\nDate: ${new Date().toLocaleDateString()}\nOrder Number: ${orderNumber}\n\nYour order is now being processed and will be shipped soon.\n\nView your order details at: https://loudfits.com/orders/${orderNumber}\n\nIf you have any questions, please contact our customer support at support@loudfits.com`;
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
  
  /**
   * Send a payment failed email
   * @param email User's email address
   * @param name User's name
   * @param orderNumber Order number
   * @param amount Payment amount
   * @param errorMessage Error message
   * @returns A promise that resolves when the email is sent
   */
  async sendPaymentFailedEmail(
    email: string, 
    name: string, 
    orderNumber: string, 
    amount: string,
    errorMessage?: string
  ): Promise<boolean> {
    const subject = `Payment Failed: Order #${orderNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #582A34; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Failed</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p>Hello ${name},</p>
          <p>We're writing to inform you that the payment for your order #${orderNumber} was not successful.</p>
          
          <div style="margin: 30px 0; padding: 15px; border-radius: 4px; background-color: #ffebee; border-left: 4px solid #f44336;">
            <h3 style="margin-top: 0;">Payment Details</h3>
            <p><strong>Amount:</strong> ₹${parseFloat(amount).toFixed(2)}</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            ${errorMessage ? `<p><strong>Error:</strong> ${errorMessage}</p>` : ''}
          </div>
          
          <p>Please check your payment details and try again. Your order is saved and you can complete the payment from your account.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://loudfits.com/checkout/${orderNumber}" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Try Payment Again</a>
          </div>
        </div>
        <div style="background-color: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
          <p>If you have any questions, please contact our customer support at support@loudfits.com</p>
        </div>
      </div>
    `;
    
    const text = `Payment Failed: Order #${orderNumber}\n\nHello ${name},\n\nWe're writing to inform you that the payment for your order #${orderNumber} was not successful.\n\nPayment Details:\nAmount: ₹${parseFloat(amount).toFixed(2)}\nOrder Number: ${orderNumber}\n${errorMessage ? `Error: ${errorMessage}\n` : ''}\n\nPlease check your payment details and try again. Your order is saved and you can complete the payment from your account.\n\nTry payment again at: https://loudfits.com/checkout/${orderNumber}\n\nIf you have any questions, please contact our customer support at support@loudfits.com`;
    
    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();