import { Request, Response } from "express";
import { Express } from "express";
import crypto from "crypto";
import { PhonePeService } from "../services/phonePeService";
import { storage } from "../storage";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LF-${timestamp.slice(-6)}-${randomPart}`;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized access" });
};

export function setupPaymentRoutes(app: Express) {
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
  app.post("/payment/callback", async (req, res) => {
    const { merchantTransactionId, transactionId, code } = req.body;
    
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