import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { sendLowStockNotification } from '../services/inventory-notification';

// Helper function to safely calculate remaining inventory
function calculateRemaining(inventory: { quantity: number, reservedQuantity: number | null }) {
  return inventory.quantity - (inventory.reservedQuantity || 0);
}

export const inventoryRouter = Router();

// Schema validation for inventory-related endpoints
const inventoryUpdateSchema = z.object({
  productId: z.number(),
  size: z.string(),
  quantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional()
});

const inventoryQuerySchema = z.object({
  productId: z.string().transform(val => parseInt(val, 10)).optional(),
  size: z.string().optional(),
  lowStock: z.enum(['true', 'false']).optional().transform(val => val === 'true')
});

const bulkUpdateSchema = z.array(
  z.object({
    productId: z.number(), 
    size: z.string(),
    quantity: z.number().int().nonnegative(),
    reservedQuantity: z.number().int().nonnegative().optional()
  })
);

// Get inventory for a specific product
inventoryRouter.get('/inventory/product/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    const inventoryItems = await storage.getInventoryByProductId(productId);
    
    if (!inventoryItems || inventoryItems.length === 0) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    
    return res.json(inventoryItems);
  } catch (error) {
    console.error('Error fetching product inventory:', error);
    return res.status(500).json({ message: 'Failed to fetch inventory data' });
  }
});

// Get all inventory (with optional filters)
inventoryRouter.get('/inventory', async (req, res) => {
  try {
    const queryResult = inventoryQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({ 
        message: 'Invalid query parameters', 
        errors: queryResult.error.errors 
      });
    }
    
    const { productId, size, lowStock } = queryResult.data;
    
    let inventoryItems;
    
    if (productId && size) {
      // Get specific item
      const item = await storage.getInventoryItem(productId, size);
      inventoryItems = item ? [item] : [];
    } else if (productId) {
      // Get all sizes for a product
      inventoryItems = await storage.getInventoryByProductId(productId);
    } else if (lowStock) {
      // Get all low stock items
      inventoryItems = await storage.getLowStockInventory();
    } else {
      // Get all inventory
      inventoryItems = await storage.getAllInventory();
    }
    
    return res.json(inventoryItems);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ message: 'Failed to fetch inventory data' });
  }
});

// Create or update an inventory item
inventoryRouter.post('/inventory', async (req, res) => {
  try {
    const result = inventoryUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid inventory data', 
        errors: result.error.errors 
      });
    }
    
    const { productId, size, quantity, reservedQuantity, lowStockThreshold } = result.data;
    
    // Check if inventory item exists
    const existingItem = await storage.getInventoryItem(productId, size);
    
    let inventory;
    
    if (existingItem) {
      // Update existing item
      inventory = await storage.updateInventoryItem(
        productId,
        size,
        {
          quantity, 
          reservedQuantity: reservedQuantity ?? existingItem.reservedQuantity,
          lowStockThreshold: lowStockThreshold ?? existingItem.lowStockThreshold
        }
      );
      
      // Calculate available stock
      const availableStock = inventory.quantity - (inventory.reservedQuantity || 0);
      const threshold = inventory.lowStockThreshold || 5;
      
      // Check for low stock and send notification if necessary
      if (availableStock <= threshold) {
        await sendLowStockNotification(productId, size, availableStock, threshold);
      }
    } else {
      // Create new inventory item
      inventory = await storage.createInventoryItem({
        productId,
        size,
        quantity,
        reservedQuantity: reservedQuantity || 0,
        lowStockThreshold: lowStockThreshold || 5
      });
    }
    
    return res.status(existingItem ? 200 : 201).json(inventory);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return res.status(500).json({ message: 'Failed to update inventory' });
  }
});

