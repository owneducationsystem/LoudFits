import {
  User,
  Product,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Payment,
  Testimonial,
  AdminLog,
  InsertUser,
  InsertProduct,
  InsertCart,
  InsertCartItem,
  InsertOrder,
  InsertOrderItem,
  InsertTestimonial,
  InsertPayment,
  InsertAdminLog
} from "@shared/schema";

import { IStorage } from "./storage";

/**
 * Memory-based fallback storage implementation
 * Used when database connection fails
 */
export class MemFallbackStorage implements IStorage {
  private users: User[] = [];
  private products: Product[] = [];
  private carts: Cart[] = [];
  private cartItems: CartItem[] = [];
  private orders: Order[] = [];
  private orderItems: OrderItem[] = [];
  private testimonials: Testimonial[] = [];
  private adminLogs: AdminLog[] = [];
  private payments: Payment[] = [];
  
  private nextIds = {
    user: 1,
    product: 1,
    cart: 1,
    cartItem: 1,
    order: 1,
    orderItem: 1,
    testimonial: 1,
    adminLog: 1,
    payment: 1
  };
  
  constructor(private originalStorage: IStorage) {
    console.log("Memory fallback storage initialized");
  }
  
  // Helper method to try primary storage first, then fall back to memory
  private async tryPrimary<T>(primaryFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
    try {
      return await primaryFn();
    } catch (error) {
      console.warn("Database operation failed, using memory fallback storage:", error);
      return await fallbackFn();
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getUser(id),
      async () => this.users.find(user => user.id === id)
    );
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getUserByUsername(username),
      async () => this.users.find(user => user.username === username)
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getUserByEmail(email),
      async () => this.users.find(user => user.email === email)
    );
  }
  
  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getUserByFirebaseId(firebaseId),
      async () => this.users.find(user => user.firebaseId === firebaseId)
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    return await this.tryPrimary(
      () => this.originalStorage.createUser(user),
      async () => {
        const newUser: User = {
          id: this.nextIds.user++,
          ...user,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.users.push(newUser);
        return newUser;
      }
    );
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    return await this.tryPrimary(
      () => this.originalStorage.updateUser(id, userData),
      async () => {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
          throw new Error(`User with ID ${id} not found`);
        }
        
        this.users[userIndex] = {
          ...this.users[userIndex],
          ...userData,
          updatedAt: new Date()
        };
        
        return this.users[userIndex];
      }
    );
  }
  
  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getAllUsers(limit, offset),
      async () => {
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        return this.users.slice(start, end);
      }
    );
  }
  
  async searchUsers(query: string): Promise<User[]> {
    return await this.tryPrimary(
      () => this.originalStorage.searchUsers(query),
      async () => {
        const lowerQuery = query.toLowerCase();
        return this.users.filter(user => 
          user.username.toLowerCase().includes(lowerQuery) || 
          (user.email && user.email.toLowerCase().includes(lowerQuery))
        );
      }
    );
  }
  
  async countUsers(): Promise<number> {
    return await this.tryPrimary(
      () => this.originalStorage.countUsers(),
      async () => this.users.length
    );
  }
  
  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getAllProducts(),
      async () => this.products
    );
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getProduct(id),
      async () => this.products.find(product => product.id === id)
    );
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getFeaturedProducts(),
      async () => this.products.filter(product => product.featured)
    );
  }
  
  async getTrendingProducts(): Promise<Product[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getTrendingProducts(),
      async () => this.products.filter(product => product.trending)
    );
  }
  
  async getProductsByCollection(collection: string): Promise<Product[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getProductsByCollection(collection),
      async () => this.products.filter(product => product.collection === collection)
    );
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    return await this.tryPrimary(
      () => this.originalStorage.createProduct(product),
      async () => {
        const newProduct: Product = {
          id: this.nextIds.product++,
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.products.push(newProduct);
        return newProduct;
      }
    );
  }
  
  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    return await this.tryPrimary(
      () => this.originalStorage.updateProduct(id, productData),
      async () => {
        const productIndex = this.products.findIndex(product => product.id === id);
        if (productIndex === -1) {
          throw new Error(`Product with ID ${id} not found`);
        }
        
        this.products[productIndex] = {
          ...this.products[productIndex],
          ...productData,
          updatedAt: new Date()
        };
        
        return this.products[productIndex];
      }
    );
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return await this.tryPrimary(
      () => this.originalStorage.deleteProduct(id),
      async () => {
        const productIndex = this.products.findIndex(product => product.id === id);
        if (productIndex === -1) {
          return false;
        }
        
        this.products.splice(productIndex, 1);
        return true;
      }
    );
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    return await this.tryPrimary(
      () => this.originalStorage.searchProducts(query),
      async () => {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(product => 
          product.name.toLowerCase().includes(lowerQuery) || 
          product.description.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery)
        );
      }
    );
  }
  
  async countProducts(): Promise<number> {
    return await this.tryPrimary(
      () => this.originalStorage.countProducts(),
      async () => this.products.length
    );
  }
  
  // Cart methods
  async getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getCartByUserId(userId),
      async () => {
        const cart = this.carts.find(cart => cart.userId === userId);
        if (!cart) {
          return undefined;
        }
        
        const items = this.cartItems.filter(item => item.cartId === cart.id);
        return { cart, items };
      }
    );
  }
  
  async createCart(cart: InsertCart): Promise<Cart> {
    return await this.tryPrimary(
      () => this.originalStorage.createCart(cart),
      async () => {
        const newCart: Cart = {
          id: this.nextIds.cart++,
          ...cart,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.carts.push(newCart);
        return newCart;
      }
    );
  }
  
  async addItemToCart(item: InsertCartItem): Promise<CartItem> {
    return await this.tryPrimary(
      () => this.originalStorage.addItemToCart(item),
      async () => {
        // Check if item already exists in cart
        const existingItemIndex = this.cartItems.findIndex(
          ci => ci.cartId === item.cartId && ci.productId === item.productId
        );
        
        if (existingItemIndex !== -1) {
          // Update quantity if item exists
          this.cartItems[existingItemIndex].quantity += item.quantity;
          return this.cartItems[existingItemIndex];
        } else {
          // Add new item
          const newCartItem: CartItem = {
            id: this.nextIds.cartItem++,
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          this.cartItems.push(newCartItem);
          return newCartItem;
        }
      }
    );
  }
  
  async updateCartItem(cartId: number, productId: number, data: Partial<InsertCartItem>): Promise<CartItem> {
    return await this.tryPrimary(
      () => this.originalStorage.updateCartItem(cartId, productId, data),
      async () => {
        const itemIndex = this.cartItems.findIndex(
          item => item.cartId === cartId && item.productId === productId
        );
        
        if (itemIndex === -1) {
          throw new Error(`Cart item not found`);
        }
        
        this.cartItems[itemIndex] = {
          ...this.cartItems[itemIndex],
          ...data,
          updatedAt: new Date()
        };
        
        return this.cartItems[itemIndex];
      }
    );
  }
  
  async removeCartItem(cartId: number, productId: number): Promise<boolean> {
    return await this.tryPrimary(
      () => this.originalStorage.removeCartItem(cartId, productId),
      async () => {
        const itemIndex = this.cartItems.findIndex(
          item => item.cartId === cartId && item.productId === productId
        );
        
        if (itemIndex === -1) {
          return false;
        }
        
        this.cartItems.splice(itemIndex, 1);
        return true;
      }
    );
  }
  
  async clearCart(cartId: number): Promise<boolean> {
    return await this.tryPrimary(
      () => this.originalStorage.clearCart(cartId),
      async () => {
        const initialLength = this.cartItems.length;
        this.cartItems = this.cartItems.filter(item => item.cartId !== cartId);
        return initialLength > this.cartItems.length;
      }
    );
  }
  
  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    return await this.tryPrimary(
      () => this.originalStorage.createOrder(order),
      async () => {
        const newOrder: Order = {
          id: this.nextIds.order++,
          ...order,
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.orders.push(newOrder);
        return newOrder;
      }
    );
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getOrderById(id),
      async () => this.orders.find(order => order.id === id)
    );
  }
  
  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getOrderByOrderNumber(orderNumber),
      async () => this.orders.find(order => order.orderNumber === orderNumber)
    );
  }
  
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getOrdersByUserId(userId),
      async () => this.orders.filter(order => order.userId === userId)
    );
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return await this.tryPrimary(
      () => this.originalStorage.updateOrderStatus(id, status),
      async () => {
        const orderIndex = this.orders.findIndex(order => order.id === id);
        if (orderIndex === -1) {
          throw new Error(`Order with ID ${id} not found`);
        }
        
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          status,
          updatedAt: new Date()
        };
        
        return this.orders[orderIndex];
      }
    );
  }
  
  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    return await this.tryPrimary(
      () => this.originalStorage.updateOrderPaymentStatus(id, paymentStatus),
      async () => {
        const orderIndex = this.orders.findIndex(order => order.id === id);
        if (orderIndex === -1) {
          throw new Error(`Order with ID ${id} not found`);
        }
        
        this.orders[orderIndex] = {
          ...this.orders[orderIndex],
          paymentStatus,
          updatedAt: new Date()
        };
        
        return this.orders[orderIndex];
      }
    );
  }
  
  async getAllOrders(limit?: number, offset?: number): Promise<Order[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getAllOrders(limit, offset),
      async () => {
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        return this.orders.slice(start, end);
      }
    );
  }
  
  async searchOrders(query: string): Promise<Order[]> {
    return await this.tryPrimary(
      () => this.originalStorage.searchOrders(query),
      async () => {
        const lowerQuery = query.toLowerCase();
        return this.orders.filter(order => 
          order.orderNumber.toLowerCase().includes(lowerQuery) ||
          order.status.toLowerCase().includes(lowerQuery) ||
          order.paymentStatus.toLowerCase().includes(lowerQuery)
        );
      }
    );
  }
  
  async countOrders(): Promise<number> {
    return await this.tryPrimary(
      () => this.originalStorage.countOrders(),
      async () => this.orders.length
    );
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getOrderItems(orderId),
      async () => this.orderItems.filter(item => item.orderId === orderId)
    );
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    return await this.tryPrimary(
      () => this.originalStorage.createOrderItem(item),
      async () => {
        const newOrderItem: OrderItem = {
          id: this.nextIds.orderItem++,
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.orderItems.push(newOrderItem);
        return newOrderItem;
      }
    );
  }
  
  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getTestimonials(),
      async () => this.testimonials
    );
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    return await this.tryPrimary(
      () => this.originalStorage.createTestimonial(testimonial),
      async () => {
        const newTestimonial: Testimonial = {
          id: this.nextIds.testimonial++,
          ...testimonial,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.testimonials.push(newTestimonial);
        return newTestimonial;
      }
    );
  }
  
  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getFeaturedTestimonials(),
      async () => this.testimonials.filter(testimonial => testimonial.featured)
    );
  }
  
  // Admin log methods
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    return await this.tryPrimary(
      () => this.originalStorage.createAdminLog(log),
      async () => {
        const newAdminLog: AdminLog = {
          id: this.nextIds.adminLog++,
          ...log,
          createdAt: new Date()
        };
        this.adminLogs.push(newAdminLog);
        return newAdminLog;
      }
    );
  }
  
  async getAdminLogs(limit?: number, offset?: number): Promise<AdminLog[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getAdminLogs(limit, offset),
      async () => {
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        return this.adminLogs.slice(start, end);
      }
    );
  }
  
  async getAdminLogsByUserId(userId: number): Promise<AdminLog[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getAdminLogsByUserId(userId),
      async () => this.adminLogs.filter(log => log.userId === userId)
    );
  }
  
  async searchAdminLogs(query: string): Promise<AdminLog[]> {
    return await this.tryPrimary(
      () => this.originalStorage.searchAdminLogs(query),
      async () => {
        const lowerQuery = query.toLowerCase();
        return this.adminLogs.filter(log => 
          log.action.toLowerCase().includes(lowerQuery) ||
          log.entityType.toLowerCase().includes(lowerQuery) ||
          log.details.toLowerCase().includes(lowerQuery)
        );
      }
    );
  }
  
  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return await this.tryPrimary(
      () => this.originalStorage.createPayment(payment),
      async () => {
        const newPayment: Payment = {
          id: this.nextIds.payment++,
          ...payment,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.payments.push(newPayment);
        return newPayment;
      }
    );
  }
  
  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getPaymentByTransactionId(transactionId),
      async () => this.payments.find(payment => payment.transactionId === transactionId)
    );
  }
  
  async getPaymentByMerchantTransactionId(merchantTransactionId: string): Promise<Payment | undefined> {
    return await this.tryPrimary(
      () => this.originalStorage.getPaymentByMerchantTransactionId(merchantTransactionId),
      async () => this.payments.find(payment => payment.merchantTransactionId === merchantTransactionId)
    );
  }
  
  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getPaymentsByOrderId(orderId),
      async () => this.payments.filter(payment => payment.orderId === orderId)
    );
  }
  
  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return await this.tryPrimary(
      () => this.originalStorage.getPaymentsByUserId(userId),
      async () => this.payments.filter(payment => payment.userId === userId)
    );
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    return await this.tryPrimary(
      () => this.originalStorage.updatePaymentStatus(id, status),
      async () => {
        const paymentIndex = this.payments.findIndex(payment => payment.id === id);
        if (paymentIndex === -1) {
          throw new Error(`Payment with ID ${id} not found`);
        }
        
        this.payments[paymentIndex] = {
          ...this.payments[paymentIndex],
          status,
          updatedAt: new Date()
        };
        
        return this.payments[paymentIndex];
      }
    );
  }
  
  async updatePaymentDetails(id: number, details: Partial<InsertPayment>): Promise<Payment> {
    return await this.tryPrimary(
      () => this.originalStorage.updatePaymentDetails(id, details),
      async () => {
        const paymentIndex = this.payments.findIndex(payment => payment.id === id);
        if (paymentIndex === -1) {
          throw new Error(`Payment with ID ${id} not found`);
        }
        
        this.payments[paymentIndex] = {
          ...this.payments[paymentIndex],
          ...details,
          updatedAt: new Date()
        };
        
        return this.payments[paymentIndex];
      }
    );
  }
}