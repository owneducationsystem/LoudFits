import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertProductSchema,
  insertUserSchema,
  insertCartSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertTestimonialSchema,
  insertAdminLogSchema,
} from "@shared/schema";

// Middleware to check if user is admin
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real app, you'd use authentication middleware and JWT
    // For now, we'll just check if the user exists and has the admin role
    const userId = req.headers['user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(parseInt(userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to log admin actions
const logAdminAction = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    // Get current user info from session or cookie if available
    // For now, hardcode admin user ID = 1 for demonstration
    const userId = 1; 
    const action = req.method;
    const path = req.path;
    const entityType = path.split('/')[2]; // Assumes path format: /api/entityType/...
    const entityId = req.params.id || 'multiple';
    
    // Create admin log
    storage.createAdminLog({
      userId,
      action: `${action} ${path}`,
      entityType,
      entityId,
      details: JSON.stringify({
        requestBody: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }),
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }).catch(err => console.error('Failed to log admin action:', err));
    
    // Call the original send method with the body
    return originalSend.call(res, body);
  };
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/trending", async (req, res) => {
    try {
      const trendingProducts = await storage.getTrendingProducts();
      res.json(trendingProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const featuredProducts = await storage.getFeaturedProducts();
      res.json(featuredProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/collections/:collection", async (req, res) => {
    try {
      const { collection } = req.params;
      const products = await storage.getProductsByCollection(collection);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection products" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you would create a JWT token here
      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/carts", async (req, res) => {
    try {
      const cartData = insertCartSchema.parse(req.body);
      const cart = await storage.createCart(cartData);
      res.status(201).json(cart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create cart" });
    }
  });

  app.post("/api/cart-items", async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addItemToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.get("/api/carts/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const cart = await storage.getCartByUserId(userId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      // In a real app, you'd store this email in a database
      res.status(200).json({ message: "Subscription successful", email });
    } catch (error) {
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  // User Routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate update data
      const updateData = req.body;
      const updatedUser = await storage.updateUser(userId, updateData);

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Order Routes
  app.get("/api/orders/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const orders = await storage.getOrdersByUserId(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItems = await storage.getOrderItems(orderId);
      res.json({ ...order, items: orderItems });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/orders/track/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const order = await storage.getOrderByOrderNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to track order" });
    }
  });

  // Enhanced Cart Routes
  app.delete("/api/cart-items/:cartId/:productId", async (req, res) => {
    try {
      const cartId = parseInt(req.params.cartId);
      const productId = parseInt(req.params.productId);
      
      if (isNaN(cartId) || isNaN(productId)) {
        return res.status(400).json({ message: "Invalid cart or product ID" });
      }

      const success = await storage.removeCartItem(cartId, productId);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/carts/:cartId", async (req, res) => {
    try {
      const cartId = parseInt(req.params.cartId);
      if (isNaN(cartId)) {
        return res.status(400).json({ message: "Invalid cart ID" });
      }

      const success = await storage.clearCart(cartId);
      if (!success) {
        return res.status(404).json({ message: "Cart not found or already empty" });
      }

      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Admin Routes (Protected)
  app.get("/api/admin/users", isAdmin, logAdminAction, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const users = await storage.getAllUsers(limit, offset);
      const count = await storage.countUsers();
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({ users: usersWithoutPasswords, total: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/orders", isAdmin, logAdminAction, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const orders = await storage.getAllOrders(limit, offset);
      const count = await storage.countOrders();
      
      res.json({ orders, total: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.post("/api/admin/products", isAdmin, logAdminAction, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/admin/products/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const productData = req.body;
      const updatedProduct = await storage.updateProduct(productId, productData);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const success = await storage.deleteProduct(productId);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get("/api/admin/logs", isAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const logs = await storage.getAdminLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  app.get("/api/admin/logs/search", isAdmin, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const logs = await storage.searchAdminLogs(query as string);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to search admin logs" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const userCount = await storage.countUsers();
      const productCount = await storage.countProducts();
      const orderCount = await storage.countOrders();
      
      res.json({
        users: userCount,
        products: productCount,
        orders: orderCount
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Initialize server
  const httpServer = createServer(app);
  return httpServer;
}
