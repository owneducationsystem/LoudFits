import { Express } from "express";
import { notificationService, NotificationType } from "../services/notificationService";

/**
 * Set up notification test routes
 * @param app Express application
 */
export function setupNotificationRoutes(app: Express) {
  // Test route to send a global notification
  app.get("/api/notifications/test", async (req, res) => {
    try {
      // Send a broadcast notification (to all users)
      const notification = await notificationService.sendBroadcast({
        type: NotificationType.SYSTEM,
        title: "Test Notification",
        message: "This is a test notification from Loudfits. If you can see this, the notification system is working!",
      });
      
      res.json({ 
        success: true,
        notification 
      });
    } catch (error) {
      console.error("Failed to send test notification:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Test route to send an order notification to a specific user
  app.post("/api/notifications/order-test", async (req, res) => {
    try {
      const { userId = 1 } = req.body;
      
      // Create a mock order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
      
      // Send user notification
      const notification = await notificationService.sendUserNotification({
        type: NotificationType.ORDER_PLACED,
        title: "Order Placed Successfully",
        message: `Your order #${orderNumber} has been received and is being processed.`,
        userId: userId,
        entityId: 1,
        entityType: 'order'
      });
      
      // Also send admin notification
      await notificationService.sendAdminNotification({
        type: NotificationType.ORDER_PLACED,
        title: "New Order Received",
        message: `Order #${orderNumber} has been placed. Amount: ₹1299`,
        entityId: 1, 
        entityType: 'order'
      });
      
      res.json({ 
        success: true, 
        orderNumber,
        notification 
      });
    } catch (error) {
      console.error("Failed to send order notification:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Test route to send a payment notification to a specific user
  app.post("/api/notifications/payment-test", async (req, res) => {
    try {
      const { userId = 1, success = true } = req.body;
      
      // Create a mock order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
      
      let notification;
      
      if (success) {
        // Send payment success notification
        notification = await notificationService.sendUserNotification({
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Payment Successful",
          message: `Your payment for order #${orderNumber} has been completed successfully.`,
          userId: userId,
          entityId: 1,
          entityType: 'order'
        });
      } else {
        // Send payment failure notification
        notification = await notificationService.sendUserNotification({
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment Failed",
          message: `Your payment for order #${orderNumber} was unsuccessful. Please try again or contact support.`,
          userId: userId,
          entityId: 1,
          entityType: 'order'
        });
      }
      
      res.json({ 
        success: true, 
        orderNumber,
        notification,
        paymentSuccess: success
      });
    } catch (error) {
      console.error("Failed to send payment notification:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}