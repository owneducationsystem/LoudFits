import { notificationService, NotificationType } from "./notificationService";

/**
 * Send a test notification to all users
 * This is useful for testing the notification system
 */
export async function sendTestNotification() {
  try {
    // Send a broadcast notification (to all users)
    await notificationService.sendBroadcast({
      type: NotificationType.SYSTEM,
      title: "Test Notification",
      message: "This is a test notification from Loudfits. If you can see this, the notification system is working!",
    });
    
    return { success: true };
  } catch (error) {
    console.error("Failed to send test notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send a test order notification to a specific user
 * @param userId User ID to send the notification to
 */
export async function sendOrderNotification(userId: number) {
  try {
    // Create a mock order number
    const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
    
    // Send user notification
    await notificationService.sendUserNotification({
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
    
    return { success: true, orderNumber };
  } catch (error) {
    console.error("Failed to send order notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send a test payment notification to a specific user
 * @param userId User ID to send the notification to
 * @param success Whether the payment was successful or failed
 */
export async function sendPaymentNotification(userId: number, success: boolean = true) {
  try {
    // Create a mock order number
    const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
    
    if (success) {
      // Send payment success notification
      await notificationService.sendUserNotification({
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Payment Successful",
        message: `Your payment for order #${orderNumber} has been completed successfully.`,
        userId: userId,
        entityId: 1,
        entityType: 'order'
      });
    } else {
      // Send payment failure notification
      await notificationService.sendUserNotification({
        type: NotificationType.PAYMENT_FAILED,
        title: "Payment Failed",
        message: `Your payment for order #${orderNumber} was unsuccessful. Please try again or contact support.`,
        userId: userId,
        entityId: 1,
        entityType: 'order'
      });
    }
    
    return { success: true, orderNumber };
  } catch (error) {
    console.error("Failed to send payment notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}