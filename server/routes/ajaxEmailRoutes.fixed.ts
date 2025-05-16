import { Router } from 'express';
import { storage } from '../storage';
import { emailService } from '../services/emailService';

export function setupAjaxEmailRoutes(app: Router) {
  /**
   * Test sending welcome emails
   */
  app.post('/api/ajax/email/welcome', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      const success = await emailService.sendWelcomeEmail(user);
      
      return res.json({
        success,
        message: success ? "Welcome email sent successfully" : "Failed to send welcome email"
      });
    } catch (error: any) {
      console.error("Error sending welcome email:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Error: ${error.message || "Unknown error"}`
      });
    }
  });
  
  /**
   * Test sending login notification emails
   */
  app.post('/api/ajax/email/login', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Add some test data
      const ipAddress = req.ip || "172.31.128.71";
      const device = req.headers['user-agent'] || "Unknown Device";
      
      const success = await emailService.sendLoginNotificationEmail(user, ipAddress, device);
      
      return res.json({
        success,
        message: success ? "Login notification email sent successfully" : "Failed to send login notification"
      });
    } catch (error: any) {
      console.error("Error sending login notification email:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Error: ${error.message || "Unknown error"}`
      });
    }
  });

  /**
   * Test sending order confirmation emails
   */
  app.post('/api/ajax/email/order', async (req, res) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, message: "User ID and Order ID are required" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Get order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found", error: "Order not found" });
      }
      
      // Get order items and collect basic product info
      const orderItems = await storage.getOrderItems(order.id);
      
      // Handle products carefully to avoid DB schema issues
      const products = [];
      
      // Try to get basic product info
      try {
        for (const item of orderItems) {
          // Use a simplified query that doesn't depend on stock_quantity
          const product = await storage.getProduct(item.productId);
          if (product) {
            products.push({
              ...product,
              // Ensure we have all required properties
              quantity: item.quantity,
              size: item.size,
              color: item.color
            });
          }
        }
      } catch (error) {
        console.error("Error fetching products for order email:", error);
        // Continue with products we have so far
      }
      
      // Send the email with available info
      const result = await emailService.sendOrderConfirmationEmail(order, user, products);
      
      res.json({
        success: result,
        message: result ? "Order confirmation email sent successfully" : "Failed to send order confirmation email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending order email:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send order confirmation email", 
        error: error.message 
      });
    }
  });
  
  /**
   * Test sending payment success emails
   */
  app.post('/api/ajax/email/payment-success', async (req, res) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, message: "User ID and Order ID are required" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Get order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      // Send payment confirmation email
      const result = await emailService.sendPaymentConfirmationEmail(
        user.email,
        user.firstName || user.username,
        order.orderNumber,
        parseFloat(order.total.toString()),
        "Credit Card" // Example payment method
      );
      
      res.json({
        success: result,
        message: result ? "Payment confirmation email sent successfully" : "Failed to send payment confirmation email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending payment success email:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send payment confirmation email", 
        error: error.message 
      });
    }
  });
  
  /**
   * Test sending payment failure emails
   */
  app.post('/api/ajax/email/payment-failure', async (req, res) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, message: "User ID and Order ID are required" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Get order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      // Send payment failure email
      const result = await emailService.sendPaymentFailedEmail(
        user.email,
        user.firstName || user.username,
        order.orderNumber,
        parseFloat(order.total.toString()),
        "Payment was declined by the issuing bank." // Example error message
      );
      
      res.json({
        success: result,
        message: result ? "Payment failure email sent successfully" : "Failed to send payment failure email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending payment failure email:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send payment failure email", 
        error: error.message 
      });
    }
  });
  
  /**
   * Test sending order status update emails
   */
  app.post('/api/ajax/email/order-status', async (req, res) => {
    try {
      const { userId, orderId, status } = req.body;
      
      if (!userId || !orderId || !status) {
        return res.status(400).json({ success: false, message: "User ID, Order ID, and status are required" });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      
      // Get order
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      // Send order status update email
      const result = await emailService.sendOrderStatusUpdateEmail(order, user, status);
      
      res.json({
        success: result,
        message: result ? "Order status update email sent successfully" : "Failed to send order status update email",
        email: user.email,
        orderNumber: order.orderNumber,
        status
      });
    } catch (error: any) {
      console.error("Error sending order status update email:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send order status update email", 
        error: error.message 
      });
    }
  });
}