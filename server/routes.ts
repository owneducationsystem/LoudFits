import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertProductSchema,
  insertUserSchema,
  insertCartSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertTestimonialSchema,
} from "@shared/schema";

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

  // Initialize server
  const httpServer = createServer(app);
  return httpServer;
}
