import { Express, Request, Response } from "express";
import { notificationService, NotificationType } from "../services/notificationService";
import { storage } from "../storage";
import { generateRandomString } from "../utils";

/**
 * Set up notification test routes
 * @param app Express application
 */
export function setupNotificationRoutes(app: Express) {
  /**
   * Test endpoint to broadcast a notification to all clients
   */
  app.get("/api/notifications/test", async (req, res) => {
    try {
      // Create a test notification
      const notification = {
        type: NotificationType.SYSTEM,
        title: "Test Notification",
        message: "This is a test notification from Loudfits. If you can see this, the notification system is working!",
        id: generateRandomString(),
        createdAt: new Date(),
        read: false
      };
      
      // Send the notification to all connected clients
      await notificationService.sendBroadcast({
        type: NotificationType.SYSTEM,
        title: "Test Notification",
        message: "This is a test notification from Loudfits. If you can see this, the notification system is working!"
      });
      
      res.json({ success: true, notification });
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  /**
   * Test endpoint to send an order notification to a user
   */
  app.post("/api/notifications/order-test", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Generate a random order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // Test orderId - in a real scenario this would be a real order ID
      const orderId = Math.floor(Math.random() * 1000);
      
      // Send order notification to both user and admin using our new method
      await notificationService.sendOrderNotification(
        orderId,
        orderNumber,
        userId,
        'placed',
        `Your test order #${orderNumber} has been placed successfully!`
      );
      
      res.json({ success: true, orderNumber });
    } catch (error: any) {
      console.error("Error sending order test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  /**
   * Test endpoint to send a payment notification to a user
   */
  app.post("/api/notifications/payment-test", async (req, res) => {
    try {
      const { userId, success = true } = req.body;
      
      // Generate a random order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      if (success) {
        // Payment success notification
        await notificationService.sendUserNotification({
          userId,
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Payment Successful",
          message: `Your payment for order #${orderNumber} has been successfully processed.`,
          entityId: 123, // Mock order ID
          entityType: 'order'
        });
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Payment Received",
          message: `Payment received for order #${orderNumber}.`,
          entityId: 123, // Mock order ID
          entityType: 'order',
          isAdmin: true
        });
      } else {
        // Payment failure notification
        await notificationService.sendUserNotification({
          userId,
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment Failed",
          message: `Your payment for order #${orderNumber} has failed. Please try again or contact our support team.`,
          entityId: 123, // Mock order ID
          entityType: 'order'
        });
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment Failed",
          message: `Payment failed for order #${orderNumber}.`,
          entityId: 123, // Mock order ID
          entityType: 'order',
          isAdmin: true
        });
      }
      
      res.json({ success: true, orderNumber, paymentStatus: success ? 'success' : 'failed' });
    } catch (error: any) {
      console.error("Error sending payment test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}