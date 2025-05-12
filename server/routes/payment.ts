import { Request, Response, NextFunction } from "express";
import { Express } from "express";
import { User, Payment, Order } from "@shared/schema";
import crypto from "crypto";
import { PhonePeService } from "../services/phonePeService";
import { storage } from "../storage";

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
  
  return res.status(401).json({ error: "Unauthorized access" });
};

// Helper function to update payment status based on PhonePe response
async function updatePaymentStatus(payment: Payment, status: any): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  try {
    if (!payment) {
      throw new Error("Payment record not found");
    }
    
    let newStatus: string;
    
    if (status.success && status.code === "PAYMENT_SUCCESS") {
      newStatus = "completed";
      
      // Update order status
      await storage.updateOrderStatus(payment.orderId, "processing");
      await storage.updateOrderPaymentStatus(payment.orderId, "paid");
      
    } else if (status.code === "PAYMENT_PENDING") {
      newStatus = "pending";
      
    } else {
      newStatus = "failed";
      
      // Update order status
      await storage.updateOrderStatus(payment.orderId, "cancelled");
      await storage.updateOrderPaymentStatus(payment.orderId, "failed");
    }
    
    // Update payment record
    await storage.updatePaymentStatus(payment.id, newStatus);
    await storage.updatePaymentDetails(payment.id, {
      gatewayResponse: status,
      gatewayErrorCode: status.code !== "PAYMENT_SUCCESS" ? status.code : null,
      gatewayErrorMessage: status.code !== "PAYMENT_SUCCESS" ? status.message : null,
      paymentDate: newStatus === "completed" ? new Date() : null
    });
    
    // Get the updated order
    const order = await storage.getOrderById(payment.orderId);
    
    if (!order) {
      throw new Error("Order not found after updating payment status");
    }
    
    return { success: true, order };
    
  } catch (error: any) {
    console.error("Error updating payment status:", error);
    return { success: false, error: error.message };
  }
}

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
        
        console.log(`[TEST] Creating test payment for amount: ${amount}, orderNumber: ${orderNumber}`);
        console.log(`[TEST] Using redirect base URL: ${appBaseUrl}`);
        
        // Create a mock order in the database (optional)
        const mockOrder = {
          orderNumber,
          userId: req.user?.id || 1, // Default to first user if no auth
          total: amount,
          status: 'pending',
          paymentStatus: 'pending',
          email: req.user?.email || 'test@example.com',
          shippingAddress: '123 Test Street, Test City, Test Country',
          phone: '1234567890',
          name: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Test User' : 'Test User'
        };
        
        // We'll return all the data that would be used to create a real payment
        // without actually making the PhonePe API call
        res.json({
          success: true,
          testPayment: true,
          data: {
            orderNumber,
            merchantTransactionId,
            amount,
            redirectUrl: `${appBaseUrl}/payment/callback?merchantTransactionId=${merchantTransactionId}&transactionId=PHTST${Date.now()}&code=${success ? 'PAYMENT_SUCCESS' : 'PAYMENT_ERROR'}`,
            callbackUrl: `${appBaseUrl}/api/payment/webhook`,
            paymentUrl: `${appBaseUrl}/test-phonepe/mock-payment?txnId=${merchantTransactionId}&amount=${amount}&success=${success}`,
            timestamp: new Date().toISOString(),
            mockOrder
          }
        });
      } catch (error: any) {
        console.error(`[TEST] Error creating test payment:`, error);
        res.status(500).json({ 
          success: false, 
          error: error.message || "Unknown error during test payment creation"
        });
      }
    });
    
    // Mock payment page for simulating PhonePe payment process
    app.get("/test-phonepe/mock-payment", (req, res) => {
      const { txnId, amount, success = "true" } = req.query;
      const isSuccess = success === "true";
      
      // Return a simple HTML page to simulate the payment gateway
      res.send(`
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
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="phonepe-header">
              <h2>PhonePe Payment (Test Mode)</h2>
            </div>
            <p>You are about to make a payment via PhonePe</p>
            <div class="amount">₹${amount}</div>
            <p>Transaction ID: ${txnId}</p>
            <div>
              <button class="button success" onclick="simulatePayment(true)">Pay Now (Success)</button>
              <button class="button error" onclick="simulatePayment(false)">Pay Now (Failure)</button>
            </div>
            <p class="txn-id">This is a test payment page for development purposes only.</p>
          </div>
          
          <script>
            function simulatePayment(isSuccess) {
              // Simulate payment processing delay
              document.body.innerHTML = '<div style="text-align:center; margin-top:50px;"><h2>Processing Payment...</h2><p>Please wait...</p><div style="width:50px; height:50px; border:5px solid #f3f3f3; border-top:5px solid #5f259f; border-radius:50%; margin:20px auto; animation:spin 1s linear infinite;"></div></div>';
              
              setTimeout(() => {
                const redirectUrl = window.location.origin + "/payment/callback?merchantTransactionId=${txnId}&transactionId=PHTST" + Date.now() + "&code=" + (isSuccess ? "PAYMENT_SUCCESS" : "PAYMENT_ERROR");
                window.location.href = redirectUrl;
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
      `);
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
        billingAddress = null,
        shippingMethod = "standard",
        paymentMethod = "phonepe"
      } = req.body;
      
      if (!amount || !cartItems || !shippingAddress) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required payment details" 
        });
      }
      
      // Generate unique order ID
      const orderNumber = generateOrderNumber();
      
      // Create order record in database
      const orderData = {
        orderNumber,
        userId: req.user!.id,
        subtotal: amount.subtotal,
        tax: amount.tax,
        shippingCost: amount.shipping,
        discount: amount.discount || 0,
        total: amount.total,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod,
        shippingMethod,
        shippingAddress,
        billingAddress
      };
      
      const order = await storage.createOrder(orderData);
      
      // Save order items
      for (const item of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          color: item.color,
          customization: item.customization || null
        });
      }
      
      // Create merchant transaction ID
      let merchantTransactionId = `LF${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // App base URL for redirects (adjust for different environments)
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
            amount: Number(orderData.total),
            orderId: merchantTransactionId,
            customerEmail: req.user!.email,
            customerPhone: req.user!.phoneNumber || "9999999999", // Default if not available
            customerName: `${req.user!.firstName || ''} ${req.user!.lastName || ''}`.trim() || req.user!.username,
            redirectUrl: `${appBaseUrl}/payment/callback`,
            callbackUrl: `${appBaseUrl}/api/payment/webhook`,
          });
          
          if (!paymentResult.success) {
            throw new Error(paymentResult.errorMessage || "Payment initiation failed");
          }
          
          // If we got here, PhonePe was successful, no need for test mode
          useTestMode = false;
        } catch (error) {
          throw error; // In production, just throw the error
        }
      }
      
      // If in test mode, use the test payment endpoint
      if (useTestMode) {
        console.log("[DEV] Setting up test payment");
        const testMerchantTransactionId = `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        paymentResult = {
          success: true,
          instrumentResponse: {
            redirectInfo: {
              url: `${appBaseUrl}/test-phonepe/mock-payment?txnId=${testMerchantTransactionId}&amount=${Number(orderData.total)}&success=true`
            }
          },
          transactionId: `TESTTRX${Date.now()}`
        };
        
        // Update the merchant transaction ID for the payment record
        merchantTransactionId = testMerchantTransactionId;
      }
      
      // Store payment information
      await storage.createPayment({
        orderId: order.id,
        userId: req.user!.id,
        transactionId: paymentResult.transactionId || "",
        merchantTransactionId,
        amount: orderData.total,
        method: paymentMethod,
        status: "initiated",
      });
      
      // If successful, return the payment URL to redirect the user
      res.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber
        },
        paymentUrl: paymentResult.instrumentResponse?.redirectInfo.url,
        transactionId: paymentResult.transactionId,
        isTestMode: useTestMode
      });
      
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate payment"
      });
    }
  });
  
  // Payment status endpoint to check payment status
  app.get("/api/payment/status/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, error: "Invalid order ID" });
      }
      
      // Get order
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      // Get the latest payment for this order
      const payments = await storage.getPaymentsByOrderId(orderId);
      
      if (!payments || payments.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: "No payment found for this order",
          order
        });
      }
      
      // Sort payments by created date to get the latest
      const latestPayment = payments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      // If payment is already completed or failed, just return the current status
      if (latestPayment.status === "completed" || latestPayment.status === "failed") {
        return res.json({
          success: true,
          paymentStatus: latestPayment.status,
          order
        });
      }
      
      // If payment is pending or initiated, check with payment gateway
      let paymentStatus;
      
      try {
        // For test transactions, we can just return success
        if (latestPayment.merchantTransactionId.startsWith('TEST')) {
          paymentStatus = {
            success: true,
            code: "PAYMENT_SUCCESS",
            message: "Payment successful (test payment)",
            data: { merchantId: latestPayment.merchantTransactionId }
          };
        } else {
          // Check with PhonePe
          paymentStatus = await PhonePeService.checkPaymentStatus(latestPayment.merchantTransactionId);
        }
        
        // Update payment status
        const result = await updatePaymentStatus(latestPayment, paymentStatus);
        
        if (result.success && result.order) {
          return res.json({
            success: true,
            paymentStatus: latestPayment.status,
            order: result.order
          });
        } else {
          return res.status(500).json({
            success: false,
            error: result.error || "Failed to update payment status",
            order
          });
        }
        
      } catch (error: any) {
        console.error("Error checking payment status:", error);
        
        // In development, just return the current status
        if (process.env.NODE_ENV !== 'production') {
          return res.json({
            success: true,
            paymentStatus: latestPayment.status,
            order,
            warning: "Could not check payment status with gateway"
          });
        }
        
        return res.status(500).json({
          success: false,
          error: error.message || "Failed to check payment status",
          order
        });
      }
    } catch (error: any) {
      console.error("Payment status check error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An error occurred while checking payment status"
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
      
      // Debug/Test mode: If transaction ID starts with TEST, use mocked payment status
      if (merchantTransactionId && merchantTransactionId.toString().startsWith('TEST')) {
        console.log('[DEV] Using mocked payment status for test transaction');
        paymentStatus = {
          success: code === 'PAYMENT_SUCCESS',
          code: code || 'PAYMENT_ERROR',
          message: code === 'PAYMENT_SUCCESS' ? 'Payment successful' : 'Payment failed',
          data: {
            merchantId: merchantTransactionId,
            transactionId: transactionId || `MOCKTRX${Date.now()}`,
            amount: 100
          }
        };
      } else {
        // Verify payment status with PhonePe for real transactions
        try {
          paymentStatus = await PhonePeService.checkPaymentStatus(merchantTransactionId);
        } catch (error) {
          console.error('Error checking PhonePe payment status:', error);
          
          // Fallback for development: use query parameters to determine status
          if (process.env.NODE_ENV !== 'production') {
            paymentStatus = {
              success: code === 'PAYMENT_SUCCESS',
              code: code || 'PAYMENT_ERROR',
              message: (error as Error)?.message || 'Failed to verify payment status',
              data: {}
            };
          } else {
            throw error;
          }
        }
      }
      
      // Get payment record
      let payment = await storage.getPaymentByMerchantTransactionId(merchantTransactionId);
      
      // For test transactions without a payment record, create a fake one for testing
      if (!payment && merchantTransactionId && merchantTransactionId.toString().startsWith('TEST')) {
        console.log('[DEV] Creating mock payment record for test transaction');
        
        // Create a mock order first
        const orderNumber = generateOrderNumber();
        const mockOrder = await storage.createOrder({
          orderNumber: orderNumber,
          userId: 1, // Default test user ID
          status: "pending",
          paymentStatus: "pending",
          subtotal: "100",
          tax: "18",
          shippingCost: "0",
          discount: "0",
          total: "118",
          paymentMethod: "phonepe",
          shippingMethod: "standard",
          shippingAddress: "123 Test Street, Test City, Test State, 12345",
          billingAddress: null
        });
        
        // Create a mock payment record
        payment = await storage.createPayment({
          orderId: mockOrder.id,
          userId: 1,
          transactionId: transactionId?.toString() || `MOCKTRX${Date.now()}`,
          merchantTransactionId: merchantTransactionId.toString(),
          amount: "118",
          method: "phonepe",
          status: "initiated",
        });
        
        console.log(`[DEV] Created mock order (${orderNumber}) and payment for testing`);
      }
      
      if (!payment) {
        throw new Error("Payment record not found");
      }
      
      // Update payment status using the helper function
      const result = await updatePaymentStatus(payment, paymentStatus);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to update payment status");
      }
      
      // Determine redirect based on payment status
      if (result.order?.paymentStatus === "paid") {
        res.redirect(`/order-confirmation/${payment.orderId}`);
      } else {
        const reason = paymentStatus.message || "Payment was not completed successfully";
        res.redirect(`/payment-error?message=${encodeURIComponent(reason)}`);
      }
      
      // Log payment callback
      console.log(`Payment callback processed: orderId=${payment.orderId}, status=${result.order?.paymentStatus}`);
      
    } catch (error: any) {
      console.error("Payment callback error:", error);
      res.redirect(`/payment-error?message=${encodeURIComponent(error.message)}`);
    }
  });
  
  // Payment webhook (called by PhonePe asynchronously)
  app.post("/api/payment/webhook", async (req, res) => {
    try {
      const webhookData = req.body;
      const xVerifyHeader = req.header("X-VERIFY");
      
      if (!xVerifyHeader) {
        return res.status(400).json({ success: false, error: "Missing verification header" });
      }
      
      // Verify webhook data authenticity
      const isValidWebhook = PhonePeService.verifyWebhook(webhookData, xVerifyHeader);
      
      if (!isValidWebhook) {
        return res.status(401).json({ success: false, error: "Invalid webhook signature" });
      }
      
      // Process the webhook data
      const { merchantTransactionId, transactionId, amount, paymentState } = webhookData;
      
      // Get payment record
      const payment = await storage.getPaymentByMerchantTransactionId(merchantTransactionId);
      
      if (!payment) {
        return res.status(404).json({ success: false, error: "Payment record not found" });
      }
      
      // Update payment status based on the webhook data
      let newStatus;
      
      if (paymentState === "COMPLETED") {
        newStatus = "completed";
        
        // Update order status
        await storage.updateOrderStatus(payment.orderId, "processing");
        
      } else if (paymentState === "PENDING") {
        newStatus = "pending";
        
      } else {
        newStatus = "failed";
        
        // Update order status
        await storage.updateOrderStatus(payment.orderId, "cancelled");
      }
      
      // Update payment record
      await storage.updatePaymentStatus(payment.id, newStatus);
      await storage.updatePaymentDetails(payment.id, {
        gatewayResponse: webhookData,
        paymentDate: newStatus === "completed" ? new Date() : null
      });
      
      // Respond to the webhook
      res.json({ success: true });
      
    } catch (error: any) {
      console.error("Payment webhook error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Get payment status for an order
  app.get("/api/payment/status/:orderId", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (!orderId) {
        return res.status(400).json({ success: false, error: "Invalid order ID" });
      }
      
      // Get order details
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      // Verify the user owns this order
      if (order.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ success: false, error: "You do not have permission to view this order" });
      }
      
      // Get payment details
      const payments = await storage.getPaymentsByOrderId(orderId);
      
      // Return order and payment status
      res.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        },
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          transactionId: p.transactionId,
          createdAt: p.createdAt
        }))
      });
      
    } catch (error: any) {
      console.error("Payment status check error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}