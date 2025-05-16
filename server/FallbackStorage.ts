import { IStorage } from './storage';
import { 
  User, InsertUser, 
  Product, InsertProduct,
  Cart, InsertCart,
  CartItem, InsertCartItem,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Testimonial, InsertTestimonial,
  AdminLog, InsertAdminLog,
  Payment, InsertPayment
} from '@shared/schema';

/**
 * Fallback Storage provides a resilient layer on top of any storage implementation
 * that gracefully handles failures by caching successful responses and using them
 * when the underlying storage fails.
 */
export class FallbackStorage implements IStorage {
  private cache: {
    users: Map<number, User>;
    usersByUsername: Map<string, User>;
    usersByEmail: Map<string, User>;
    usersByFirebaseId: Map<string, User>;
    products: Map<number, Product>;
    productsByCategory: Map<string, Product[]>;
    carts: Map<number, Cart>;
    cartItems: Map<number, CartItem[]>;
    orders: Map<number, Order>;
    orderItems: Map<number, OrderItem[]>;
    ordersByUser: Map<number, Order[]>;
    ordersByOrderNumber: Map<string, Order>;
    testimonials: Array<Testimonial>;
    payments: Map<number, Payment>;
    paymentsByTransaction: Map<string, Payment>;
    paymentsByMerchantTransaction: Map<string, Payment>;
  };

  private pendingWrites: Array<{
    operation: string;
    entity: string;
    args: any[];
    timestamp: Date;
    retries: number;
    execute: () => Promise<any>;
  }> = [];

  private maxRetries = 5;
  private cacheTimeout = 60 * 60 * 1000; // 1 hour
  private retryInterval = 5000; // 5 seconds

  constructor(private primaryStorage: IStorage) {
    this.cache = {
      users: new Map(),
      usersByUsername: new Map(),
      usersByEmail: new Map(),
      usersByFirebaseId: new Map(),
      products: new Map(),
      productsByCategory: new Map(),
      carts: new Map(),
      cartItems: new Map(),
      orders: new Map(),
      orderItems: new Map(),
      ordersByUser: new Map(),
      ordersByOrderNumber: new Map(),
      testimonials: [],
      payments: new Map(),
      paymentsByTransaction: new Map(),
      paymentsByMerchantTransaction: new Map(),
    };

    // Start retry process for pending writes
    this.startRetryProcess();
    
    console.log('[FallbackStorage] Initialized with caching and retry capabilities');
  }

  private startRetryProcess() {
    setInterval(() => this.processPendingWrites(), this.retryInterval);
  }

  private async processPendingWrites() {
    if (this.pendingWrites.length === 0) return;

    console.log(`[FallbackStorage] Processing ${this.pendingWrites.length} pending write operations`);
    
    const currentTime = new Date();
    const writesToProcess = [...this.pendingWrites];
    this.pendingWrites = [];

    for (const write of writesToProcess) {
      try {
        // Execute the operation
        await write.execute();
        console.log(`[FallbackStorage] Successfully processed pending ${write.operation} for ${write.entity}`);
      } catch (error) {
        // If failed and under max retries, put back in queue
        if (write.retries < this.maxRetries) {
          write.retries++;
          this.pendingWrites.push(write);
          console.log(`[FallbackStorage] Retry ${write.retries}/${this.maxRetries} for ${write.operation} on ${write.entity}`);
        } else {
          console.error(`[FallbackStorage] Max retries reached for ${write.operation} on ${write.entity}. Operation failed.`);
        }
      }
    }
  }

