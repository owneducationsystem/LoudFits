import nodemailer from 'nodemailer';
import { User, Order, Product } from '@shared/schema';

/**
 * Email service for sending automated emails to users
 */
class EmailService {
  private transporter!: nodemailer.Transporter;
  private fromEmail!: string;
  private isEnabled: boolean = false;

  constructor() {
    // Configure nodemailer
    try {
      // For production, use your actual SMTP settings
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // or your own SMTP server
        auth: {
          user: process.env.EMAIL_USER || 'youremail@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'yourpassword'
        }
      });

      this.fromEmail = process.env.EMAIL_FROM || 'support@loudfits.com';
      
      // Check if email is configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        this.isEnabled = true;
        console.log('Email service initialized');
      } else {
        console.log('Email service disabled. Set EMAIL_USER and EMAIL_PASSWORD to enable.');
      }
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  /**
   * Send a welcome email to a new user
   * @param user User who registered
   */
  async sendWelcomeEmail(user: User): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!user.email) return false;

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'Welcome to Loudfits!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">Welcome to Loudfits!</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${user.username},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for joining Loudfits! We're excited to have you as part of our community.</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">At Loudfits, we offer premium quality t-shirts with unique designs that make a statement. Browse our collection and find your perfect fit.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/shop" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">SHOP NOW</a>
            </div>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send a login notification email
   * @param user User who logged in
   * @param ipAddress IP address of the login
   * @param device Device information (browser/OS)
   */
  async sendLoginNotificationEmail(user: User, ipAddress?: string, device?: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!user.email) return false;

    try {
      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: 'New Login to Your Loudfits Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">New Login Detected</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${user.username},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">We've detected a new login to your Loudfits account.</p>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              ${ipAddress ? `<p style="margin: 5px 0; font-size: 14px;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
              ${device ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Device:</strong> ${device}</p>` : ''}
            </div>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If this was you, you can ignore this email. If you didn't log in recently, please <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/account/security" style="color: #582A34; text-decoration: underline;">secure your account</a> immediately.</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Login notification email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending login notification email:', error);
      return false;
    }
  }

  /**
   * Send an order confirmation email
   * @param order Order details
   * @param user User who placed the order
   * @param products Products in the order
   */
  async sendOrderConfirmationEmail(order: Order, user: User, products: Product[]): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!user.email) return false;

    try {
      // Format the product items for the email
      const productItems = products.map(product => {
        const quantity = 1; // Default to 1 if we can't find the order item
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">
              <img src="${product.images?.[0] || ''}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${product.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">₹${price.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">${quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eaeaea;">₹${(quantity * price).toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      const subtotal = typeof order.subtotal === 'string' ? parseFloat(order.subtotal) : order.subtotal || 0;
      const shippingCost = typeof order.shippingCost === 'string' ? parseFloat(order.shippingCost) : order.shippingCost || 0;
      const tax = typeof order.tax === 'string' ? parseFloat(order.tax) : order.tax || 0;
      const total = typeof order.total === 'string' ? parseFloat(order.total) : order.total || 0;

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: `Order Confirmation #${order.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">Order Confirmation</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${user.username},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for your order! We've received your order and are processing it now.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Online Payment'}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Status:</strong> ${order.status || 'Processing'}</p>
            </div>
            
            <h2 style="color: #582A34; margin-top: 30px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f8f8f8;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea;">Image</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea;">Product</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea;">Price</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea;">Quantity</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #eaeaea;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productItems}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                  <td style="padding: 10px;">₹${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                  <td style="padding: 10px;">₹${shippingCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
                  <td style="padding: 10px;">₹${tax.toFixed(2)}</td>
                </tr>
                <tr style="background-color: #f8f8f8;">
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; font-weight: bold;">₹${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            
            <h2 style="color: #582A34; margin-top: 30px;">Shipping Address</h2>
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;">${user.username}</p>
              <p style="margin: 5px 0;">${user.address || ''}</p>
              <p style="margin: 5px 0;">${user.city || ''}, ${user.state || ''} ${user.pincode || ''}</p>
              <p style="margin: 5px 0;">${user.country || 'India'}</p>
              <p style="margin: 5px 0;">${user.phoneNumber || ''}</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">You can track your order status <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/track-order/${order.orderNumber}" style="color: #582A34; text-decoration: underline;">here</a>.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you have any questions about your order, please contact our customer service.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for shopping with us!</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent to ${user.email} for order #${order.orderNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }

  /**
   * Send a payment confirmation email
   * @param order Order details
   * @param user User who made the payment
   * @param amount Payment amount
   * @param transactionId Transaction ID
   */
  /**
   * Send a payment confirmation email
   * @param email User's email address
   * @param name User's name or username
   * @param orderNumber Order number reference
   * @param amount Total payment amount
   * @param paymentMethod Payment method used
   */
  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    orderNumber: string,
    amount: string | number,
    paymentMethod: string
  ): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!email) return false;

    try {
      // Convert amount to number if it's a string
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(numericAmount);

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: `Payment Confirmation for Order #${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">Payment Confirmation</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${name},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for your payment! We're pleased to confirm that your payment for order #${orderNumber} has been successfully processed.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${orderNumber}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Amount:</strong> ${formattedAmount}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Method:</strong> ${paymentMethod || 'Online Payment'}</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Your order is now being processed. You can track your order status <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/track-order/${orderNumber}" style="color: #582A34; text-decoration: underline;">here</a>.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you have any questions about your payment or order, please contact our customer service.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for shopping with us!</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Payment confirmation email sent to ${email} for order #${orderNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      return false;
    }
  }

  /**
   * Send an order status update email
   * @param order Order details
   * @param user User who placed the order
   * @param newStatus New order status
   */
  async sendOrderStatusUpdateEmail(order: Order, user: User, newStatus: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!user.email) return false;

    try {
      let statusMessage = '';
      let statusColor = '#333';

      switch (newStatus.toLowerCase()) {
        case 'processing':
          statusMessage = "We're preparing your order for shipment. We'll notify you once it's on the way!";
          statusColor = '#f39c12';
          break;
        case 'shipped':
          statusMessage = "Your order is on the way! You can track your shipment using the link below.";
          statusColor = '#3498db';
          break;
        case 'delivered':
          statusMessage = "Your order has been delivered! We hope you enjoy your Loudfits products.";
          statusColor = '#2ecc71';
          break;
        case 'canceled':
          statusMessage = "Your order has been canceled. If you didn't request this cancellation, please contact our customer service.";
          statusColor = '#e74c3c';
          break;
        default:
          statusMessage = `Your order status has been updated to ${newStatus}.`;
      }

      const mailOptions = {
        from: this.fromEmail,
        to: user.email,
        subject: `Order Status Update: #${order.orderNumber} is now ${newStatus}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">Order Status Update</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${user.username},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">There's an update to your order #${order.orderNumber}.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 12px 24px; border-radius: 5px; font-weight: bold;">
                ${newStatus.toUpperCase()}
              </div>
              <p style="font-size: 16px; line-height: 1.5; color: #333; margin-top: 15px;">${statusMessage}</p>
            </div>
            
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Total Amount:</strong> ₹${typeof order.total === 'string' ? parseFloat(order.total).toFixed(2) : order.total.toFixed(2)}</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">You can track your order or view your order details <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/track-order/${order.orderNumber}" style="color: #582A34; text-decoration: underline;">here</a>.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you have any questions about your order, please contact our customer service.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for shopping with us!</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Order status update email sent to ${user.email} for order #${order.orderNumber} (${newStatus})`);
      return true;
    } catch (error) {
      console.error('Error sending order status update email:', error);
      return false;
    }
  }

  /**
   * Send a payment failure notification email
   * @param order Order details
   * @param user User who attempted the payment
   * @param amount Payment amount
   * @param errorMessage Error message (if available)
   */
  /**
   * Send a payment failure notification email
   * @param email User's email address
   * @param name User's name or username
   * @param orderNumber Order number reference
   * @param amount Payment amount
   * @param errorMessage Error message (if available)
   */
  async sendPaymentFailedEmail(
    email: string,
    name: string,
    orderNumber: string,
    amount: string | number,
    errorMessage?: string
  ): Promise<boolean> {
    if (!this.isEnabled) return false;
    if (!email) return false;

    try {
      // Convert amount to number if it's a string
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(numericAmount);

      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: `Payment Failed for Order #${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://i.imgur.com/YOUR_LOGO_URL.png" alt="Loudfits Logo" style="max-width: 150px;">
            </div>
            <h1 style="color: #582A34; text-align: center;">Payment Failed</h1>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hi ${name},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">We're sorry, but your recent payment attempt for order #${orderNumber} was unsuccessful.</p>
            
            <div style="background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order Number:</strong> ${orderNumber}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment Amount:</strong> ${formattedAmount}</p>
              ${errorMessage ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Error:</strong> ${errorMessage}</p>` : ''}
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Don't worry, your order is still saved. You can try making the payment again by visiting your <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/account/orders" style="color: #582A34; text-decoration: underline;">account orders</a> page.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.WEBSITE_URL || 'https://loudfits.com'}/checkout" style="background-color: #582A34; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">TRY PAYMENT AGAIN</a>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Common reasons for payment failures include:</p>
            <ul style="font-size: 16px; line-height: 1.5; color: #333;">
              <li>Insufficient funds</li>
              <li>Incorrect card details</li>
              <li>Expired card</li>
              <li>Bank declined the transaction</li>
              <li>Temporary banking system issues</li>
            </ul>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">If you continue to face issues, please contact your bank or our customer service for assistance.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Thank you for your understanding.</p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Best regards,<br>The Loudfits Team</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; color: #888; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Loudfits. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Payment failure email sent to ${email} for order #${orderNumber}`);
      return true;
    } catch (error) {
      console.error('Error sending payment failure email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();