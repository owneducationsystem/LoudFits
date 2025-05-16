import { Express, Request, Response } from "express";
import { emailService } from "../services/emailService";
import { storage } from "../storage";

export function setupEmailRoutes(app: Express) {
  // Test sending welcome email
  app.post("/api/email/test-welcome", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: "Missing userId parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const result = await emailService.sendWelcomeEmail(user);
      
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        success: result,
        message: result ? "Welcome email sent successfully" : "Failed to send welcome email",
        email: user.email
      }));
    } catch (error: any) {
      console.error("Error sending test welcome email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test sending login notification email
  app.post("/api/email/test-login", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, error: "Missing userId parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const ipAddress = req.ip || req.socket.remoteAddress || "192.168.1.1";
      const userAgent = req.get('user-agent') || "Mozilla/5.0 (Test Browser)";
      
      const result = await emailService.sendLoginNotificationEmail(user, ipAddress, userAgent);
      
      res.json({
        success: result,
        message: result ? "Login notification email sent successfully" : "Failed to send login notification email",
        email: user.email
      });
    } catch (error: any) {
      console.error("Error sending test login email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test sending order confirmation email
  app.post("/api/email/test-order", async (req: Request, res: Response) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, error: "Missing userId or orderId parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const order = await storage.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      // Get order items and products
      const orderItems = await storage.getOrderItems(order.id);
      const products = [];
      
      for (const item of orderItems) {
        const product = await storage.getProduct(item.productId);
        if (product) {
          products.push(product);
        }
      }
      
      const result = await emailService.sendOrderConfirmationEmail(order, user, products);
      
      res.json({
        success: result,
        message: result ? "Order confirmation email sent successfully" : "Failed to send order confirmation email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending test order email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test sending payment confirmation email
  app.post("/api/email/test-payment-success", async (req: Request, res: Response) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, error: "Missing userId or orderId parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const order = await storage.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      const result = await emailService.sendPaymentConfirmationEmail(
        user.email || '',
        user.firstName || user.username,
        order.orderNumber,
        order.total,
        order.paymentMethod || 'Credit Card'
      );
      
      res.json({
        success: result,
        message: result ? "Payment confirmation email sent successfully" : "Failed to send payment confirmation email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending test payment success email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test sending payment failure email
  app.post("/api/email/test-payment-failure", async (req: Request, res: Response) => {
    try {
      const { userId, orderId } = req.body;
      
      if (!userId || !orderId) {
        return res.status(400).json({ success: false, error: "Missing userId or orderId parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const order = await storage.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      const result = await emailService.sendPaymentFailedEmail(
        user.email || '',
        user.firstName || user.username,
        order.orderNumber,
        order.total,
        'Your payment was declined by the bank. Please try another payment method.'
      );
      
      res.json({
        success: result,
        message: result ? "Payment failure email sent successfully" : "Failed to send payment failure email",
        email: user.email,
        orderNumber: order.orderNumber
      });
    } catch (error: any) {
      console.error("Error sending test payment failure email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test sending order status update email
  app.post("/api/email/test-order-status", async (req: Request, res: Response) => {
    try {
      const { userId, orderId, status } = req.body;
      
      if (!userId || !orderId || !status) {
        return res.status(400).json({ success: false, error: "Missing userId, orderId or status parameter" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const order = await storage.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      const result = await emailService.sendOrderStatusUpdateEmail(order, user, status);
      
      res.json({
        success: result,
        message: result ? "Order status update email sent successfully" : "Failed to send order status update email",
        email: user.email,
        orderNumber: order.orderNumber,
        status
      });
    } catch (error: any) {
      console.error("Error sending test order status email:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}