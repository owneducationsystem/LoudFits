import { storage } from "../storage";
import { notificationService, NotificationType } from "./notificationService";

/**
 * Service for handling inventory operations
 */
export const inventoryService = {
  /**
   * Decrease product stock for a specific size
   * @param productId Product ID
   * @param size Size of the item
   * @param quantity Quantity to decrease
   */
  async decreaseProductStock(productId: number, size: string, quantity: number): Promise<boolean> {
    try {
      // First, get the inventory item
      const inventoryItem = await storage.getInventoryItem(productId, size);
      
      if (!inventoryItem) {
        console.error(`Inventory not found for product ${productId}, size ${size}`);
        return false;
      }
      
      const previousQuantity = inventoryItem.quantity;
      const newQuantity = Math.max(0, previousQuantity - quantity);
      
      // Update the inventory
      await storage.updateInventoryItem(productId, size, {
        quantity: newQuantity,
        inStock: newQuantity > 0
      });
      
      // Log the inventory change
      await storage.createInventoryLog({
        inventoryId: inventoryItem.id,
        action: "subtract",
        quantity: quantity,
        previousQuantity: previousQuantity,
        newQuantity: newQuantity,
        reason: "order",
        referenceId: `order-${Date.now()}`
      });
      
      // Check if stock is running low
      if (newQuantity <= (inventoryItem.lowStockThreshold || 5) && newQuantity > 0) {
        await notificationService.sendAdminNotification({
          type: NotificationType.LOW_STOCK,
          title: "Low Stock Alert",
          message: `Product ${productId} (Size: ${size}) is running low. Only ${newQuantity} units left.`,
          entityId: productId,
          entityType: 'product',
          isAdmin: true
        });
      } 
      // Check if out of stock
      else if (newQuantity === 0) {
        await notificationService.sendAdminNotification({
          type: NotificationType.OUT_OF_STOCK,
          title: "Out of Stock Alert",
          message: `Product ${productId} (Size: ${size}) is now out of stock.`,
          entityId: productId,
          entityType: 'product',
          isAdmin: true
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error decreasing stock for product ${productId}:`, error);
      return false;
    }
  },
  
  /**
   * Increase product stock for a specific size (for returns, etc.)
   * @param productId Product ID
   * @param size Size of the item
   * @param quantity Quantity to increase
   * @param reason Reason for increasing stock
   */
  async increaseProductStock(
    productId: number, 
    size: string, 
    quantity: number,
    reason: string = "return"
  ): Promise<boolean> {
    try {
      // First, get the inventory item
      const inventoryItem = await storage.getInventoryItem(productId, size);
      
      if (!inventoryItem) {
        console.error(`Inventory not found for product ${productId}, size ${size}`);
        return false;
      }
      
      const previousQuantity = inventoryItem.quantity;
      const newQuantity = previousQuantity + quantity;
      
      // Update the inventory
      await storage.updateInventoryItem(productId, size, {
        quantity: newQuantity,
        inStock: true,
        // If it's a restock, update the lastRestocked date
        ...(reason === "restock" ? { lastRestocked: new Date() } : {})
      });
      
      // Log the inventory change
      await storage.createInventoryLog({
        inventoryId: inventoryItem.id,
        action: "add",
        quantity: quantity,
        previousQuantity: previousQuantity,
        newQuantity: newQuantity,
        reason: reason,
        referenceId: `${reason}-${Date.now()}`
      });
      
      return true;
    } catch (error) {
      console.error(`Error increasing stock for product ${productId}:`, error);
      return false;
    }
  },
  
  /**
   * Reserve inventory for an order
   * @param productId Product ID
   * @param size Size of the item
   * @param quantity Quantity to reserve
   */
  async reserveInventory(
    productId: number,
    size: string,
    quantity: number,
    reason: string = "cart",
    referenceId?: string
  ): Promise<boolean> {
    try {
      // First, get the inventory item
      const inventoryItem = await storage.getInventoryItem(productId, size);
      
      if (!inventoryItem) {
        console.error(`Inventory not found for product ${productId}, size ${size}`);
        return false;
      }
      
      const availableQuantity = inventoryItem.quantity - (inventoryItem.reservedQuantity || 0);
      
      if (availableQuantity < quantity) {
        console.error(`Not enough inventory available for product ${productId}, size ${size}`);
        return false;
      }
      
      const previousReserved = inventoryItem.reservedQuantity || 0;
      const newReserved = previousReserved + quantity;
      
      // Update the inventory
      await storage.updateInventoryItem(productId, size, {
        reservedQuantity: newReserved
      });
      
      // Log the inventory change
      await storage.createInventoryLog({
        inventoryId: inventoryItem.id,
        action: "reserve",
        quantity: quantity,
        previousQuantity: previousReserved,
        newQuantity: newReserved,
        reason: reason,
        referenceId: referenceId || `${reason}-${Date.now()}`
      });
      
      return true;
    } catch (error) {
      console.error(`Error reserving inventory for product ${productId}:`, error);
      return false;
    }
  },
  
  /**
   * Release reserved inventory
   * @param productId Product ID
   * @param size Size of the item
   * @param quantity Quantity to release
   */
  async releaseInventory(
    productId: number,
    size: string,
    quantity: number,
    reason: string = "cart-expiry",
    referenceId?: string
  ): Promise<boolean> {
    try {
      // First, get the inventory item
      const inventoryItem = await storage.getInventoryItem(productId, size);
      
      if (!inventoryItem) {
        console.error(`Inventory not found for product ${productId}, size ${size}`);
        return false;
      }
      
      const currentReserved = inventoryItem.reservedQuantity || 0;
      const newReserved = Math.max(0, currentReserved - quantity);
      
      // Update the inventory
      await storage.updateInventoryItem(productId, size, {
        reservedQuantity: newReserved
      });
      
      // Log the inventory change
      await storage.createInventoryLog({
        inventoryId: inventoryItem.id,
        action: "release",
        quantity: quantity,
        previousQuantity: currentReserved,
        newQuantity: newReserved,
        reason: reason,
        referenceId: referenceId || `${reason}-${Date.now()}`
      });
      
      return true;
    } catch (error) {
      console.error(`Error releasing inventory for product ${productId}:`, error);
      return false;
    }
  }
};