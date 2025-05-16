import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  testimonials, type Testimonial, type InsertTestimonial,
  adminLogs, type AdminLog, type InsertAdminLog,
  payments, type Payment, type InsertPayment
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(limit = 10, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`)
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(10);
  }

  async countUsers(): Promise<number> {
    const result = await db.select({ value: count() }).from(users);
    return result[0]?.value || 0;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.id));
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
      .limit(4);
  }

  async getTrendingProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.trending, true))
      .limit(4);
  }

  async getProductsByCollection(collection: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.collection, collection));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: number,
    productData: Partial<InsertProduct>
  ): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    // Check if product still exists to determine if deletion was successful
    const product = await this.getProduct(id);
    return product === undefined;
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, `%${query}%`),
          like(products.description, `%${query}%`),
          like(products.category, `%${query}%`)
        )
      )
      .orderBy(desc(products.id))
      .limit(20);
  }

  async countProducts(): Promise<number> {
    const result = await db.select({ value: count() }).from(products);
    return result[0]?.value || 0;
  }

  // Cart methods
  async getCartByUserId(
    userId: number
  ): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    // Find the cart for this user
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId));

    if (!cart) {
      return undefined;
    }

    // Get all items in this cart
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    return { cart, items };
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const [cart] = await db.insert(carts).values(insertCart).returning();
    return cart;
  }

  async addItemToCart(insertItem: InsertCartItem): Promise<CartItem> {
    // Check if this item already exists in the cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, insertItem.cartId),
          eq(cartItems.productId, insertItem.productId),
          eq(cartItems.size, insertItem.size),
          eq(cartItems.color, insertItem.color)
        )
      );

    if (existingItem) {
      // Update quantity instead of adding a new item
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + insertItem.quantity,
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    // Add new item to cart
    const [item] = await db.insert(cartItems).values(insertItem).returning();
    return item;
  }

  async updateCartItem(
    cartId: number,
    productId: number,
    data: Partial<InsertCartItem>
  ): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set(data)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId)
        )
      )
      .returning();
    return updatedItem;
  }

  async removeCartItem(cartId: number, productId: number): Promise<boolean> {
    // First check if item exists
    const existingItems = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId)
        )
      );
    
    // Delete the item
    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productId, productId)
        )
      );
    
    // Return true if item existed and was deleted
    return existingItems.length > 0;
  }

  async clearCart(cartId: number): Promise<boolean> {
    // First check if cart has items
    const existingItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
    
    // Delete all items from the cart
    await db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId));
    
    // Return true if there were items to delete
    return existingItems.length > 0;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
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
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
  
  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getAllOrders(limit = 20, offset = 0): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async searchOrders(query: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(
        or(
          like(orders.orderNumber, `%${query}%`),
          like(orders.status, `%${query}%`),
          like(orders.paymentStatus, `%${query}%`)
        )
      )
      .orderBy(desc(orders.createdAt))
      .limit(20);
  }

  async countOrders(): Promise<number> {
    const result = await db.select({ value: count() }).from(orders);
    return result[0]?.value || 0;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials).orderBy(desc(testimonials.id));
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
      .orderBy(desc(testimonials.id))
      .limit(3);
  }

  // Admin log methods
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(limit = 50, offset = 0): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getAdminLogsByUserId(userId: number): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .where(eq(adminLogs.userId, userId))
      .orderBy(desc(adminLogs.createdAt))
      .limit(50);
  }

  async searchAdminLogs(query: string): Promise<AdminLog[]> {
    return await db
      .select()
      .from(adminLogs)
      .where(
        or(
          like(adminLogs.action, `%${query}%`),
          like(adminLogs.entityType, `%${query}%`),
          like(adminLogs.entityId, `%${query}%`)
        )
      )
      .orderBy(desc(adminLogs.createdAt))
      .limit(50);
  }
  
  // Payment methods implementation
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
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  async updatePaymentDetails(id: number, details: Partial<InsertPayment>): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        ...details,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async seedInitialData() {
    // Check if users table is empty
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      // Create admin user
      await db.insert(users).values({
        username: "admin",
        password:
          "6fb56b2fad8b6356e27206413828b0aae976de8385350b95078cbae59027356a.c2ef9fa5a87a03a0bb5c978f1e42ce0c",
        email: "rajeshmatta3636@gmail.com",
        firstName: "Site",
        lastName: "Admin",
        role: "admin",
      });

      // Create test users
      await db.insert(users).values({
        username: "user1",
        password:
          "6fb56b2fad8b6356e27206413828b0aae976de8385350b95078cbae59027356a.c2ef9fa5a87a03a0bb5c978f1e42ce0c",
        email: "user1@example.com",
        firstName: "Test",
        lastName: "User",
        role: "customer",
      });

      // Create test products
      await db.insert(products).values([
        {
          name: "Abstract Design Tee",
          description:
            "A unique t-shirt featuring a creative abstract design that's perfect for casual wear.",
          price: "599",
          category: "Graphic Tees",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Navy"],
          images: [
            "https://placehold.co/600x800?text=Abstract+Tee+1",
            "https://placehold.co/600x800?text=Abstract+Tee+2",
          ],
          featured: true,
          trending: false,
          collection: "Abstract",
        },
        {
          name: "Geometric Print Tee",
          description:
            "A bold geometric print t-shirt that makes a statement with any outfit.",
          price: "649",
          category: "Graphic Tees",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Grey"],
          images: [
            "https://placehold.co/600x800?text=Geometric+Tee+1",
            "https://placehold.co/600x800?text=Geometric+Tee+2",
          ],
          featured: false,
          trending: true,
          collection: "Geometric",
        },
        {
          name: "Minimalist Logo Tee",
          description:
            "A clean, minimalist t-shirt with a subtle logo design for everyday wear.",
          price: "499",
          category: "Logo Tees",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Beige"],
          images: [
            "https://placehold.co/600x800?text=Minimalist+Tee+1",
            "https://placehold.co/600x800?text=Minimalist+Tee+2",
          ],
          featured: true,
          trending: true,
          collection: "Minimalist",
        },
        {
          name: "Urban Streetwear Tee",
          description:
            "A streetwear-inspired t-shirt with urban graphics perfect for the fashion-forward.",
          price: "699",
          category: "Street Style",
          gender: "Men",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "Grey", "Red"],
          images: [
            "https://placehold.co/600x800?text=Streetwear+Tee+1",
            "https://placehold.co/600x800?text=Streetwear+Tee+2",
          ],
          featured: false,
          trending: true,
          collection: "Urban",
        },
        {
          name: "Classic Logo Tee",
          description: "A timeless classic tee with the iconic Loudfits logo.",
          price: "549",
          category: "Logo Tees",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Blue"],
          images: [
            "https://placehold.co/600x800?text=Classic+Logo+Tee+1",
            "https://placehold.co/600x800?text=Classic+Logo+Tee+2",
          ],
          featured: true,
          trending: false,
          collection: "Classics",
        },
        {
          name: "Artistic Pattern Tee",
          description:
            "An artistic t-shirt featuring a unique pattern designed by local artists.",
          price: "749",
          category: "Artist Collabs",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Purple"],
          images: [
            "https://placehold.co/600x800?text=Artistic+Tee+1",
            "https://placehold.co/600x800?text=Artistic+Tee+2",
          ],
          featured: false,
          trending: false,
          collection: "Artist Series",
        },
        {
          name: "Bold Typography Tee",
          description:
            "A statement t-shirt with bold typography that speaks volumes.",
          price: "599",
          category: "Typography",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Yellow"],
          images: [
            "https://placehold.co/600x800?text=Typography+Tee+1",
            "https://placehold.co/600x800?text=Typography+Tee+2",
          ],
          featured: false,
          trending: false,
          collection: "Typography",
        },
        {
          name: "Vintage Wash Tee",
          description:
            "A soft, vintage-wash t-shirt with a lived-in feel and retro graphics.",
          price: "649",
          category: "Vintage",
          gender: "Women",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Washed Black", "Washed Blue", "Washed Red"],
          images: [
            "https://placehold.co/600x800?text=Vintage+Tee+1",
            "https://placehold.co/600x800?text=Vintage+Tee+2",
          ],
          featured: true,
          trending: true,
          collection: "Vintage",
        },
        {
          name: "Eco-Friendly Organic Tee",
          description:
            "An environmentally conscious t-shirt made from 100% organic cotton.",
          price: "799",
          category: "Eco Collection",
          gender: "Unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Natural", "Green", "Earth Brown"],
          images: [
            "https://placehold.co/600x800?text=Eco+Tee+1",
            "https://placehold.co/600x800?text=Eco+Tee+2",
          ],
          featured: false,
          trending: false,
          collection: "Eco-Friendly",
        },
      ]);

      // Create testimonials
      await db.insert(testimonials).values([
        {
          name: "Priya S.",
          rating: 5,
          review:
            "I absolutely love my new t-shirt from Loudfits! The quality is amazing and the design is exactly what I was looking for. Will definitely be shopping here again.",
          featured: true,
        },
        {
          name: "Rahul K.",
          rating: 4,
          review:
            "Great product and quick delivery. The fit is perfect and the material feels premium. Just wish there were more color options.",
          featured: true,
        },
        {
          name: "Aisha M.",
          rating: 5,
          review:
            "The designs are so unique and stand out from anything else I've seen. The fabric is comfortable enough to wear all day. Already ordered my second tee!",
          featured: true,
        },
        {
          name: "Vikram J.",
          rating: 4,
          review:
            "Stylish and comfortable. Got lots of compliments on my first wear. Shipping was a bit slow but the quality makes up for it.",
          featured: false,
        },
      ]);
    }
  }
}

export const storage = new DatabaseStorage();

// Initialize database with retry mechanism
(async () => {
  let retries = 0;
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  
  const initializeDatabase = async () => {
    try {
      await (storage as DatabaseStorage).seedInitialData();
      console.log("Database initialized with seed data if needed");
      return true;
    } catch (error) {
      console.error(`Error initializing database (attempt ${retries + 1}/${maxRetries}):`, error);
      return false;
    }
  };
  
  const attemptConnection = async () => {
    if (await initializeDatabase()) {
      return;
    }
    
    retries++;
    if (retries < maxRetries) {
      console.log(`Retrying database connection in ${retryDelay / 1000} seconds...`);
      setTimeout(attemptConnection, retryDelay);
    } else {
      console.error("Max retries reached. Could not establish database connection.");
      console.log("The application will continue to function, but data will not be persisted until database connection is restored.");
    }
  };
  
  await attemptConnection();
})();