import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupPaymentRoutes } from "./routes/payment";
import { storage } from "./storage";
import { z } from "zod";
import { notificationService, NotificationType } from "./services/notificationService";
import { emailService } from "./services/emailService";
import directEmailRoutes from "./routes/public/emailRoutes";
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
    // Get admin user ID from request headers
    const adminId = req.headers['admin-id'] as string;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized - Admin ID missing" });
    }
    
    // Verify user exists and has admin role
    const user = await storage.getUser(parseInt(adminId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }
    
    // User is authenticated as admin, proceed
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Middleware to log admin actions
const logAdminAction = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    // Get admin user ID from request headers
    const adminId = req.headers['admin-id'] as string;
    if (adminId) {
      const userId = parseInt(adminId);
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
    }
    
    // Call the original send method with the body
    return originalSend.call(res, body);
  };
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Register our direct email testing route
  app.use("/api/direct-email", directEmailRoutes);
  // Create the HTTP server first so we can attach WebSockets to it
  let httpServer = createServer(app);
  
  // Initialize the notification service with our HTTP server
  notificationService.initialize(httpServer);
  
  // Setup routes
  setupPaymentRoutes(app);
  
  // Set up email test routes
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Import using dynamic import for the AJAX email routes
      import('./routes/ajaxEmailRoutes').then(module => {
        module.setupAjaxEmailRoutes(app);
        console.log("Email test routes registered");
      }).catch(error => {
        console.error("Failed to register email routes:", error);
      });
    } catch (error) {
      console.error("Failed to register email routes:", error);
    }
  }
  
  // Setup notification test routes
  app.get("/api/notifications/test", async (req, res) => {
    try {
      // Create a test notification
      const notification = {
        type: NotificationType.SYSTEM,
        title: "Test Notification",
        message: "This is a test notification from Loudfits. If you can see this, the notification system is working!",
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date(),
        read: false
      };
      
      // Send the notification to all connected clients
      await notificationService.sendBroadcast({
        type: NotificationType.SYSTEM,
        title: "Test Notification",
        message: "This is a test notification from Loudfits. If you can see this, the notification system is working!"
      });
      
      res.json({ success: true, notification });
    } catch (error: any) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  app.post("/api/notifications/order-test", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Generate a random order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      // User notification
      await notificationService.sendUserNotification({
        userId,
        type: NotificationType.ORDER_PLACED,
        title: "Order Placed Successfully",
        message: `Your order #${orderNumber} has been placed and is being processed. You will receive a confirmation email shortly.`,
        entityId: 123, // Mock order ID
        entityType: 'order'
      });
      
      // Admin notification
      await notificationService.sendAdminNotification({
        type: NotificationType.ORDER_PLACED,
        title: "New Order Received",
        message: `New order #${orderNumber} has been placed and requires processing.`,
        entityId: 123, // Mock order ID
        entityType: 'order',
        isAdmin: true
      });
      
      res.json({ success: true, orderNumber });
    } catch (error: any) {
      console.error("Error sending order test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  app.post("/api/notifications/payment-test", async (req, res) => {
    try {
      const { userId, success = true } = req.body;
      
      // Generate a random order number
      const orderNumber = `TEST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      if (success) {
        // Payment success notification
        await notificationService.sendUserNotification({
          userId,
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Payment Successful",
          message: `Your payment for order #${orderNumber} has been successfully processed.`,
          entityId: 123, // Mock order ID
          entityType: 'order'
        });
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Payment Received",
          message: `Payment received for order #${orderNumber}.`,
          entityId: 123, // Mock order ID
          entityType: 'order',
          isAdmin: true
        });
      } else {
        // Payment failure notification
        await notificationService.sendUserNotification({
          userId,
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment Failed",
          message: `Your payment for order #${orderNumber} has failed. Please try again or contact our support team.`,
          entityId: 123, // Mock order ID
          entityType: 'order'
        });
        
        await notificationService.sendAdminNotification({
          type: NotificationType.PAYMENT_FAILED,
          title: "Payment Failed",
          message: `Payment failed for order #${orderNumber}.`,
          entityId: 123, // Mock order ID
          entityType: 'order',
          isAdmin: true
        });
      }
      
      res.json({ success: true, orderNumber, paymentStatus: success ? 'success' : 'failed' });
    } catch (error: any) {
      console.error("Error sending payment test notification:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  // Simple test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  
  // Add route for redirecting from PhonePe callback to our frontend
  app.get("/payment/callback", (req, res) => {
    const { merchantTransactionId, transactionId, code } = req.query;
    
    // PhonePe sometimes sends status in query params
    if (merchantTransactionId) {
      console.log(`Payment callback received: merchantId=${merchantTransactionId}, code=${code}`);
      
      // Forward to API endpoint which will handle the validation
      res.redirect(`/api/payment/callback?merchantTransactionId=${merchantTransactionId}&transactionId=${transactionId || ''}&code=${code || ''}`);
    } else {
      // If no params, redirect to homepage
      res.redirect('/');
    }
  });
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
      
      // Send welcome email to the new user
      try {
        emailService.sendWelcomeEmail(user).then(sent => {
          if (sent) {
            console.log(`Welcome email sent to ${user.email}`);
          } else {
            console.log(`Failed to send welcome email to ${user.email}`);
          }
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }
      
      // Send notification about new user registration (if admin is connected)
      try {
        notificationService.sendAdminNotification({
          type: NotificationType.USER_REGISTERED,
          title: "New User Registered",
          message: `A new user (${user.username}) has registered on the platform.`,
          isAdmin: true,
          priority: "low"
        });
      } catch (notificationError) {
        console.error("Error sending registration notification:", notificationError);
      }
      
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

      // Get client IP address and user agent for security notifications
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent');
      
      // Send login notification email
      try {
        emailService.sendLoginNotificationEmail(user, ipAddress, userAgent).then(sent => {
          if (sent) {
            console.log(`Login notification email sent to ${user.email}`);
          } else {
            console.log(`Failed to send login notification email to ${user.email}`);
          }
        });
      } catch (emailError) {
        console.error("Error sending login notification email:", emailError);
      }
      
      // Send admin notification about login (useful for monitoring)
      try {
        notificationService.sendAdminNotification({
          type: NotificationType.ADMIN_LOGIN,
          title: "User Login",
          message: `User ${user.username} logged in from ${ipAddress}`,
          isAdmin: true,
          priority: "low",
          metadata: { userId: user.id, ipAddress, userAgent }
        });
      } catch (notificationError) {
        console.error("Error sending login notification:", notificationError);
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
      
      // Send order notifications
      if (order.userId) {
        // Get user information
        const user = await storage.getUser(order.userId);
        
        if (user) {
          // Get order items and products for detailed email
          const orderItems = await storage.getOrderItems(order.id);
          const products = [];
          
          // Fetch product details for each item
          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              products.push(product);
            }
          }
          
          // Send email confirmation
          emailService.sendOrderConfirmationEmail(order, user, products).then(sent => {
            if (sent) {
              console.log(`Order confirmation email sent to ${user.email} for order #${order.orderNumber}`);
            } else {
              console.log(`Failed to send order confirmation email to ${user.email}`);
            }
          }).catch(err => {
            console.error(`Error sending order confirmation email: ${err.message}`);
          });
          
          // Send user notification
          notificationService.sendUserNotification({
            type: NotificationType.ORDER_PLACED,
            title: "Order Placed Successfully",
            message: `Your order #${order.orderNumber} has been received and is being processed.`,
            userId: user.id,
            entityId: order.id,
            entityType: 'order',
            metadata: { orderNumber: order.orderNumber, total: order.total },
            priority: "medium"
          }).catch(err => {
            console.error(`Error sending order notification: ${err.message}`);
          });
        }
        
        // Send admin notification about new order
        notificationService.sendAdminNotification({
          type: NotificationType.ORDER_PLACED,
          title: "New Order Received",
          message: `Order #${order.orderNumber} has been placed for a total of ₹${
            typeof order.total === 'string' ? order.total : order.total.toFixed(2)
          }`,
          entityId: order.id,
          entityType: 'order',
          isAdmin: true,
          priority: "high",
          actionRequired: true,
          actionType: "process_order"
        }).catch(err => {
          console.error(`Error sending admin order notification: ${err.message}`);
        });
      }
      
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

  // Track login attempts to implement basic rate limiting
  const loginAttempts = new Map<string, { count: number, lastAttempt: number }>();
  
  // Admin login route (not protected)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || 'unknown';
      
      // Basic rate limiting - prevent brute force attacks
      const now = Date.now();
      const attempts = loginAttempts.get(ipAddress) || { count: 0, lastAttempt: 0 };
      
      // Reset attempts if it's been more than 15 minutes
      if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attempts.count = 0;
      }
      
      // Limit to 5 failed attempts within 15 minutes
      if (attempts.count >= 5) {
        console.log(`Too many login attempts from IP: ${ipAddress}`);
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
      }
      
      // Update attempts counter
      attempts.count++;
      attempts.lastAttempt = now;
      loginAttempts.set(ipAddress, attempts);
      
      // Validate request
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Try to find user by username or email
      let user = await storage.getUserByUsername(username);
      
      // If not found by username, try to find by email
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      // For security, use a consistent response time whether successful or not
      const delayResponse = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      // Always use same generic error message to prevent username enumeration
      if (!user || user.role !== "admin") {
        console.log(`Admin login attempt failed for username/email: "${username}" from IP: ${ipAddress}`);
        await delayResponse();
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      if (user.password !== password) {
        console.log(`Admin login attempt with correct username but wrong password from IP: ${ipAddress}`);
        await delayResponse();
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Successful login - Reset failed attempts counter
      loginAttempts.delete(ipAddress);
      
      // Log successful login
      await storage.createAdminLog({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'auth',
        entityId: user.id.toString(),
        details: JSON.stringify({ timestamp: new Date().toISOString() }),
        ipAddress: ipAddress,
        userAgent: req.get('user-agent') || 'unknown'
      }).catch(err => console.error('Failed to log admin login:', err));
      
      // Return user information (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      console.log(`Admin login successful for ${username} from IP: ${ipAddress}`);
      
      res.json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "An error occurred during authentication" });
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
  
  // Create new user from admin panel
  app.post("/api/admin/users", isAdmin, logAdminAction, async (req, res) => {
    try {
      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ 
          message: `Username "${userData.username}" is already taken. Please choose another.` 
        });
      }
      
      // Check if email already exists
      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ 
            message: `Email "${userData.email}" is already registered. Please use a different email.` 
          });
        }
      }
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Return the created user
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin Products Routes
  app.get("/api/admin/products", isAdmin, logAdminAction, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const products = await storage.getAllProducts();
      const count = await storage.countProducts();
      
      res.json({ products, total: count });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  // Create new product from admin panel
  app.post("/api/admin/products", isAdmin, logAdminAction, async (req, res) => {
    try {
      // Validate product data
      const productData = insertProductSchema.parse(req.body);
      
      // Create the product
      const product = await storage.createProduct(productData);
      
      // Return the created product
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  // Update existing product from admin panel
  app.patch("/api/admin/products/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Validate product data
      const productData = req.body;
      
      // Update the product
      const updatedProduct = await storage.updateProduct(productId, productData);
      
      // Return the updated product
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });
  
  // Categories API endpoints
  // For now, these are placeholders since we don't yet have category tables in the database schema
  app.get("/api/admin/categories", isAdmin, logAdminAction, async (req, res) => {
    // This is a placeholder
    // In a real implementation, you would fetch categories from the database
    const categories = [
      { id: 1, name: "Graphic Tees", description: "T-shirts with graphic designs", slug: "graphic-tees", productCount: 12 },
      { id: 2, name: "Printed Shirts", description: "Shirts with printed patterns", slug: "printed-shirts", productCount: 8 },
      { id: 3, name: "Typography", description: "Designs featuring creative text and typography", slug: "typography", productCount: 5 },
      { id: 4, name: "Abstract", description: "Abstract art and geometric patterns", slug: "abstract", productCount: 9 },
      { id: 5, name: "Artists", description: "Designs from our featured artists", slug: "artists", productCount: 7 },
      { id: 6, name: "Limited Edition", description: "Exclusive limited runs of special designs", slug: "limited-edition", productCount: 3 },
    ];
    
    res.json(categories);
  });
  
  app.post("/api/admin/categories", isAdmin, logAdminAction, async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // This is a placeholder
      // In a real implementation, you would create a category in the database
      const category = {
        id: 7, // In a real app, this would be generated by the database
        name,
        description,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        productCount: 0
      };
      
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.patch("/api/admin/categories/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const { name, description } = req.body;
      
      // This is a placeholder
      // In a real implementation, you would update a category in the database
      const category = {
        id: categoryId,
        name,
        description,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        productCount: 0 // In a real implementation, this would be the actual count
      };
      
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  app.delete("/api/admin/categories/:id", isAdmin, logAdminAction, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      // This is a placeholder
      // In a real implementation, you would delete a category from the database
      // and check if it's safe to delete (no products assigned to it)
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
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

      const { status, notes } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Import the order service for notification handling
      const { updateOrderWithNotification } = await import('./services/orderService');
      
      // Update order with notification
      const updatedOrder = await updateOrderWithNotification(
        orderId, 
        status,
        true, // notify user
        false, // don't notify admin (since admin is making the change)
        notes // optional notes to include in the notification
      );
      
      // Log who updated the order
      console.log(`Order ${orderId} updated to status '${status}' by admin ${req.user?.username || 'unknown'}`);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
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

  // Set up notification routes
  const { setupNotificationRoutes } = await import('./routes/notificationRoutes');
  setupNotificationRoutes(app);
  
  // Server is already created at the top for WebSocket support
  return httpServer;
}
