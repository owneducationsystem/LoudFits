import { storage } from "../storage";
import { notificationService, NotificationType } from "./notificationService";
import { emailService } from "./emailService";
import { Order } from "@shared/schema";

/**
 * Update an order's status and send appropriate notifications
 * @param orderId The ID of the order to update
 * @param newStatus The new status for the order
 * @param notifyUser Whether to send notifications to the user (default: true)
 * @param notifyAdmin Whether to send notifications to admins (default: true)
 * @param additionalInfo Additional information to include in notifications
 * @returns The updated order
 */
export async function updateOrderWithNotification(
  orderId: number,
  newStatus: string,
  notifyUser = true,
  notifyAdmin = true,
  additionalInfo?: string
): Promise<Order> {
  // Update the order status in the database
  const updatedOrder = await storage.updateOrderStatus(orderId, newStatus);
  
  if (!updatedOrder) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Get the user who placed the order
  if (!updatedOrder.userId) {
    console.warn(`Order ${orderId} has no associated user ID`);
    return updatedOrder;
  }
  
  const user = await storage.getUser(updatedOrder.userId);
  
  if (!user) {
    console.warn(`User not found for order ${orderId}`);
    return updatedOrder;
  }
  
  // Format status for display (e.g., "processing" → "Processing")
  const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
  
  // Only send notifications if requested
  if (notifyUser) {
    try {
      // Send real-time notification via WebSocket
      await notificationService.sendUserNotification({
        type: NotificationType.ORDER_UPDATED,
        title: "Order Status Updated",
        message: `Your order #${updatedOrder.orderNumber} is now ${formattedStatus}${additionalInfo ? `: ${additionalInfo}` : '.'}`,
        userId: user.id,
        entityId: updatedOrder.id,
        entityType: 'order'
      });
      
      // Send email notification
      await emailService.sendOrderStatusUpdateEmail(
        user.email,
        user.firstName || user.username,
        updatedOrder.orderNumber,
        formattedStatus,
        additionalInfo
      );
    } catch (error) {
      console.error("Failed to send user notification for order update:", error);
    }
  }
  
  // Notify admin if requested
  if (notifyAdmin) {
    try {
      const orderDetailsMessage = `Order #${updatedOrder.orderNumber} status changed to ${formattedStatus}. Amount: ₹${updatedOrder.total}`;
      
      await notificationService.sendAdminNotification({
        type: NotificationType.ORDER_UPDATED,
        title: "Order Status Update",
        message: orderDetailsMessage + (additionalInfo ? ` - ${additionalInfo}` : ''),
        entityId: updatedOrder.id,
        entityType: 'order'
      });
    } catch (error) {
      console.error("Failed to send admin notification for order update:", error);
    }
  }
  
  return updatedOrder;
}

/**
 * Generate a human-readable description of an order
 * @param order The order to describe
 * @returns A formatted description of the order
 */
export function formatOrderDescription(order: Order): string {
  return `Order #${order.orderNumber} - ₹${order.total} - Status: ${order.status}`;
}