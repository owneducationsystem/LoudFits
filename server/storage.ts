import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  testimonials, type Testimonial, type InsertTestimonial,
  adminLogs, type AdminLog, type InsertAdminLog,
  payments, type Payment, type InsertPayment,
  inventory, type Inventory, type InsertInventory,
  inventoryLogs, type InventoryLog, type InsertInventoryLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, like, count, sql, not, asc, isNull, isNotNull, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseId(firebaseId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;
  countUsers(): Promise<number>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getTrendingProducts(): Promise<Product[]>;
  getProductsByCollection(collection: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  countProducts(): Promise<number>;
  
  // Cart methods
  getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  addItemToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(cartId: number, productId: number, data: Partial<InsertCartItem>): Promise<CartItem>;
  removeCartItem(cartId: number, productId: number): Promise<boolean>;
  clearCart(cartId: number): Promise<boolean>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order>;
  getAllOrders(limit?: number, offset?: number): Promise<Order[]>;
  searchOrders(query: string): Promise<Order[]>;
  countOrders(): Promise<number>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  
  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getFeaturedTestimonials(): Promise<Testimonial[]>;
  
  // Admin log methods
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number, offset?: number): Promise<AdminLog[]>;
  getAdminLogsByUserId(userId: number): Promise<AdminLog[]>;
  searchAdminLogs(query: string): Promise<AdminLog[]>;
  
  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined>;
  getPaymentByMerchantTransactionId(merchantTransactionId: string): Promise<Payment | undefined>;
  getPaymentsByOrderId(orderId: number): Promise<Payment[]>;
  getPaymentsByUserId(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment>;
  updatePaymentDetails(id: number, details: Partial<InsertPayment>): Promise<Payment>;
  
  // Inventory methods
  getInventoryByProductId(productId: number): Promise<Inventory[]>;
  getInventoryItem(productId: number, size: string): Promise<Inventory | undefined>;
  getInventoryItemById(id: number): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryQuantity(id: number, quantity: number, userId?: number): Promise<Inventory>;
  updateInventoryItem(productId: number, size: string, data: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventoryItem(productId: number, size: string): Promise<boolean>;
  getAllInventory(): Promise<Inventory[]>;
  reserveInventory(productId: number, size: string, quantity: number, reason: string, referenceId?: string): Promise<Inventory | undefined>;
  releaseInventory(productId: number, size: string, quantity: number, reason: string, referenceId?: string): Promise<Inventory | undefined>;
  getLowStockInventory(threshold?: number): Promise<Inventory[]>;
  getOutOfStockInventory(): Promise<Inventory[]>;
  createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog>;
  getInventoryLogs(inventoryId: number): Promise<InventoryLog[]>;
  updateProductStockStatus(productId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseId, firebaseId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, searchTerm),
          like(users.email, searchTerm),
          like(users.name, searchTerm)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async countUsers(): Promise<number> {
    const [{ value }] = await db
      .select({ value: count() })
      .from(users);
    return value;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true))
      .orderBy(desc(products.createdAt))
      .limit(10);
  }

  async getTrendingProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.trending, true))
      .orderBy(desc(products.createdAt))
      .limit(10);
  }

  async getProductsByCollection(collection: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.collection, collection))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(
    id: number,
    productData: Partial<InsertProduct>
  ): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();
    return result.length > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, searchTerm),
          like(products.description, searchTerm),
          like(products.collection, searchTerm),
          like(products.tags, searchTerm)
        )
      )
      .orderBy(desc(products.createdAt));
  }

  async countProducts(): Promise<number> {
    const [{ value }] = await db
      .select({ value: count() })
      .from(products);
    return value;
  }

  // Cart methods
  async getCartByUserId(
    userId: number
  ): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    // First get the cart
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));

    if (!cart) {
      return undefined;
    }

    // Then get the cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    return { cart, items };
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const [cart] = await db
      .insert(carts)
      .values(insertCart)
      .returning();
    return cart;
  }

  async addItemToCart(insertItem: InsertCartItem): Promise<CartItem> {
    // Check if the item already exists in the cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, insertItem.cartId),
          eq(cartItems.productId, insertItem.productId),
          eq(cartItems.size, insertItem.size || "")
        )
      );

    if (existingItem) {
      // Update the quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + insertItem.quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Insert a new item
      const [newItem] = await db
        .insert(cartItems)
        .values(insertItem)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(
    cartId: number,
    productId: number,
    data: Partial<InsertCartItem>
  ): Promise<CartItem> {
    const [item] = await db
      .update(cartItems)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId)
        )
      )
      .returning();
    return item;
  }

  async removeCartItem(cartId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async clearCart(cartId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .returning();
    return result.length > 0;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(limit = 20, offset = 0): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(orders.createdAt));
  }

  async searchOrders(query: string): Promise<Order[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(orders)
      .where(
        or(
          like(orders.orderNumber, searchTerm),
          like(orders.customerName, searchTerm),
          like(orders.customerEmail, searchTerm),
          like(orders.customerPhone, searchTerm),
          like(orders.status, searchTerm)
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  async countOrders(): Promise<number> {
    const [{ value }] = await db
      .select({ value: count() })
      .from(orders);
    return value;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return orderItem;
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials);
  }

  async createTestimonial(
    testimonial: InsertTestimonial
  ): Promise<Testimonial> {
    const [newTestimonial] = await db
      .insert(testimonials)
      .values(testimonial)
      .returning();
    return newTestimonial;
  }

  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.featured, true))
      .orderBy(desc(testimonials.createdAt));
  }

  // Admin log methods
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db
      .insert(adminLogs)
      .values(log)
      .returning();
    return adminLog;
  }

  async getAdminLogs(limit = 50, offset = 0): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(adminLogs.createdAt));
  }

  async getAdminLogsByUserId(userId: number): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .where(eq(adminLogs.userId, userId))
      .orderBy(desc(adminLogs.createdAt));
  }

  async searchAdminLogs(query: string): Promise<AdminLog[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(adminLogs)
      .where(like(adminLogs.action, searchTerm))
      .orderBy(desc(adminLogs.createdAt));
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, transactionId));
    return payment;
  }

  async getPaymentByMerchantTransactionId(merchantTransactionId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.merchantTransactionId, merchantTransactionId));
    return payment;
  }

  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ 
        status, 
        updatedAt: new Date(),
        paymentDate: status === "completed" ? new Date() : undefined
      })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async updatePaymentDetails(id: number, details: Partial<InsertPayment>): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ 
        ...details, 
        updatedAt: new Date() 
      })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Inventory methods
  async getInventoryByProductId(productId: number): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .orderBy(asc(inventory.size));
  }

  async getInventoryItem(productId: number, size: string): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.size, size)
        )
      );
    return item;
  }
  
  async getInventoryItemById(id: number): Promise<Inventory | undefined> {
    const [item] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
    return item;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db
      .insert(inventory)
      .values(item)
      .returning();
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(item.productId);
    
    return newItem;
  }

  async updateInventoryQuantity(id: number, quantity: number, userId?: number): Promise<Inventory> {
    // Get current inventory record
    const [currentInventory] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, id));
    
    if (!currentInventory) {
      throw new Error("Inventory item not found");
    }
    
    // Update the inventory with new quantity
    const [updatedInventory] = await db
      .update(inventory)
      .set({
        quantity,
        updatedAt: new Date(),
        inStock: quantity > 0,
        lastRestocked: quantity > currentInventory.quantity ? new Date() : currentInventory.lastRestocked
      })
      .where(eq(inventory.id, id))
      .returning();
    
    // Create inventory log
    await this.createInventoryLog({
      inventoryId: id,
      userId,
      action: quantity > currentInventory.quantity ? "add" : "subtract",
      quantity: Math.abs(quantity - currentInventory.quantity),
      previousQuantity: currentInventory.quantity,
      newQuantity: quantity,
      reason: "adjustment",
      referenceId: null
    });
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(updatedInventory.productId);
    
    return updatedInventory;
  }

  async reserveInventory(
    productId: number, 
    size: string, 
    quantity: number, 
    reason: string, 
    referenceId?: string
  ): Promise<Inventory | undefined> {
    // Get current inventory
    const item = await this.getInventoryItem(productId, size);
    
    if (!item || item.quantity < quantity) {
      return undefined; // Not enough stock
    }
    
    // Update reserved quantity
    const [updatedInventory] = await db
      .update(inventory)
      .set({
        reservedQuantity: (item.reservedQuantity || 0) + quantity,
        inStock: (item.quantity - ((item.reservedQuantity || 0) + quantity)) > 0,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.size, size)
        )
      )
      .returning();
    
    // Create inventory log
    await this.createInventoryLog({
      inventoryId: item.id,
      userId: null,
      action: "reserve",
      quantity,
      previousQuantity: item.quantity,
      newQuantity: item.quantity, // Actual quantity doesn't change, just reserved
      reason,
      referenceId: referenceId || null
    });
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(productId);
    
    return updatedInventory;
  }

  async releaseInventory(
    productId: number, 
    size: string, 
    quantity: number, 
    reason: string, 
    referenceId?: string
  ): Promise<Inventory | undefined> {
    // Get current inventory
    const item = await this.getInventoryItem(productId, size);
    
    if (!item || item.reservedQuantity < quantity) {
      return undefined; // Can't release more than what's reserved
    }
    
    // Update reserved quantity
    const [updatedInventory] = await db
      .update(inventory)
      .set({
        reservedQuantity: (item.reservedQuantity || 0) - quantity,
        inStock: (item.quantity - ((item.reservedQuantity || 0) - quantity)) > 0,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.size, size)
        )
      )
      .returning();
    
    // Create inventory log
    await this.createInventoryLog({
      inventoryId: item.id,
      userId: null,
      action: "release",
      quantity,
      previousQuantity: item.quantity,
      newQuantity: item.quantity, // Actual quantity doesn't change, just reserved
      reason,
      referenceId: referenceId || null
    });
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(productId);
    
    return updatedInventory;
  }

  async getLowStockInventory(threshold: number = 5): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(
        sql`(${inventory.quantity} - COALESCE(${inventory.reservedQuantity}, 0)) <= COALESCE(${inventory.lowStockThreshold}, ${threshold})`
      )
      .orderBy(asc(inventory.productId))
      .orderBy(asc(inventory.size));
  }

  async getOutOfStockInventory(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .where(
        or(
          eq(inventory.inStock, false),
          sql`(${inventory.quantity} - COALESCE(${inventory.reservedQuantity}, 0)) <= 0`
        )
      )
      .orderBy(asc(inventory.productId))
      .orderBy(asc(inventory.size));
  }
  
  async getAllInventory(): Promise<Inventory[]> {
    return await db
      .select()
      .from(inventory)
      .orderBy(asc(inventory.productId))
      .orderBy(asc(inventory.size));
  }
  
  async updateInventoryItem(
    productId: number, 
    size: string, 
    data: Partial<InsertInventory>
  ): Promise<Inventory> {
    // Get current inventory
    const item = await this.getInventoryItem(productId, size);
    
    if (!item) {
      throw new Error("Inventory item not found");
    }
    
    // Update fields, keeping track if quantity changed
    const quantityChanged = 'quantity' in data && data.quantity !== item.quantity;
    const lastRestocked = quantityChanged && data.quantity > item.quantity 
      ? new Date() 
      : item.lastRestocked;
    
    // Calculate inStock status based on available inventory
    const newQuantity = data.quantity ?? item.quantity;
    const newReservedQuantity = data.reservedQuantity ?? item.reservedQuantity;
    const availableStock = newQuantity - (newReservedQuantity || 0);
    const inStock = availableStock > 0;
    
    // Update the inventory record
    const [updatedInventory] = await db
      .update(inventory)
      .set({
        ...data,
        inStock,
        lastRestocked: lastRestocked || item.lastRestocked,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.size, size)
        )
      )
      .returning();
    
    // If quantity changed, create a log entry
    if (quantityChanged) {
      await this.createInventoryLog({
        inventoryId: item.id,
        userId: null,
        action: data.quantity > item.quantity ? "add" : "subtract",
        quantity: Math.abs((data.quantity || 0) - item.quantity),
        previousQuantity: item.quantity,
        newQuantity: data.quantity || 0,
        reason: "adjustment",
        referenceId: null
      });
    }
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(productId);
    
    return updatedInventory;
  }
  
  async deleteInventoryItem(productId: number, size: string): Promise<boolean> {
    // First check if item exists
    const item = await this.getInventoryItem(productId, size);
    
    if (!item) {
      return false;
    }
    
    // Create a final log entry before deletion
    await this.createInventoryLog({
      inventoryId: item.id,
      userId: null,
      action: "subtract",
      quantity: item.quantity,
      previousQuantity: item.quantity,
      newQuantity: 0,
      reason: "deleted",
      referenceId: null
    });
    
    // Delete the inventory item
    await db
      .delete(inventory)
      .where(
        and(
          eq(inventory.productId, productId),
          eq(inventory.size, size)
        )
      );
    
    // Update the product's overall stock status
    await this.updateProductStockStatus(productId);
    
    return true;
  }

  async createInventoryLog(log: InsertInventoryLog): Promise<InventoryLog> {
    const [newLog] = await db
      .insert(inventoryLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getInventoryLogs(inventoryId: number): Promise<InventoryLog[]> {
    return await db
      .select()
      .from(inventoryLogs)
      .where(eq(inventoryLogs.inventoryId, inventoryId))
      .orderBy(desc(inventoryLogs.createdAt));
  }

  async updateProductStockStatus(productId: number): Promise<boolean> {
    // Get all inventory for this product
    const inventoryItems = await this.getInventoryByProductId(productId);
    
    // Check if any size is in stock
    const isInStock = inventoryItems.some(item => 
      item.inStock && (item.quantity - (item.reservedQuantity || 0)) > 0
    );
    
    // Update the product's inStock status
    await db
      .update(products)
      .set({ inStock: isInStock })
      .where(eq(products.id, productId));
    
    return isInStock;
  }

  async seedInitialData() {
    // Check if we already have users
    const userCount = await this.countUsers();
    if (userCount === 0) {
      // Seed an admin user
      await db.insert(users).values({
        username: "admin",
        email: "admin@example.com",
        password: "$2b$10$0eGz7FmeAOL6/u.g0pKZn.UZ2XkmXScoF7zQy0yvAOJQNrIvQZPGG", // Restart@123
        role: "admin",
        name: "Admin User",
        phone: "1234567890",
        active: true,
      });
    }

    // Check if we have any test products
    const productCount = await this.countProducts();
    if (productCount === 0) {
      // Seed a couple of test products
      await db.insert(products).values([
        {
          name: "Basic Black Tee",
          description: "A comfortable black t-shirt made from 100% cotton.",
          price: 19.99,
          salePrice: 15.99,
          collection: "essentials",
          images: ["https://example.com/images/black-tee.jpg"],
          sku: "BT-001",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black"],
          inStock: true,
          featured: true,
          trending: true,
        },
        {
          name: "Loud Logo Tee",
          description: "A bold t-shirt with the Loudfits logo.",
          price: 24.99,
          salePrice: null,
          collection: "logo",
          images: ["https://example.com/images/logo-tee.jpg"],
          sku: "LT-001",
          sizes: ["S", "M", "L", "XL", "XXL"],
          colors: ["White", "Black", "Red"],
          inStock: true,
          featured: true,
        },
      ]);
    }
  }
}

// Create an instance of the storage
const storage = new DatabaseStorage();
export { storage };

// Try to initialize the database once
(async () => {
  try {
    await storage.seedInitialData();
    console.log("Database initialized with seed data if needed");
  } catch (error) {
    console.error("Error initializing database:", error);
    console.log("The application will continue to function but some features may be limited.");
  }
})();