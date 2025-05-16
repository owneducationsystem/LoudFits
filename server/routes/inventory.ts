import { Router } from "express";
import { storage } from "../storage";
import { insertInventorySchema } from "@shared/schema";
import { notificationService } from "../services/notificationService";

export const inventoryRouter = Router();

// Get inventory for a product
inventoryRouter.get("/products/:productId/inventory", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const inventory = await storage.getInventoryByProductId(productId);
    res.json(inventory);
  } catch (error) {
    console.error("Error fetching product inventory:", error);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Get specific inventory item
inventoryRouter.get("/products/:productId/inventory/:size", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const size = req.params.size;
    
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const inventoryItem = await storage.getInventoryItem(productId, size);
    
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }
    
    res.json(inventoryItem);
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
});

// Create inventory item
inventoryRouter.post("/products/:productId/inventory", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    // Validate request body
    const parseResult = insertInventorySchema.safeParse({ 
      ...req.body, 
      productId 
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid inventory data", 
        details: parseResult.error.format() 
      });
    }
    
    // Check if inventory item for this size already exists
    const existingItem = await storage.getInventoryItem(productId, parseResult.data.size);
    
    if (existingItem) {
      return res.status(409).json({ 
        error: "Inventory item already exists for this size",
        inventoryId: existingItem.id
      });
    }
    
    // Create new inventory item
    const newItem = await storage.createInventoryItem(parseResult.data);
    
    // Send notification if low stock
    const availableStock = newItem.quantity - (newItem.reservedQuantity || 0);
    const lowStockThreshold = newItem.lowStockThreshold || 5;
    
    if (availableStock <= lowStockThreshold) {
      await notificationService.sendLowStockNotification(
        productId,
        newItem.size,
        availableStock,
        lowStockThreshold
      );
    }
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error creating inventory item:", error);
    res.status(500).json({ error: "Failed to create inventory item" });
  }
});

// Update inventory quantity
inventoryRouter.patch("/inventory/:id/quantity", async (req, res) => {
  try {
    const inventoryId = parseInt(req.params.id);
    const { quantity, userId } = req.body;
    
    if (isNaN(inventoryId) || typeof quantity !== 'number') {
      return res.status(400).json({ error: "Invalid inventory ID or quantity" });
    }
    
    // Update inventory quantity
    const updatedItem = await storage.updateInventoryQuantity(
      inventoryId, 
      quantity,
      userId ? parseInt(userId) : undefined
    );
    
    // Check for low stock after update
    const availableStock = updatedItem.quantity - (updatedItem.reservedQuantity || 0);
    const lowStockThreshold = updatedItem.lowStockThreshold || 5;
    
    if (availableStock <= lowStockThreshold) {
      await notificationService.sendLowStockNotification(
        updatedItem.productId,
        updatedItem.size,
        availableStock,
        lowStockThreshold
      );
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory quantity:", error);
    res.status(500).json({ error: "Failed to update inventory quantity" });
  }
});

// Reserve inventory
inventoryRouter.post("/products/:productId/inventory/:size/reserve", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const size = req.params.size;
    const { quantity, reason, referenceId } = req.body;
    
    if (isNaN(productId) || typeof quantity !== 'number' || !reason) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }
    
    // Reserve inventory
    const updatedItem = await storage.reserveInventory(productId, size, quantity, reason, referenceId);
    
    if (!updatedItem) {
      return res.status(400).json({ error: "Not enough inventory available" });
    }
    
    // Check for low stock after reservation
    const availableStock = updatedItem.quantity - (updatedItem.reservedQuantity || 0);
    const lowStockThreshold = updatedItem.lowStockThreshold || 5;
    
    if (availableStock <= lowStockThreshold) {
      await notificationService.sendLowStockNotification(
        productId,
        size,
        availableStock,
        lowStockThreshold
      );
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error reserving inventory:", error);
    res.status(500).json({ error: "Failed to reserve inventory" });
  }
});

// Release inventory
inventoryRouter.post("/products/:productId/inventory/:size/release", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const size = req.params.size;
    const { quantity, reason, referenceId } = req.body;
    
    if (isNaN(productId) || typeof quantity !== 'number' || !reason) {
      return res.status(400).json({ error: "Invalid request parameters" });
    }
    
    // Release inventory
    const updatedItem = await storage.releaseInventory(productId, size, quantity, reason, referenceId);
    
    if (!updatedItem) {
      return res.status(400).json({ error: "Cannot release more than what is reserved" });
    }
    
    res.json(updatedItem);
  } catch (error) {
    console.error("Error releasing inventory:", error);
    res.status(500).json({ error: "Failed to release inventory" });
  }
});

// Get low stock inventory
inventoryRouter.get("/inventory/low-stock", async (req, res) => {
  try {
    const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : undefined;
    const lowStockItems = await storage.getLowStockInventory(threshold);
    res.json(lowStockItems);
  } catch (error) {
    console.error("Error fetching low stock inventory:", error);
    res.status(500).json({ error: "Failed to fetch low stock inventory" });
  }
});

// Get out of stock inventory
inventoryRouter.get("/inventory/out-of-stock", async (req, res) => {
  try {
    const outOfStockItems = await storage.getOutOfStockInventory();
    res.json(outOfStockItems);
  } catch (error) {
    console.error("Error fetching out of stock inventory:", error);
    res.status(500).json({ error: "Failed to fetch out of stock inventory" });
  }
});

// Get inventory logs for an item
inventoryRouter.get("/inventory/:id/logs", async (req, res) => {
  try {
    const inventoryId = parseInt(req.params.id);
    
    if (isNaN(inventoryId)) {
      return res.status(400).json({ error: "Invalid inventory ID" });
    }
    
    const logs = await storage.getInventoryLogs(inventoryId);
    res.json(logs);
  } catch (error) {
    console.error("Error fetching inventory logs:", error);
    res.status(500).json({ error: "Failed to fetch inventory logs" });
  }
});