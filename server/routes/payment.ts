import { Request, Response, NextFunction } from "express";
import { Express } from "express";
import { User } from "@shared/schema";
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
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized access" });
};

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
          name: req.user?.name || 'Test User'
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
      const merchantTransactionId = `LF${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      // App base URL for redirects (adjust for different environments)
      const appBaseUrl = process.env.NODE_ENV === 'production'
        ? 'https://your-production-domain.com'
        : `${req.protocol}://${req.get('host')}`;
      
      console.log(`Using base URL for redirects: ${appBaseUrl}`);
      
      // Initiate PhonePe payment
      const paymentResult = await PhonePeService.initiatePayment({
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
        transactionId: paymentResult.transactionId
      });
      
    } catch (error: any) {
      console.error("Payment initiation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to initiate payment"
      });
    }
  });
  
  // Payment callback route (user is redirected here after payment)
  app.all("/api/payment/callback", async (req, res) => {
    // Get parameters from either query params (GET) or body (POST)
    const merchantTransactionId = req.query.merchantTransactionId || req.body.merchantTransactionId;
    const transactionId = req.query.transactionId || req.body.transactionId;
    const code = req.query.code || req.body.code;
    
    try {
      // Verify payment status with PhonePe
      const paymentStatus = await PhonePeService.checkPaymentStatus(merchantTransactionId);
      
      // Get payment record
      const payment = await storage.getPaymentByMerchantTransactionId(merchantTransactionId);
      
      if (!payment) {
        throw new Error("Payment record not found");
      }
      
      let newStatus;
      let paymentStatusMessage;
      
      if (paymentStatus.success && paymentStatus.code === "PAYMENT_SUCCESS") {
        newStatus = "completed";
        paymentStatusMessage = "Payment completed successfully";
        
        // Update order status
        await storage.updateOrderStatus(payment.orderId, "processing");
        
      } else if (paymentStatus.code === "PAYMENT_PENDING") {
        newStatus = "pending";
        paymentStatusMessage = "Payment is still processing";
        
      } else {
        newStatus = "failed";
        paymentStatusMessage = "Payment failed or was cancelled";
        
        // Update order status
        await storage.updateOrderStatus(payment.orderId, "cancelled");
      }
      
      // Update payment record
      await storage.updatePaymentStatus(payment.id, newStatus);
      await storage.updatePaymentDetails(payment.id, {
        gatewayResponse: paymentStatus,
        gatewayErrorCode: paymentStatus.code !== "PAYMENT_SUCCESS" ? paymentStatus.code : null,
        gatewayErrorMessage: paymentStatus.code !== "PAYMENT_SUCCESS" ? paymentStatus.message : null,
        paymentDate: newStatus === "completed" ? new Date() : null
      });
      
      // Redirect user to order confirmation or failure page
      if (newStatus === "completed") {
        res.redirect(`/order-confirmation/${payment.orderId}`);
      } else {
        res.redirect(`/payment-failed/${payment.orderId}?reason=${encodeURIComponent(paymentStatusMessage)}`);
      }
      
      // Log payment callback
      console.log(`Payment callback processed: orderId=${payment.orderId}, status=${newStatus}`);
      
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