// Bulk update inventory
inventoryRouter.post('/inventory/bulk', async (req, res) => {
  try {
    const result = bulkUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid inventory data', 
        errors: result.error.errors 
      });
    }
    
    const updates = result.data;
    const updatedItems = [];
    const notifications = [];
    
    for (const update of updates) {
      const { productId, size, quantity, reservedQuantity } = update;
      
      // Check if item exists
      const existingItem = await storage.getInventoryItem(productId, size);
      
      let inventory;
      
      if (existingItem) {
        // Update existing item
        inventory = await storage.updateInventoryItem(
          productId,
          size,
          {
            quantity, 
            reservedQuantity: reservedQuantity ?? existingItem.reservedQuantity
          }
        );
      } else {
        // Create new inventory item
        inventory = await storage.createInventoryItem({
          productId,
          size,
          quantity,
          reservedQuantity: reservedQuantity || 0,
          lowStockThreshold: 5 // Default threshold
        });
      }
      
      updatedItems.push(inventory);
      
      // Check for low stock
      const availableStock = inventory.quantity - (inventory.reservedQuantity || 0);
      const threshold = inventory.lowStockThreshold || 5;
      
      if (availableStock <= threshold) {
        // Queue notification to avoid too many concurrent notifications
        notifications.push({ productId, size, availableStock, threshold });
      }
    }
    
    // Send notifications after processing all updates
    for (const notification of notifications) {
      const { productId, size, availableStock, threshold } = notification;
      await sendLowStockNotification(productId, size, availableStock, threshold);
    }
    
    return res.status(200).json(updatedItems);
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    return res.status(500).json({ message: 'Failed to update inventory' });
  }
});

// Reserve inventory for a product size
inventoryRouter.post('/inventory/reserve', async (req, res) => {
  try {
    const schema = z.object({
      productId: z.number(),
      size: z.string(),
      quantity: z.number().int().positive()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: result.error.errors 
      });
    }
    
    const { productId, size, quantity } = result.data;
    
    // Check if there's enough available inventory
    const inventory = await storage.getInventoryItem(productId, size);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product and size' });
    }
    
    const availableQuantity = inventory.quantity - (inventory.reservedQuantity || 0);
    
    if (availableQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Not enough inventory available to reserve',
        available: availableQuantity,
        requested: quantity
      });
    }
    
    // Reserve the inventory
    const updatedInventory = await storage.updateInventoryItem(
      productId,
      size,
      {
        reservedQuantity: (inventory.reservedQuantity || 0) + quantity
      }
    );
    
    return res.json({
      success: true,
      inventory: updatedInventory,
      reserved: quantity,
      remaining: calculateRemaining(updatedInventory)
    });
  } catch (error) {
    console.error('Error reserving inventory:', error);
    return res.status(500).json({ message: 'Failed to reserve inventory' });
  }
});

// Release previously reserved inventory
inventoryRouter.post('/inventory/release', async (req, res) => {
  try {
    const schema = z.object({
      productId: z.number(),
      size: z.string(),
      quantity: z.number().int().positive()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: result.error.errors 
      });
    }
    
    const { productId, size, quantity } = result.data;
    
    // Check reserved inventory
    const inventory = await storage.getInventoryItem(productId, size);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product and size' });
    }
    
    if (!inventory.reservedQuantity || inventory.reservedQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Cannot release more than what is reserved',
        reserved: inventory.reservedQuantity || 0,
        requested: quantity
      });
    }
    
    // Release the inventory
    const updatedInventory = await storage.updateInventoryItem(
      productId,
      size,
      {
        reservedQuantity: inventory.reservedQuantity - quantity
      }
    );
    
    return res.json({
      success: true,
      inventory: updatedInventory,
      released: quantity,
      remaining: calculateRemaining(updatedInventory)
    });
  } catch (error) {
    console.error('Error releasing inventory:', error);
    return res.status(500).json({ message: 'Failed to release inventory' });
  }
});

// Finalize reserved inventory (reduce actual quantity after order completion)
inventoryRouter.post('/inventory/finalize', async (req, res) => {
  try {
    const schema = z.object({
      productId: z.number(),
      size: z.string(),
      quantity: z.number().int().positive()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: result.error.errors 
      });
    }
    
    const { productId, size, quantity } = result.data;
    
    // Check reserved inventory
    const inventory = await storage.getInventoryItem(productId, size);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product and size' });
    }
    
    if (!inventory.reservedQuantity || inventory.reservedQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Cannot finalize more than what is reserved',
        reserved: inventory.reservedQuantity || 0,
        requested: quantity
      });
    }
    
    // Reduce both quantity and reserved quantity
    const updatedInventory = await storage.updateInventoryItem(
      productId,
      size,
      {
        quantity: inventory.quantity - quantity,
        reservedQuantity: inventory.reservedQuantity - quantity
      }
    );
    
    // Calculate available stock
    const availableStock = updatedInventory.quantity - (updatedInventory.reservedQuantity || 0);
    const threshold = updatedInventory.lowStockThreshold || 5;
    
    // Check for low stock and send notification if necessary
    if (availableStock <= threshold) {
      await sendLowStockNotification(productId, size, availableStock, threshold);
    }
    
    return res.json({
      success: true,
      inventory: updatedInventory,
      finalized: quantity,
      available: calculateRemaining(updatedInventory)
    });
  } catch (error) {
    console.error('Error finalizing inventory:', error);
    return res.status(500).json({ message: 'Failed to finalize inventory' });
  }
});

