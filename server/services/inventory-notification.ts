import { notificationService, NotificationType } from './notificationService';
import { storage } from '../storage';

/**
 * Send a low stock notification for a specific product size
 * @param productId Product ID
 * @param size Size that's low in stock
 * @param availableStock Available stock (quantity - reserved)
 * @param threshold Low stock threshold
 */
export async function sendLowStockNotification(
  productId: number, 
  size: string, 
  availableStock: number, 
  threshold: number = 5
) {
  const priority = availableStock === 0 ? 'urgent' : (availableStock <= 2 ? 'high' : 'medium');
  const type = availableStock === 0 ? NotificationType.OUT_OF_STOCK : NotificationType.LOW_STOCK;
  
  try {
    // Get product name for a better notification message
    const product = await storage.getProduct(productId);
    const productName = product ? product.name : `Product #${productId}`;
    
    return notificationService.sendAdminNotification({
      type,
      title: availableStock === 0 
        ? `Size ${size} Out of Stock!` 
        : `Low Stock Alert: Size ${size}`,
      message: availableStock === 0 
        ? `${productName} in size ${size} is now out of stock and needs immediate attention.`
        : `${productName} in size ${size} is running low with only ${availableStock} items available.`,
      entityId: productId,
      entityType: 'inventory',
      priority,
      actionRequired: true,
      actionType: 'restock_size',
      metadata: {
        productId,
        size,
        availableStock,
        threshold
      }
    });
  } catch (error) {
    console.error('Error sending low stock notification:', error);
    // Fallback to a simpler notification if we can't get the product details
    return notificationService.sendAdminNotification({
      type,
      title: availableStock === 0 
        ? `Size ${size} Out of Stock!` 
        : `Low Stock Alert: Size ${size}`,
      message: availableStock === 0 
        ? `Product ID ${productId} in size ${size} is now out of stock.`
        : `Product ID ${productId} in size ${size} is running low with only ${availableStock} items available.`,
      entityId: productId,
      entityType: 'inventory',
      priority,
      actionRequired: true,
      actionType: 'restock_size',
      metadata: {
        productId,
        size,
        availableStock,
        threshold
      }
    });
  }
}