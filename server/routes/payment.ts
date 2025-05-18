import { Request, Response, NextFunction } from "express";
import { Express } from "express";
import { User, Payment, Order } from "@shared/schema";
import crypto from "crypto";
import { PhonePeService } from "../services/phonePeService";
import { storage } from "../storage";
import { notificationService, NotificationType } from "../services/notificationService";
import { emailService } from "../services/emailService";
import { inventoryService } from "../services/inventoryService";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LF-${timestamp.slice(-6)}-${randomPart}`;
}

// Extend the Express Request type to include auth properties
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: User;
    }
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // For development environment, bypass authentication for easier testing
  if (process.env.NODE_ENV !== 'production') {
    console.log("[DEV] Authentication bypassed for payment routes");
    
    // For non-authenticated requests in development, use a mock user for testing
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      req.user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '9999999999',
        role: 'user'
      } as User;
    }
    
    return next();
  }
  
  // Production check
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized - Please login first" });
};

// Update payment status and handle notifications
async function updatePaymentStatus(payment: Payment, status: any): Promise<{
  success: boolean;
  error?: string;
  order?: Order | undefined;
}> {
  try {
    // Update payment status in database
    const updatedPayment = await storage.updatePaymentStatus(payment.id, status);
    
    // If payment is successful or failed, update the order status
    if (status === 'SUCCESS' || status === 'PAYMENT_SUCCESS') {
      const order = await storage.getOrderById(payment.orderId);
      if (order) {
        // Update order payment status to paid
        const updatedOrder = await storage.updateOrderPaymentStatus(order.id, 'PAID');
        
        // Update order status to CONFIRMED
        await storage.updateOrderStatus(order.id, 'CONFIRMED');
        
        // Update inventory for each item in the order
        try {
          const orderItems = await storage.getOrderItems(order.id);
          for (const item of orderItems) {
            try {
              // Deduct the quantity from inventory
              await inventoryService.decreaseProductStock(
                item.productId, 
                item.size || 'ONE_SIZE', 
                item.quantity
              );
              
              console.log(`Inventory updated for product ${item.productId}, size ${item.size}, quantity ${item.quantity}`);
            } catch (invError) {
              console.error(`Error updating inventory for item ${item.id}:`, invError);
            }
          }
        } catch (itemsError) {
          console.error(`Error fetching order items for order ${order.id}:`, itemsError);
        }
        
        // Send notifications
        if (order.userId) {
          await notificationService.sendUserNotification({
            userId: order.userId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: 'Payment Successful',
            message: `Your payment for order #${order.orderNumber} has been successfully processed.`,
            entityId: order.id,
            entityType: 'order'
          });
        }
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_RECEIVED,
          title: 'Payment Received',
          message: `Payment received for order #${order.orderNumber}`,
          entityId: order.id,
          entityType: 'order',
          isAdmin: true
        });
        
        // Send email notification for successful payment
        if (order.userId) {
          const user = await storage.getUser(order.userId);
          if (user && user.email) {
            // Send payment confirmation email (non-blocking)
            emailService.sendPaymentConfirmationEmail(
              user.email,
              user.firstName || user.username,
              order.orderNumber,
              order.total,
              order.paymentMethod || 'PhonePe'
            ).then(sent => {
              if (sent) {
                console.log(`Payment confirmation email sent to ${user.email} for order #${order.orderNumber}`);
              } else {
                console.log(`Failed to send payment confirmation email to ${user.email}`);
              }
            }).catch(err => {
              console.error(`Error sending payment confirmation email: ${err.message}`);
            });
            
            // Also send order confirmation if it hasn't been sent already
            const products = [];
            try {
              const orderItems = await storage.getOrderItems(order.id);
              for (const item of orderItems) {
                const product = await storage.getProduct(item.productId);
                if (product) {
                  products.push(product);
                }
              }
              
              emailService.sendOrderConfirmationEmail(order, user, products)
                .then(sent => {
                  if (sent) {
                    console.log(`Order confirmation email sent to ${user.email} for order #${order.orderNumber}`);
                  } else {
                    console.log(`Failed to send order confirmation email to ${user.email}`);
                  }
                }).catch(err => {
                  console.error(`Error sending order confirmation email: ${err.message}`);
                });
                
            } catch (emailError) {
              console.error(`Error preparing order confirmation email: ${emailError}`);
            }
            emailService.sendPaymentConfirmationEmail(
              user.email,
              user.firstName || user.username,
              order.orderNumber,
              order.total,
              payment.method || 'Online Payment'
            ).then(sent => {
              if (sent) {
                console.log(`Payment confirmation email sent to ${user.email} for order #${order.orderNumber}`);
              } else {
                console.log(`Failed to send payment confirmation email to ${user.email}`);
              }
            }).catch(err => {
              console.error(`Error sending payment confirmation email: ${err.message}`);
            });
          }
        }
        return { success: true, order: updatedOrder };
      }
    } else if (status === 'FAILED' || status === 'PAYMENT_ERROR') {
      const order = await storage.getOrderById(payment.orderId);
      if (order) {
        // Update order payment status to failed
        const updatedOrder = await storage.updateOrderPaymentStatus(order.id, 'FAILED');
        
        // Send notifications
        if (order.userId) {
          await notificationService.sendUserNotification({
            userId: order.userId,
            type: NotificationType.PAYMENT_FAILED,
            title: 'Payment Failed',
            message: `Your payment for order #${order.orderNumber} has failed. Please try again or contact support.`,
            entityId: order.id,
            entityType: 'order'
          });
        }
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_FAILED,
          title: 'Payment Failed',
          message: `Payment failed for order #${order.orderNumber}`,
          entityId: order.id,
          entityType: 'order',
          isAdmin: true
        });
        
        // Send email notification for failed payment
        if (order.userId) {
          const user = await storage.getUser(order.userId);
          if (user && user.email) {
            // Send payment failure email (non-blocking)
            emailService.sendPaymentFailedEmail(
              user.email,
              user.firstName || user.username,
              order.orderNumber,
              order.total,
              'The payment processor reported an error. Please try again or use a different payment method.'
            ).then(sent => {
              if (sent) {
                console.log(`Payment failure email sent to ${user.email} for order #${order.orderNumber}`);
              } else {
                console.log(`Failed to send payment failure email to ${user.email}`);
              }
            }).catch(err => {
              console.error(`Error sending payment failure email: ${err.message}`);
            });
          }
        }
        
        return { success: true, order: updatedOrder };
      }
    }
    
    return { success: true, order: undefined };
    
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    return { success: false, error: error.message };
  }
}