// Delete inventory item
inventoryRouter.delete('/inventory/:productId/:size', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    const size = req.params.size;
    
    if (isNaN(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    
    // Check if item exists
    const existingItem = await storage.getInventoryItem(productId, size);
    
    if (!existingItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    // Delete the item
    await storage.deleteInventoryItem(productId, size);
    
    return res.status(200).json({ success: true, message: 'Inventory item deleted' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return res.status(500).json({ message: 'Failed to delete inventory item' });
  }
});

// Reserve inventory by ID (for admin UI)
inventoryRouter.post('/inventory/:id/reserve', async (req, res) => {
  try {
    const inventoryId = parseInt(req.params.id, 10);
    
    if (isNaN(inventoryId)) {
      return res.status(400).json({ message: 'Invalid inventory ID' });
    }
    
    const schema = z.object({
      quantity: z.number().int().positive(),
      reason: z.string(),
      referenceId: z.string().optional()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: result.error.errors 
      });
    }
    
    const { quantity, reason, referenceId } = result.data;
    
    // Get the inventory item by ID first
    const inventory = await storage.getInventoryItemById(inventoryId);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    const availableQuantity = inventory.quantity - (inventory.reservedQuantity || 0);
    
    if (availableQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Not enough available inventory',
        available: availableQuantity,
        requested: quantity
      });
    }
    
    // Reserve the inventory
    const updatedInventory = await storage.updateInventoryItem(
      inventory.productId,
      inventory.size,
      {
        reservedQuantity: (inventory.reservedQuantity || 0) + quantity
      }
    );
    
    // Log the inventory action if implemented
    try {
      // Create inventory log if the method exists
      if (typeof storage.createInventoryLog === 'function') {
        await storage.createInventoryLog({
          inventoryId: inventory.id,
          action: 'RESERVE',
          quantity,
          previousQuantity: inventory.quantity,
          newQuantity: updatedInventory.quantity,
          reason,
          referenceId: referenceId || null
        });
      }
    } catch (logError) {
      console.error('Error logging inventory action:', logError);
      // Continue anyway, don't fail the main operation
    }
    
    return res.json({
      success: true,
      inventory: updatedInventory,
      reserved: quantity,
      remaining: calculateRemaining(updatedInventory)
    });
  } catch (error) {
    console.error('Error reserving inventory:', error);
    return res.status(500).json({ message: 'Failed to reserve inventory' });
  }
});

// Release inventory by ID (for admin UI)
inventoryRouter.post('/inventory/:id/release', async (req, res) => {
  try {
    const inventoryId = parseInt(req.params.id, 10);
    
    if (isNaN(inventoryId)) {
      return res.status(400).json({ message: 'Invalid inventory ID' });
    }
    
    const schema = z.object({
      quantity: z.number().int().positive(),
      reason: z.string(),
      referenceId: z.string().optional()
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: result.error.errors 
      });
    }
    
    const { quantity, reason, referenceId } = result.data;
    
    // Get the inventory item by ID first
    const inventory = await storage.getInventoryItemById(inventoryId);
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (!inventory.reservedQuantity || inventory.reservedQuantity < quantity) {
      return res.status(400).json({ 
        message: 'Cannot release more than what is reserved',
        reserved: inventory.reservedQuantity || 0,
        requested: quantity
      });
    }
    
    // Release the inventory
    const updatedInventory = await storage.updateInventoryItem(
      inventory.productId,
      inventory.size,
      {
        reservedQuantity: inventory.reservedQuantity - quantity
      }
    );
    
    // Log the inventory action if implemented
    try {
      // Create inventory log if the method exists
      if (typeof storage.createInventoryLog === 'function') {
        await storage.createInventoryLog({
          inventoryId: inventory.id,
          action: 'RELEASE',
          quantity,
          previousQuantity: inventory.quantity,
          newQuantity: updatedInventory.quantity,
          reason,
          referenceId: referenceId || null
        });
      }
    } catch (logError) {
      console.error('Error logging inventory action:', logError);
      // Continue anyway, don't fail the main operation
    }
    
    return res.json({
      success: true,
      inventory: updatedInventory,
      released: quantity,
      remaining: calculateRemaining(updatedInventory)
    });
  } catch (error) {
    console.error('Error releasing inventory:', error);
    return res.status(500).json({ message: 'Failed to release inventory' });
  }
});