  private async withFallback<T>(
    entity: string,
    operation: string,
    primaryFn: () => Promise<T>,
    getCachedValue: () => T | undefined,
    setCachedValue?: (value: T) => void,
    isWriteOperation = false,
    args: any[] = []
  ): Promise<T> {
    try {
      const result = await primaryFn();
      
      // Cache successful read results if caching function provided
      if (setCachedValue && result !== undefined) {
        setCachedValue(result);
      }
      
      return result;
    } catch (error) {
      console.warn(`[FallbackStorage] ${operation} on ${entity} failed:`, error);
      
      // For read operations, try to use cached value
      if (!isWriteOperation) {
        const cachedValue = getCachedValue();
        if (cachedValue !== undefined) {
          console.log(`[FallbackStorage] Using cached value for ${operation} on ${entity}`);
          return cachedValue;
        }
      } 
      // For write operations, queue for retry
      else {
        this.pendingWrites.push({
          operation,
          entity,
          args,
          timestamp: new Date(),
          retries: 0,
          execute: primaryFn
        });
        console.log(`[FallbackStorage] Queued ${operation} on ${entity} for retry`);
      }
      
      throw new Error(`Operation ${operation} on ${entity} failed and no cached value was available`);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.withFallback<User | undefined>(
      'User',
      'getUser',
      () => this.primaryStorage.getUser(id),
      () => this.cache.users.get(id),
      (user) => {
        if (user) {
          this.cache.users.set(id, user);
          if (user.username) this.cache.usersByUsername.set(user.username, user);
          if (user.email) this.cache.usersByEmail.set(user.email, user);
          if (user.firebaseId) this.cache.usersByFirebaseId.set(user.firebaseId, user);
        }
      }
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.withFallback<User | undefined>(
      'User',
      'getUserByUsername',
      () => this.primaryStorage.getUserByUsername(username),
      () => this.cache.usersByUsername.get(username),
      (user) => {
        if (user) {
          this.cache.users.set(user.id, user);
          this.cache.usersByUsername.set(username, user);
          if (user.email) this.cache.usersByEmail.set(user.email, user);
          if (user.firebaseId) this.cache.usersByFirebaseId.set(user.firebaseId, user);
        }
      }
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.withFallback<User | undefined>(
      'User',
      'getUserByEmail',
      () => this.primaryStorage.getUserByEmail(email),
      () => this.cache.usersByEmail.get(email),
      (user) => {
        if (user) {
          this.cache.users.set(user.id, user);
          this.cache.usersByEmail.set(email, user);
          if (user.username) this.cache.usersByUsername.set(user.username, user);
          if (user.firebaseId) this.cache.usersByFirebaseId.set(user.firebaseId, user);
        }
      }
    );
  }

  async getUserByFirebaseId(firebaseId: string): Promise<User | undefined> {
    return this.withFallback<User | undefined>(
      'User',
      'getUserByFirebaseId',
      () => this.primaryStorage.getUserByFirebaseId(firebaseId),
      () => this.cache.usersByFirebaseId.get(firebaseId),
      (user) => {
        if (user) {
          this.cache.users.set(user.id, user);
          this.cache.usersByFirebaseId.set(firebaseId, user);
          if (user.username) this.cache.usersByUsername.set(user.username, user);
          if (user.email) this.cache.usersByEmail.set(user.email, user);
        }
      }
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.withFallback<User>(
      'User',
      'createUser',
      () => this.primaryStorage.createUser(user),
      () => undefined,
      (newUser) => {
        this.cache.users.set(newUser.id, newUser);
        if (newUser.username) this.cache.usersByUsername.set(newUser.username, newUser);
        if (newUser.email) this.cache.usersByEmail.set(newUser.email, newUser);
        if (newUser.firebaseId) this.cache.usersByFirebaseId.set(newUser.firebaseId, newUser);
      },
      true,
      [user]
    );
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    return this.withFallback<User>(
      'User',
      'updateUser',
      () => this.primaryStorage.updateUser(id, userData),
      () => {
        const existingUser = this.cache.users.get(id);
        if (!existingUser) return undefined;
        
        // Create updated user by merging existing user with update data
        const updatedUser = { ...existingUser, ...userData };
        
        // Update cache to reflect these changes
        this.cache.users.set(id, updatedUser);
        if (updatedUser.username) this.cache.usersByUsername.set(updatedUser.username, updatedUser);
        if (updatedUser.email) this.cache.usersByEmail.set(updatedUser.email, updatedUser);
        if (updatedUser.firebaseId) this.cache.usersByFirebaseId.set(updatedUser.firebaseId, updatedUser);
        
        return updatedUser;
      },
      (updatedUser) => {
        this.cache.users.set(id, updatedUser);
        if (updatedUser.username) this.cache.usersByUsername.set(updatedUser.username, updatedUser);
        if (updatedUser.email) this.cache.usersByEmail.set(updatedUser.email, updatedUser);
        if (updatedUser.firebaseId) this.cache.usersByFirebaseId.set(updatedUser.firebaseId, updatedUser);
      },
      true,
      [id, userData]
    );
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    return this.withFallback<User[]>(
      'User',
      'getAllUsers',
      () => this.primaryStorage.getAllUsers(limit, offset),
      () => {
        if (this.cache.users.size === 0) return undefined;
        
        const users = Array.from(this.cache.users.values());
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        
        return users.slice(start, end);
      },
      (users) => {
        for (const user of users) {
          this.cache.users.set(user.id, user);
          if (user.username) this.cache.usersByUsername.set(user.username, user);
          if (user.email) this.cache.usersByEmail.set(user.email, user);
          if (user.firebaseId) this.cache.usersByFirebaseId.set(user.firebaseId, user);
        }
      }
    );
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.withFallback<User[]>(
      'User',
      'searchUsers',
      () => this.primaryStorage.searchUsers(query),
      () => {
        if (this.cache.users.size === 0) return undefined;
        
        const lowerQuery = query.toLowerCase();
        return Array.from(this.cache.users.values()).filter(user => 
          user.username.toLowerCase().includes(lowerQuery) || 
          (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
          (user.firstName && user.firstName.toLowerCase().includes(lowerQuery)) ||
          (user.lastName && user.lastName.toLowerCase().includes(lowerQuery))
        );
      }
    );
  }

  async countUsers(): Promise<number> {
    return this.withFallback<number>(
      'User',
      'countUsers',
      () => this.primaryStorage.countUsers(),
      () => this.cache.users.size > 0 ? this.cache.users.size : undefined
    );
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return this.withFallback<Product[]>(
      'Product',
      'getAllProducts',
      () => this.primaryStorage.getAllProducts(),
      () => this.cache.products.size > 0 ? Array.from(this.cache.products.values()) : undefined,
      (products) => {
        for (const product of products) {
          this.cache.products.set(product.id, product);
          
          // Index by category
          if (product.category) {
            const categoryProducts = this.cache.productsByCategory.get(product.category) || [];
            categoryProducts.push(product);
            this.cache.productsByCategory.set(product.category, categoryProducts);
          }
        }
      }
    );
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.withFallback<Product | undefined>(
      'Product',
      'getProduct',
      () => this.primaryStorage.getProduct(id),
      () => this.cache.products.get(id),
      (product) => {
        if (product) {
          this.cache.products.set(id, product);
          
          // Index by category
          if (product.category) {
            const categoryProducts = this.cache.productsByCategory.get(product.category) || [];
            const existingIndex = categoryProducts.findIndex(p => p.id === product.id);
            
            if (existingIndex >= 0) {
              categoryProducts[existingIndex] = product;
            } else {
              categoryProducts.push(product);
            }
            
            this.cache.productsByCategory.set(product.category, categoryProducts);
          }
        }
      }
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.withFallback<Product[]>(
      'Product',
      'getFeaturedProducts',
      () => this.primaryStorage.getFeaturedProducts(),
      () => {
        if (this.cache.products.size === 0) return undefined;
        return Array.from(this.cache.products.values()).filter(product => product.featured);
      },
      (products) => {
        for (const product of products) {
          this.cache.products.set(product.id, product);
        }
      }
    );
  }

  async getTrendingProducts(): Promise<Product[]> {
    return this.withFallback<Product[]>(
      'Product',
      'getTrendingProducts',
      () => this.primaryStorage.getTrendingProducts(),
      () => {
        if (this.cache.products.size === 0) return undefined;
        return Array.from(this.cache.products.values()).filter(product => product.trending);
      },
      (products) => {
        for (const product of products) {
          this.cache.products.set(product.id, product);
        }
      }
    );
  }

  async getProductsByCollection(collection: string): Promise<Product[]> {
    return this.withFallback<Product[]>(
      'Product',
      'getProductsByCollection',
      () => this.primaryStorage.getProductsByCollection(collection),
      () => {
        if (this.cache.products.size === 0) return undefined;
        return Array.from(this.cache.products.values()).filter(product => product.collection === collection);
      },
      (products) => {
        for (const product of products) {
          this.cache.products.set(product.id, product);
        }
      }
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.withFallback<Product>(
      'Product',
      'createProduct',
      () => this.primaryStorage.createProduct(product),
      () => undefined,
      (newProduct) => {
        this.cache.products.set(newProduct.id, newProduct);
        
        // Index by category
        if (newProduct.category) {
          const categoryProducts = this.cache.productsByCategory.get(newProduct.category) || [];
          categoryProducts.push(newProduct);
          this.cache.productsByCategory.set(newProduct.category, categoryProducts);
        }
      },
      true,
      [product]
    );
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    return this.withFallback<Product>(
      'Product',
      'updateProduct',
      () => this.primaryStorage.updateProduct(id, productData),
      () => {
        const existingProduct = this.cache.products.get(id);
        if (!existingProduct) return undefined;
        
        // Create updated product
        const updatedProduct = { ...existingProduct, ...productData };
        
        // Update cache
        this.cache.products.set(id, updatedProduct);
        
        // Update category index if it changed
        if (productData.category && productData.category !== existingProduct.category) {
          // Remove from old category
          if (existingProduct.category) {
            const oldCategoryProducts = this.cache.productsByCategory.get(existingProduct.category) || [];
            this.cache.productsByCategory.set(
              existingProduct.category,
              oldCategoryProducts.filter(p => p.id !== id)
            );
          }
          
          // Add to new category
          const newCategoryProducts = this.cache.productsByCategory.get(productData.category) || [];
          newCategoryProducts.push(updatedProduct);
          this.cache.productsByCategory.set(productData.category, newCategoryProducts);
        }
        // If category didn't change but other data did, update in category list
        else if (existingProduct.category) {
          const categoryProducts = this.cache.productsByCategory.get(existingProduct.category) || [];
          const index = categoryProducts.findIndex(p => p.id === id);
          if (index >= 0) {
            categoryProducts[index] = updatedProduct;
            this.cache.productsByCategory.set(existingProduct.category, categoryProducts);
          }
        }
        
        return updatedProduct;
      },
      (updatedProduct) => {
        const existingProduct = this.cache.products.get(id);
        this.cache.products.set(id, updatedProduct);
        
        // Update category index if it changed
        if (existingProduct && updatedProduct.category !== existingProduct.category) {
          // Remove from old category
          if (existingProduct.category) {
            const oldCategoryProducts = this.cache.productsByCategory.get(existingProduct.category) || [];
            this.cache.productsByCategory.set(
              existingProduct.category,
              oldCategoryProducts.filter(p => p.id !== id)
            );
          }
          
          // Add to new category
          if (updatedProduct.category) {
            const newCategoryProducts = this.cache.productsByCategory.get(updatedProduct.category) || [];
            newCategoryProducts.push(updatedProduct);
            this.cache.productsByCategory.set(updatedProduct.category, newCategoryProducts);
          }
        }
        // If category didn't change, update in category list
        else if (updatedProduct.category) {
          const categoryProducts = this.cache.productsByCategory.get(updatedProduct.category) || [];
          const index = categoryProducts.findIndex(p => p.id === id);
          if (index >= 0) {
            categoryProducts[index] = updatedProduct;
          } else {
            categoryProducts.push(updatedProduct);
          }
          this.cache.productsByCategory.set(updatedProduct.category, categoryProducts);
        }
      },
      true,
      [id, productData]
    );
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.withFallback<boolean>(
      'Product',
      'deleteProduct',
      () => this.primaryStorage.deleteProduct(id),
      () => {
        const existingProduct = this.cache.products.get(id);
        if (!existingProduct) return undefined;
        
        // Remove from products cache
        this.cache.products.delete(id);
        
        // Remove from category cache
        if (existingProduct.category) {
          const categoryProducts = this.cache.productsByCategory.get(existingProduct.category) || [];
          this.cache.productsByCategory.set(
            existingProduct.category,
            categoryProducts.filter(p => p.id !== id)
          );
        }
        
        return true;
      },
      (success) => {
        if (success) {
          const existingProduct = this.cache.products.get(id);
          
          // Remove from products cache
          this.cache.products.delete(id);
          
          // Remove from category cache
          if (existingProduct && existingProduct.category) {
            const categoryProducts = this.cache.productsByCategory.get(existingProduct.category) || [];
            this.cache.productsByCategory.set(
              existingProduct.category,
              categoryProducts.filter(p => p.id !== id)
            );
          }
        }
      },
      true,
      [id]
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.withFallback<Product[]>(
      'Product',
      'searchProducts',
      () => this.primaryStorage.searchProducts(query),
      () => {
        if (this.cache.products.size === 0) return undefined;
        
        const lowerQuery = query.toLowerCase();
        return Array.from(this.cache.products.values()).filter(product => 
          product.name.toLowerCase().includes(lowerQuery) || 
          product.description.toLowerCase().includes(lowerQuery) ||
          product.category.toLowerCase().includes(lowerQuery) ||
          (product.collection && product.collection.toLowerCase().includes(lowerQuery))
        );
      }
    );
  }

  async countProducts(): Promise<number> {
    return this.withFallback<number>(
      'Product',
      'countProducts',
      () => this.primaryStorage.countProducts(),
      () => this.cache.products.size > 0 ? this.cache.products.size : undefined
    );
  }

  // Cart methods - Implementing minimal set here, expand as needed
  async getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    return this.withFallback<{ cart: Cart; items: CartItem[] } | undefined>(
      'Cart',
      'getCartByUserId',
      () => this.primaryStorage.getCartByUserId(userId),
      () => {
        // Look for cart in cache
        const userCarts = Array.from(this.cache.carts.values()).filter(cart => cart.userId === userId);
        if (userCarts.length === 0) return undefined;
        
        // Use the first cart found (should only be one per user)
        const cart = userCarts[0];
        const items = this.cache.cartItems.get(cart.id) || [];
        
        return { cart, items };
      },
      (result) => {
        if (result) {
          this.cache.carts.set(result.cart.id, result.cart);
          this.cache.cartItems.set(result.cart.id, result.items);
        }
      }
    );
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    return this.withFallback<Cart>(
      'Cart',
      'createCart',
      () => this.primaryStorage.createCart(cart),
      () => undefined,
      (newCart) => {
        this.cache.carts.set(newCart.id, newCart);
        this.cache.cartItems.set(newCart.id, []);
      },
      true,
      [cart]
    );
  }

  async addItemToCart(item: InsertCartItem): Promise<CartItem> {
    return this.withFallback<CartItem>(
      'CartItem',
      'addItemToCart',
      () => this.primaryStorage.addItemToCart(item),
      () => undefined,
      (newItem) => {
        const cartItems = this.cache.cartItems.get(newItem.cartId) || [];
        const existingItemIndex = cartItems.findIndex(
          i => i.cartId === newItem.cartId && i.productId === newItem.productId
        );
        
        if (existingItemIndex >= 0) {
          cartItems[existingItemIndex] = newItem;
        } else {
          cartItems.push(newItem);
        }
        
        this.cache.cartItems.set(newItem.cartId, cartItems);
      },
      true,
      [item]
    );
  }

  async updateCartItem(cartId: number, productId: number, data: Partial<InsertCartItem>): Promise<CartItem> {
    return this.withFallback<CartItem>(
      'CartItem',
      'updateCartItem',
      () => this.primaryStorage.updateCartItem(cartId, productId, data),
      () => {
        const cartItems = this.cache.cartItems.get(cartId) || [];
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex < 0) return undefined;
        
        // Create updated item
        const updatedItem = { ...cartItems[itemIndex], ...data };
        
        // Update in cache
        cartItems[itemIndex] = updatedItem;
        this.cache.cartItems.set(cartId, cartItems);
        
        return updatedItem;
      },
      (updatedItem) => {
        const cartItems = this.cache.cartItems.get(cartId) || [];
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex >= 0) {
          cartItems[itemIndex] = updatedItem;
        } else {
          cartItems.push(updatedItem);
        }
        
        this.cache.cartItems.set(cartId, cartItems);
      },
      true,
      [cartId, productId, data]
    );
  }

  async removeCartItem(cartId: number, productId: number): Promise<boolean> {
    return this.withFallback<boolean>(
      'CartItem',
      'removeCartItem',
      () => this.primaryStorage.removeCartItem(cartId, productId),
      () => {
        const cartItems = this.cache.cartItems.get(cartId) || [];
        const itemIndex = cartItems.findIndex(item => item.productId === productId);
        
        if (itemIndex < 0) return undefined;
        
        // Remove from cache
        cartItems.splice(itemIndex, 1);
        this.cache.cartItems.set(cartId, cartItems);
        
        return true;
      },
      (success) => {
        if (success) {
          const cartItems = this.cache.cartItems.get(cartId) || [];
          const updatedItems = cartItems.filter(item => item.productId !== productId);
          this.cache.cartItems.set(cartId, updatedItems);
        }
      },
      true,
      [cartId, productId]
    );
  }

  async clearCart(cartId: number): Promise<boolean> {
    return this.withFallback<boolean>(
      'Cart',
      'clearCart',
      () => this.primaryStorage.clearCart(cartId),
      () => {
        if (!this.cache.cartItems.has(cartId)) return undefined;
        
        // Clear cart items
        this.cache.cartItems.set(cartId, []);
        
        return true;
      },
      (success) => {
        if (success) {
          this.cache.cartItems.set(cartId, []);
        }
      },
      true,
      [cartId]
    );
  }

  // Order methods - implementing core functionality
  async createOrder(order: InsertOrder): Promise<Order> {
    return this.withFallback<Order>(
      'Order',
      'createOrder',
      () => this.primaryStorage.createOrder(order),
      () => undefined,
      (newOrder) => {
        this.cache.orders.set(newOrder.id, newOrder);
        this.cache.ordersByOrderNumber.set(newOrder.orderNumber, newOrder);
        
        if (newOrder.userId) {
          const userOrders = this.cache.ordersByUser.get(newOrder.userId) || [];
          userOrders.push(newOrder);
          this.cache.ordersByUser.set(newOrder.userId, userOrders);
        }
      },
      true,
      [order]
    );
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.withFallback<Order | undefined>(
      'Order',
      'getOrderById',
      () => this.primaryStorage.getOrderById(id),
      () => this.cache.orders.get(id),
      (order) => {
        if (order) {
          this.cache.orders.set(id, order);
          this.cache.ordersByOrderNumber.set(order.orderNumber, order);
          
          if (order.userId) {
            const userOrders = this.cache.ordersByUser.get(order.userId) || [];
            const existingIndex = userOrders.findIndex(o => o.id === id);
            
            if (existingIndex >= 0) {
              userOrders[existingIndex] = order;
            } else {
              userOrders.push(order);
            }
            
            this.cache.ordersByUser.set(order.userId, userOrders);
          }
        }
      }
    );
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return this.withFallback<Order | undefined>(
      'Order',
      'getOrderByOrderNumber',
      () => this.primaryStorage.getOrderByOrderNumber(orderNumber),
      () => this.cache.ordersByOrderNumber.get(orderNumber),
      (order) => {
        if (order) {
          this.cache.orders.set(order.id, order);
          this.cache.ordersByOrderNumber.set(orderNumber, order);
          
          if (order.userId) {
            const userOrders = this.cache.ordersByUser.get(order.userId) || [];
            const existingIndex = userOrders.findIndex(o => o.id === order.id);
            
            if (existingIndex >= 0) {
              userOrders[existingIndex] = order;
            } else {
              userOrders.push(order);
            }
            
            this.cache.ordersByUser.set(order.userId, userOrders);
          }
        }
      }
    );
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return this.withFallback<Order[]>(
      'Order',
      'getOrdersByUserId',
      () => this.primaryStorage.getOrdersByUserId(userId),
      () => this.cache.ordersByUser.get(userId),
      (orders) => {
        for (const order of orders) {
          this.cache.orders.set(order.id, order);
          this.cache.ordersByOrderNumber.set(order.orderNumber, order);
        }
        
        this.cache.ordersByUser.set(userId, orders);
      }
    );
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    return this.withFallback<Order>(
      'Order',
      'updateOrderStatus',
      () => this.primaryStorage.updateOrderStatus(id, status),
      () => {
        const existingOrder = this.cache.orders.get(id);
        if (!existingOrder) return undefined;
        
        // Create updated order
        const updatedOrder = { ...existingOrder, status };
        
        // Update in cache
        this.cache.orders.set(id, updatedOrder);
        this.cache.ordersByOrderNumber.set(updatedOrder.orderNumber, updatedOrder);
        
        if (updatedOrder.userId) {
          const userOrders = this.cache.ordersByUser.get(updatedOrder.userId) || [];
          const orderIndex = userOrders.findIndex(o => o.id === id);
          
          if (orderIndex >= 0) {
            userOrders[orderIndex] = updatedOrder;
            this.cache.ordersByUser.set(updatedOrder.userId, userOrders);
          }
        }
        
        return updatedOrder;
      },
      (updatedOrder) => {
        this.cache.orders.set(id, updatedOrder);
        this.cache.ordersByOrderNumber.set(updatedOrder.orderNumber, updatedOrder);
        
        if (updatedOrder.userId) {
          const userOrders = this.cache.ordersByUser.get(updatedOrder.userId) || [];
          const orderIndex = userOrders.findIndex(o => o.id === id);
          
          if (orderIndex >= 0) {
            userOrders[orderIndex] = updatedOrder;
          } else {
            userOrders.push(updatedOrder);
          }
          
          this.cache.ordersByUser.set(updatedOrder.userId, userOrders);
        }
      },
      true,
      [id, status]
    );
  }

  async updateOrderPaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    return this.withFallback<Order>(
      'Order',
      'updateOrderPaymentStatus',
      () => this.primaryStorage.updateOrderPaymentStatus(id, paymentStatus),
      () => {
        const existingOrder = this.cache.orders.get(id);
        if (!existingOrder) return undefined;
        
        // Create updated order
        const updatedOrder = { ...existingOrder, paymentStatus };
        
        // Update in cache
        this.cache.orders.set(id, updatedOrder);
        this.cache.ordersByOrderNumber.set(updatedOrder.orderNumber, updatedOrder);
        
        if (updatedOrder.userId) {
          const userOrders = this.cache.ordersByUser.get(updatedOrder.userId) || [];
          const orderIndex = userOrders.findIndex(o => o.id === id);
          
          if (orderIndex >= 0) {
            userOrders[orderIndex] = updatedOrder;
            this.cache.ordersByUser.set(updatedOrder.userId, userOrders);
          }
        }
        
        return updatedOrder;
      },
      (updatedOrder) => {
        this.cache.orders.set(id, updatedOrder);
        this.cache.ordersByOrderNumber.set(updatedOrder.orderNumber, updatedOrder);
        
        if (updatedOrder.userId) {
          const userOrders = this.cache.ordersByUser.get(updatedOrder.userId) || [];
          const orderIndex = userOrders.findIndex(o => o.id === id);
          
          if (orderIndex >= 0) {
            userOrders[orderIndex] = updatedOrder;
          } else {
            userOrders.push(updatedOrder);
          }
          
          this.cache.ordersByUser.set(updatedOrder.userId, userOrders);
        }
      },
      true,
      [id, paymentStatus]
    );
  }

  async getAllOrders(limit?: number, offset?: number): Promise<Order[]> {
    return this.withFallback<Order[]>(
      'Order',
      'getAllOrders',
      () => this.primaryStorage.getAllOrders(limit, offset),
      () => {
        if (this.cache.orders.size === 0) return undefined;
        
        const orders = Array.from(this.cache.orders.values());
        const start = offset || 0;
        const end = limit ? start + limit : undefined;
        
        return orders.slice(start, end);
      },
      (orders) => {
        for (const order of orders) {
          this.cache.orders.set(order.id, order);
          this.cache.ordersByOrderNumber.set(order.orderNumber, order);
          
          if (order.userId) {
            const userOrders = this.cache.ordersByUser.get(order.userId) || [];
            const existingIndex = userOrders.findIndex(o => o.id === order.id);
            
            if (existingIndex >= 0) {
              userOrders[existingIndex] = order;
            } else {
              userOrders.push(order);
            }
            
            this.cache.ordersByUser.set(order.userId, userOrders);
          }
        }
      }
    );
  }

  async searchOrders(query: string): Promise<Order[]> {
    return this.withFallback<Order[]>(
      'Order',
      'searchOrders',
      () => this.primaryStorage.searchOrders(query),
      () => {
        if (this.cache.orders.size === 0) return undefined;
        
        const lowerQuery = query.toLowerCase();
        return Array.from(this.cache.orders.values()).filter(order => 
          order.orderNumber.toLowerCase().includes(lowerQuery) || 
          order.status.toLowerCase().includes(lowerQuery) ||
          order.paymentStatus.toLowerCase().includes(lowerQuery)
        );
      }
    );
  }

  async countOrders(): Promise<number> {
    return this.withFallback<number>(
      'Order',
      'countOrders',
      () => this.primaryStorage.countOrders(),
      () => this.cache.orders.size > 0 ? this.cache.orders.size : undefined
    );
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.withFallback<OrderItem[]>(
      'OrderItem',
      'getOrderItems',
      () => this.primaryStorage.getOrderItems(orderId),
      () => this.cache.orderItems.get(orderId),
      (items) => {
        this.cache.orderItems.set(orderId, items);
      }
    );
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    return this.withFallback<OrderItem>(
      'OrderItem',
      'createOrderItem',
      () => this.primaryStorage.createOrderItem(item),
      () => undefined,
      (newItem) => {
        const orderItems = this.cache.orderItems.get(newItem.orderId) || [];
        orderItems.push(newItem);
        this.cache.orderItems.set(newItem.orderId, orderItems);
      },
      true,
      [item]
    );
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return this.withFallback<Testimonial[]>(
      'Testimonial',
      'getTestimonials',
      () => this.primaryStorage.getTestimonials(),
      () => this.cache.testimonials.length > 0 ? this.cache.testimonials : undefined,
      (testimonials) => {
        this.cache.testimonials = testimonials;
      }
    );
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    return this.withFallback<Testimonial>(
      'Testimonial',
      'createTestimonial',
      () => this.primaryStorage.createTestimonial(testimonial),
      () => undefined,
      (newTestimonial) => {
        this.cache.testimonials.push(newTestimonial);
      },
      true,
      [testimonial]
    );
  }

  async getFeaturedTestimonials(): Promise<Testimonial[]> {
    return this.withFallback<Testimonial[]>(
      'Testimonial',
      'getFeaturedTestimonials',
      () => this.primaryStorage.getFeaturedTestimonials(),
      () => this.cache.testimonials.length > 0 
        ? this.cache.testimonials.filter(t => t.featured) 
        : undefined,
      (testimonials) => {
        // Update featured status in existing testimonials
        for (const testimonial of testimonials) {
          const existingIndex = this.cache.testimonials.findIndex(t => t.id === testimonial.id);
          if (existingIndex >= 0) {
            this.cache.testimonials[existingIndex] = testimonial;
          } else {
            this.cache.testimonials.push(testimonial);
          }
        }
      }
    );
  }

  // Admin log methods
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    return this.withFallback<AdminLog>(
      'AdminLog',
      'createAdminLog',
      () => this.primaryStorage.createAdminLog(log),
      () => undefined,
      undefined,
      true,
      [log]
    );
  }

  async getAdminLogs(limit?: number, offset?: number): Promise<AdminLog[]> {
    return this.primaryStorage.getAdminLogs(limit, offset);
  }

  async getAdminLogsByUserId(userId: number): Promise<AdminLog[]> {
    return this.primaryStorage.getAdminLogsByUserId(userId);
  }

  async searchAdminLogs(query: string): Promise<AdminLog[]> {
    return this.primaryStorage.searchAdminLogs(query);
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return this.withFallback<Payment>(
      'Payment',
      'createPayment',
      () => this.primaryStorage.createPayment(payment),
      () => undefined,
      (newPayment) => {
        this.cache.payments.set(newPayment.id, newPayment);
        
        if (newPayment.transactionId) {
          this.cache.paymentsByTransaction.set(newPayment.transactionId, newPayment);
        }
        
        if (newPayment.merchantTransactionId) {
          this.cache.paymentsByMerchantTransaction.set(newPayment.merchantTransactionId, newPayment);
        }
      },
      true,
      [payment]
    );
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment | undefined> {
    return this.withFallback<Payment | undefined>(
      'Payment',
      'getPaymentByTransactionId',
      () => this.primaryStorage.getPaymentByTransactionId(transactionId),
      () => this.cache.paymentsByTransaction.get(transactionId),
      (payment) => {
        if (payment) {
          this.cache.payments.set(payment.id, payment);
          this.cache.paymentsByTransaction.set(transactionId, payment);
          
          if (payment.merchantTransactionId) {
            this.cache.paymentsByMerchantTransaction.set(payment.merchantTransactionId, payment);
          }
        }
      }
    );
  }

  async getPaymentByMerchantTransactionId(merchantTransactionId: string): Promise<Payment | undefined> {
    return this.withFallback<Payment | undefined>(
      'Payment',
      'getPaymentByMerchantTransactionId',
      () => this.primaryStorage.getPaymentByMerchantTransactionId(merchantTransactionId),
      () => this.cache.paymentsByMerchantTransaction.get(merchantTransactionId),
      (payment) => {
        if (payment) {
          this.cache.payments.set(payment.id, payment);
          this.cache.paymentsByMerchantTransaction.set(merchantTransactionId, payment);
          
          if (payment.transactionId) {
            this.cache.paymentsByTransaction.set(payment.transactionId, payment);
          }
        }
      }
    );
  }

  async getPaymentsByOrderId(orderId: number): Promise<Payment[]> {
    return this.withFallback<Payment[]>(
      'Payment',
      'getPaymentsByOrderId',
      () => this.primaryStorage.getPaymentsByOrderId(orderId),
      () => {
        if (this.cache.payments.size === 0) return undefined;
        return Array.from(this.cache.payments.values()).filter(payment => payment.orderId === orderId);
      },
      (payments) => {
        for (const payment of payments) {
          this.cache.payments.set(payment.id, payment);
          
          if (payment.transactionId) {
            this.cache.paymentsByTransaction.set(payment.transactionId, payment);
          }
          
          if (payment.merchantTransactionId) {
            this.cache.paymentsByMerchantTransaction.set(payment.merchantTransactionId, payment);
          }
        }
      }
    );
  }

  async getPaymentsByUserId(userId: number): Promise<Payment[]> {
    return this.withFallback<Payment[]>(
      'Payment',
      'getPaymentsByUserId',
      () => this.primaryStorage.getPaymentsByUserId(userId),
      () => {
        if (this.cache.payments.size === 0) return undefined;
        return Array.from(this.cache.payments.values()).filter(payment => payment.userId === userId);
      },
      (payments) => {
        for (const payment of payments) {
          this.cache.payments.set(payment.id, payment);
          
          if (payment.transactionId) {
            this.cache.paymentsByTransaction.set(payment.transactionId, payment);
          }
          
          if (payment.merchantTransactionId) {
            this.cache.paymentsByMerchantTransaction.set(payment.merchantTransactionId, payment);
          }
        }
      }
    );
  }

  async updatePaymentStatus(id: number, status: string): Promise<Payment> {
    return this.withFallback<Payment>(
      'Payment',
      'updatePaymentStatus',
      () => this.primaryStorage.updatePaymentStatus(id, status),
      () => {
        const existingPayment = this.cache.payments.get(id);
        if (!existingPayment) return undefined;
        
        // Create updated payment
        const updatedPayment = { ...existingPayment, status };
        
        // Update in cache
        this.cache.payments.set(id, updatedPayment);
        
        if (updatedPayment.transactionId) {
          this.cache.paymentsByTransaction.set(updatedPayment.transactionId, updatedPayment);
        }
        
        if (updatedPayment.merchantTransactionId) {
          this.cache.paymentsByMerchantTransaction.set(updatedPayment.merchantTransactionId, updatedPayment);
        }
        
        return updatedPayment;
      },
      (updatedPayment) => {
        this.cache.payments.set(id, updatedPayment);
        
        if (updatedPayment.transactionId) {
          this.cache.paymentsByTransaction.set(updatedPayment.transactionId, updatedPayment);
        }
        
        if (updatedPayment.merchantTransactionId) {
          this.cache.paymentsByMerchantTransaction.set(updatedPayment.merchantTransactionId, updatedPayment);
        }
      },
      true,
      [id, status]
    );
  }

  async updatePaymentDetails(id: number, details: Partial<InsertPayment>): Promise<Payment> {
    return this.withFallback<Payment>(
      'Payment',
      'updatePaymentDetails',
      () => this.primaryStorage.updatePaymentDetails(id, details),
      () => {
        const existingPayment = this.cache.payments.get(id);
        if (!existingPayment) return undefined;
        
        // Create updated payment
        const updatedPayment = { ...existingPayment, ...details };
        
        // Update in cache
        this.cache.payments.set(id, updatedPayment);
        
        // Handle changes to index keys
        if (details.transactionId) {
          if (existingPayment.transactionId) {
            this.cache.paymentsByTransaction.delete(existingPayment.transactionId);
          }
          this.cache.paymentsByTransaction.set(details.transactionId, updatedPayment);
        } else if (existingPayment.transactionId) {
          this.cache.paymentsByTransaction.set(existingPayment.transactionId, updatedPayment);
        }
        
        if (details.merchantTransactionId) {
          if (existingPayment.merchantTransactionId) {
            this.cache.paymentsByMerchantTransaction.delete(existingPayment.merchantTransactionId);
          }
          this.cache.paymentsByMerchantTransaction.set(details.merchantTransactionId, updatedPayment);
        } else if (existingPayment.merchantTransactionId) {
          this.cache.paymentsByMerchantTransaction.set(existingPayment.merchantTransactionId, updatedPayment);
        }
        
        return updatedPayment;
      },
      (updatedPayment) => {
        this.cache.payments.set(id, updatedPayment);
        
        if (updatedPayment.transactionId) {
          this.cache.paymentsByTransaction.set(updatedPayment.transactionId, updatedPayment);
        }
        
        if (updatedPayment.merchantTransactionId) {
          this.cache.paymentsByMerchantTransaction.set(updatedPayment.merchantTransactionId, updatedPayment);
        }
      },
      true,
      [id, details]
    );
  }
}