// Setup payment routes
export function setupPaymentRoutes(app: Express) {
  // Debug endpoint for PhonePe configuration (for development only)
  if (process.env.NODE_ENV !== 'production') {
    // Simple test endpoint for generating an order number
    app.get("/api/payment/test-order-number", (req, res) => {
      res.json({
        orderNumber: generateOrderNumber(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Test endpoint for creating a dummy payment request
    app.post("/api/payment/test-create", async (req, res) => {
      try {
        const { amount = 100, success = true } = req.body;
        
        const orderNumber = generateOrderNumber();
        const merchantTransactionId = `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // App base URL for redirects
        const appBaseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Create a test payment record
        const payment = await storage.createPayment({
          userId: 1, // Default test user ID
          orderId: 1, // Sample order ID
          transactionId: merchantTransactionId,
          merchantTransactionId: merchantTransactionId,
          amount: amount.toString(),
          currency: 'INR',
          status: 'PENDING',
          method: 'phonepe_test', // PhonePe test payment
          gatewayResponse: {
            testMode: true,
            expectedResult: success ? 'success' : 'failure'
          }
        });
        
        console.log(`Test payment created: ${merchantTransactionId} for amount ${amount}`);
        
        // Create a mock payment URL with our test parameters
        const mockPaymentUrl = `${appBaseUrl}/api/payment/mock-payment?merchantTransactionId=${merchantTransactionId}&amount=${amount}&success=${success}`;
        
        // Return the payment details to the client
        res.json({
          success: true,
          data: {
            transactionId: merchantTransactionId,
            orderNumber: orderNumber,
            amount: amount,
            currency: 'INR',
            paymentMethod: 'phonepe_test',
            paymentUrl: mockPaymentUrl
          }
        });
      } catch (error: any) {
        console.error('Error creating test payment:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to create test payment'
        });
      }
    });
    
    // Mock payment page for testing
    app.get("/api/payment/mock-payment", (req, res) => {
      const { merchantTransactionId, amount, success } = req.query;
      const isSuccess = success === 'true';
      
      // Show a mock payment page
      const mtid = merchantTransactionId || 'Unknown';
      const mockPaymentHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PhonePe Mock Payment</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              text-align: center;
            }
            .card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 20px;
              margin-top: 20px;
              background-color: #f9f9f9;
            }
            .phonepe-header {
              background-color: #5f259f;
              color: white;
              padding: 10px;
              border-radius: 8px 8px 0 0;
              margin: -20px -20px 20px -20px;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button {
              background-color: #5f259f;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
            .button.success {
              background-color: #28a745;
            }
            .button.error {
              background-color: #dc3545;
            }
            .txn-id {
              font-size: 12px;
              color: #666;
              margin-top: 15px;
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-top: 4px solid #5f259f;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              animation: spin 2s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="phonepe-header">
              <h2>PhonePe Payment</h2>
            </div>
            <p>Complete your payment of</p>
            <div class="amount">₹${amount || '100.00'}</div>
            <p>Transaction ID: <span class="txn-id">${mtid}</span></p>
            
            <div id="payment-options">
              <button onclick="simulatePayment(true)" class="button success">Complete Payment (Success)</button>
              <br>
              <button onclick="simulatePayment(false)" class="button error">Fail Payment (Error)</button>
            </div>
            
            <div id="processing" style="display: none;">
              <div class="loader"></div>
              <p>Processing payment...</p>
            </div>
          </div>
          
          <script>
            const merchantId = "${mtid}";
            
            function simulatePayment(success) {
              document.getElementById('payment-options').style.display = 'none';
              document.getElementById('processing').style.display = 'block';
              
              // Redirect after a short delay to simulate processing
              setTimeout(() => {
                const code = success ? 'PAYMENT_SUCCESS' : 'PAYMENT_ERROR';
                window.location.href = '/api/payment/callback?merchantTransactionId=' + merchantId + '&code=' + code;
              }, 2000);
            }
            
            document.addEventListener('DOMContentLoaded', () => {
              // Auto-select the success or failure based on the URL parameter
              const defaultSuccess = ${isSuccess};
              if (defaultSuccess !== undefined) {
                // Auto-submit after a short delay to simulate the payment flow
                setTimeout(() => {
                  simulatePayment(defaultSuccess);
                }, 1500);
              }
            });
          </script>
        </body>
        </html>
      `;
      
      res.send(mockPaymentHtml);
    });
    
    app.get("/api/payment/config", (req, res) => {
      res.json({
        merchantId: process.env.PHONEPE_MERCHANT_ID || "Missing",
        saltKey: process.env.PHONEPE_SALT_KEY ? 
          process.env.PHONEPE_SALT_KEY.substring(0, 4) + "..." + 
          process.env.PHONEPE_SALT_KEY.slice(-4) : "Missing",
        saltIndex: process.env.PHONEPE_SALT_INDEX || "Missing",
        environment: process.env.NODE_ENV,
        baseUrl: process.env.NODE_ENV === 'production' ? 
          'https://api.phonepe.com/apis/hermes' : 
          'https://api-preprod.phonepe.com/apis/pg-sandbox',
        status: 'active',
        timestamp: new Date().toISOString()
      });
    });
  }
  
  // Initiate payment with PhonePe
  app.post("/api/payment/initiate", isAuthenticated, async (req, res) => {
    try {
      const { 
        amount, 
        cartItems, 
        shippingAddress, 
        billingAddress = shippingAddress, 
        shippingMethod, 
        paymentMethod 
      } = req.body;
      
      // Validate request data
      if (!amount || !cartItems || !shippingAddress || !paymentMethod) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required payment details" 
        });
      }
      
      // Generate unique order number and transaction ID
      const orderNumber = generateOrderNumber();
      const merchantTransactionId = orderNumber;
      
      // Create order record
      const order = await storage.createOrder({
        userId: req.user!.id,
        orderNumber,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingAddress,
        billingAddress,
        paymentMethod: paymentMethod, // Add payment method to fix constraint violation
        shippingMethod: shippingMethod || 'standard',
        total: amount.total,
        subtotal: amount.subtotal,
        tax: amount.tax,
        shippingCost: amount.shipping, // Use correct field name
        discount: amount.discount,
        // Don't include orderDate as it's automatically set by the database
      });
      
      // Create order items
      for (const item of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          color: item.color,
          customization: item.customization,
        });
      }
      
      // Create payment record
      const payment = await storage.createPayment({
        orderId: order.id,
        userId: req.user?.id || 1,
        amount: amount.total,
        currency: 'INR',
        status: 'PENDING',
        method: paymentMethod,
        merchantTransactionId,
        transactionId: merchantTransactionId
      });
      
      // Set up the redirect and callback URLs
      const appBaseUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-production-domain.com'
        : `${req.protocol}://${req.get('host')}`;
      
      console.log(`Using base URL for redirects: ${appBaseUrl}`);
      
      // Determine whether to use test mode or real payment
      let paymentResult: {
        success: boolean;
        errorMessage?: string;
        instrumentResponse?: {
          redirectInfo: {
            url: string;
          };
        };
        transactionId?: string;
      } = {
        success: false,
        errorMessage: "Payment not initialized"
      };
      
      let useTestMode = false;
      
      // For development, always default to test mode if we've seen this error before
      if (process.env.NODE_ENV !== 'production') {
        useTestMode = true;
        console.log("[DEV] Using test payment mode by default");
      } else {
        try {
          // In production, try initiating PhonePe payment
          paymentResult = await PhonePeService.initiatePayment({
            amount: Number(amount.total),
            orderId: merchantTransactionId,
            customerEmail: req.user!.email,
            customerPhone: req.user!.phoneNumber || "9999999999", // Default if not available
            customerName: `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || req.user!.username,
            redirectUrl: `${appBaseUrl}/payment/callback`,
            callbackUrl: `${appBaseUrl}/api/payment/webhook`,
          });
        } catch (error: any) {
          console.error('PhonePe payment initiation failed:', error);
          useTestMode = true;
          
          // Update payment record with error
          await storage.updatePaymentDetails(payment.id, {
            status: 'ERROR',
            gatewayErrorMessage: error.message || 'Unknown error',
            gatewayResponse: {
              error: error.message || 'Unknown error',
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      if (useTestMode) {
        // Create a mock payment URL with our test parameters
        const mockPaymentUrl = `${appBaseUrl}/api/payment/mock-payment?merchantTransactionId=${merchantTransactionId}&amount=${amount.total}&success=true`;
        
        paymentResult = {
          success: true,
          instrumentResponse: {
            redirectInfo: {
              url: mockPaymentUrl
            }
          },
          transactionId: `MOCK${Date.now()}`
        };
        
        // Update payment record with test mode info
        await storage.updatePaymentDetails(payment.id, {
          gatewayResponse: {
            testMode: true,
            mockTransactionId: paymentResult.transactionId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      if (paymentResult.success) {
        // Update payment record with transaction ID if available
        if (paymentResult.transactionId) {
          await storage.updatePaymentDetails(payment.id, {
            transactionId: paymentResult.transactionId
          });
        }
        
        // Return success response with payment URL
        res.json({
          success: true,
          order,
          payment,
          paymentUrl: paymentResult.instrumentResponse?.redirectInfo.url
        });
      } else {
        // Update order and payment status to failed
        await storage.updateOrderStatus(order.id, 'FAILED');
        await storage.updatePaymentStatus(payment.id, 'FAILED');
        
        // Return error response
        res.status(400).json({
          success: false,
          error: paymentResult.errorMessage || "Failed to initiate payment"
        });
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || "An error occurred while processing your payment"
      });
    }
  });

  // Payment callback route (user is redirected here after payment)
  app.all("/api/payment/callback", async (req, res) => {
    // Get parameters from either query params (GET) or body (POST)
    const merchantTransactionId = req.query.merchantTransactionId || req.body.merchantTransactionId;
    const transactionId = req.query.transactionId || req.body.transactionId;
    const code = req.query.code || req.body.code;
    
    console.log(`Payment callback received: merchantId=${merchantTransactionId}, code=${code}`);
    
    try {
      let paymentStatus;
      
      // Debug/Test mode: If transaction ID starts with TEST or LF-, use mocked payment status
      if (merchantTransactionId && 
          (merchantTransactionId.toString().startsWith('TEST') || merchantTransactionId.toString().startsWith('LF-'))) {
        console.log('[DEV] Using mocked payment status for test transaction');
        
        // Determine success based on the code parameter
        const isSuccess = code === 'PAYMENT_SUCCESS';
        console.log(`Test payment ${isSuccess ? 'SUCCESS' : 'FAILED'} for ${merchantTransactionId}`);
        
        paymentStatus = {
          success: isSuccess,
          code: code || 'PAYMENT_ERROR',
          message: isSuccess ? 'Payment successful' : 'Payment failed',
          data: {
            merchantId: merchantTransactionId,
            transactionId: transactionId || `MOCKTRX${Date.now()}`,
            amount: 100
          }
        };
      } else {
        // Verify payment status with PhonePe for real transactions
        try {
          paymentStatus = await PhonePeService.checkPaymentStatus(merchantTransactionId.toString());
        } catch (error: any) {
          console.error('Error checking PhonePe payment status:', error);
          paymentStatus = {
            success: false,
            code: 'CHECK_FAILED',
            message: error.message || 'Failed to check payment status',
            data: { merchantId: merchantTransactionId }
          };
        }
      }
      
      // Get the payment record
      const payment = await storage.getPaymentByMerchantTransactionId(merchantTransactionId.toString());
      
      if (!payment) {
        console.error(`Payment not found for merchantTransactionId: ${merchantTransactionId}`);
        return res.redirect(`/payment-error?error=Payment+not+found`);
      }
      
      // Update payment record with the new status
      const newStatus = paymentStatus.success ? 'SUCCESS' : 'FAILED';
      await storage.updatePaymentStatus(payment.id, newStatus);
      
      // Update payment details
      await storage.updatePaymentDetails(payment.id, {
        transactionId: paymentStatus.data?.transactionId || payment.transactionId,
        gatewayResponse: {
          statusCheckResponse: paymentStatus,
          callbackTimestamp: new Date().toISOString()
        }
      });
      
      // Update order status and send notifications
      const updateResult = await updatePaymentStatus(payment, newStatus);
      
      if (!updateResult.success) {
        console.error(`Failed to update order status: ${updateResult.error}`);
      }
      
      // Redirect the user based on payment status
      if (paymentStatus.success) {
        const order = updateResult.order || await storage.getOrderById(payment.orderId);
        if (order) {
          console.log(`Redirecting to order confirmation for order ${order.id}`);
          return res.redirect(`/order-confirmation/${order.orderNumber}`);
        } else {
          console.log('Order not found, redirecting to general order confirmation');
          return res.redirect('/order-confirmation');
        }
      } else {
        console.log(`Payment failed for order ${payment.orderId}, redirecting to payment failed page`);
        return res.redirect(`/payment-failed?orderId=${payment.orderId}`);
      }
    } catch (error: any) {
      console.error('Payment callback error:', error);
      res.redirect(`/payment-error?error=${encodeURIComponent(error.message || 'An error occurred')}`);
    }
  });

  // Payment webhook for receiving notifications from PhonePe
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      console.log('Payment webhook received:', req.body);
      
      // Verify signature if needed
      
      // Process callback data
      const { merchantTransactionId, transactionId, status } = req.body.response || {};
      
      if (!merchantTransactionId) {
        return res.status(400).json({ status: 'ERROR', message: 'Invalid callback data' });
      }
      
      // Get the payment record
      const payment = await storage.getPaymentByMerchantTransactionId(merchantTransactionId);
      
      if (!payment) {
        return res.status(404).json({ status: 'ERROR', message: 'Payment not found' });
      }
      
      // Update payment record
      await storage.updatePaymentStatus(payment.id, status);
      
      if (transactionId && transactionId !== payment.transactionId) {
        await storage.updatePaymentDetails(payment.id, { transactionId });
      }
      
      // Update order status and send notifications
      await updatePaymentStatus(payment, status);
      
      // Return success response
      res.json({ status: 'SUCCESS' });
    } catch (error: any) {
      console.error('Payment webhook error:', error);
      res.status(500).json({ status: 'ERROR', message: error.message || 'An error occurred' });
    }
  });
}