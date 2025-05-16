import { storage } from './storage';
import { notificationService, NotificationType } from './services/notificationService';

/**
 * Utility function to synchronize payment status across the database and notify relevant parties
 * @param orderId Order ID to synchronize
 * @param paymentStatus New payment status
 */
export async function syncPaymentStatus(orderId: number, paymentStatus: string): Promise<void> {
  try {
    // 1. Update order payment status in database
    const order = await storage.getOrderById(orderId);
    if (!order) {
      console.error(`[Sync] Order with ID ${orderId} not found`);
      return;
    }
    
    // Update order payment status
    const updatedOrder = await storage.updateOrderPaymentStatus(orderId, paymentStatus);
    
    // 2. Get payments related to this order
    const payments = await storage.getPaymentsByOrderId(orderId);
    
    // 3. Ensure payment status is also updated
    for (const payment of payments) {
      if (payment.status !== paymentStatus) {
        await storage.updatePaymentStatus(payment.id, paymentStatus);
      }
    }
    
    // 4. Send notifications to relevant parties
    if (order.userId) {
      // Customer notification
      await notificationService.sendUserNotification({
        userId: order.userId,
        type: paymentStatus === 'PAID' ? NotificationType.PAYMENT_RECEIVED : NotificationType.PAYMENT_FAILED,
        title: paymentStatus === 'PAID' ? 'Payment Successful' : 'Payment Status Updated',
        message: `Your payment status for order #${order.orderNumber} has been updated to ${paymentStatus}.`,
        entityId: order.id,
        entityType: 'order'
      });
    }
    
    // Admin notification
    await notificationService.sendAdminNotification({
      type: NotificationType.ORDER_UPDATED,
      title: 'Order Payment Status Updated',
      message: `Payment status for order #${order.orderNumber} has been updated to ${paymentStatus}.`,
      entityId: order.id,
      entityType: 'order',
      isAdmin: true
    });
    
    console.log(`[Sync] Successfully synchronized payment status for order ${orderId} to ${paymentStatus}`);
  } catch (error) {
    console.error(`[Sync] Error synchronizing payment status for order ${orderId}:`, error);
  }
}

/**
 * Utility function to synchronize stock levels across the database and notify admins of low stock
 * @param productId Product ID to check and synchronize
 */
export async function syncProductStock(productId: number): Promise<void> {
  try {
    const product = await storage.getProduct(productId);
    
    if (!product) {
      console.error(`[Sync] Product with ID ${productId} not found`);
      return;
    }
    
    // Check for low stock and notify admins if needed
    // stockQuantity is now a proper field in the product schema
    const stockQuantity = product.stockQuantity || 0;
      
    if (product.inStock && stockQuantity <= 5 && stockQuantity > 0) {
      await notificationService.sendAdminNotification({
        type: NotificationType.SYSTEM,
        title: 'Low Stock Alert',
        message: `Product "${product.name}" (ID: ${product.id}) has low stock: ${stockQuantity} remaining.`,
        entityId: product.id,
        entityType: 'product',
        isAdmin: true
      });
      
      console.log(`[Sync] Low stock notification sent for product ${productId}`);
    }
    
    console.log(`[Sync] Successfully synchronized stock for product ${productId}`);
  } catch (error) {
    console.error(`[Sync] Error synchronizing stock for product ${productId}:`, error);
  }
}

/**
 * Utility function to check and synchronize database for any inconsistencies
 */
export async function syncDatabase(): Promise<void> {
  try {
    console.log('[Sync] Starting database synchronization...');
    
    // 1. Get all orders with PENDING payment status
    const pendingOrders = await storage.getAllOrders();
    const ordersToCheck = pendingOrders.filter(order => order.paymentStatus === 'PENDING');
    
    console.log(`[Sync] Found ${ordersToCheck.length} orders with PENDING payment status`);
    
    for (const order of ordersToCheck) {
      // 2. Get related payments
      const payments = await storage.getPaymentsByOrderId(order.id);
      
      // 3. If there's a successful payment, update order status
      const successfulPayment = payments.find(payment => 
        payment.status === 'SUCCESS' || payment.status === 'PAYMENT_SUCCESS');
      
      if (successfulPayment) {
        await syncPaymentStatus(order.id, 'PAID');
        console.log(`[Sync] Updated order ${order.id} payment status to PAID based on successful payment`);
      }
    }
    
    console.log('[Sync] Database synchronization completed successfully');
  } catch (error) {
    console.error('[Sync] Error during database synchronization:', error);
  }
}