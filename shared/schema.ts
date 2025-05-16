import { pgTable, text, serial, integer, boolean, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  profileImage: text("profile_image"),
  role: text("role").default("customer"),
  isEmailVerified: boolean("is_email_verified").default(false),
  firebaseId: text("firebase_id").unique(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  gender: text("gender").notNull(),
  sizes: text("sizes").array().notNull(),
  colors: text("colors").array().notNull(),
  images: text("images").array().notNull(),
  featured: boolean("featured").default(false),
  trending: boolean("trending").default(false),
  collection: text("collection"),
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity"),
  metadata: json("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  customization: json("customization"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("processing"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  shippingMethod: text("shipping_method").notNull().default("standard"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  estimatedDelivery: timestamp("estimated_delivery"),
  notes: text("notes"),
  // Shipping address as JSON to store structured address data
  shippingAddress: json("shipping_address").notNull(),
  billingAddress: json("billing_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: text("size").notNull(),
  color: text("color").notNull(),
  customization: json("customization"),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  featured: boolean("featured").default(false),
});

// Admin activity logs
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // "user", "product", "order", etc.
  entityId: text("entity_id").notNull(),     // The ID of the affected entity
  details: json("details"),                   // Additional details about the action
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  address: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  profileImage: true,
  role: true,
  isEmailVerified: true,
  firebaseId: true,
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  category: true,
  gender: true,
  sizes: true,
  colors: true,
  images: true,
  featured: true,
  trending: true,
  collection: true,
  inStock: true,
});

export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
  size: true,
  color: true,
  customization: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  userId: true,
  subtotal: true,
  tax: true,
  shippingCost: true,
  discount: true,
  total: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  paymentId: true,
  shippingMethod: true,
  trackingNumber: true,
  trackingUrl: true,
  estimatedDelivery: true,
  notes: true,
  shippingAddress: true,
  billingAddress: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
  size: true,
  color: true,
  customization: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  name: true,
  rating: true,
  review: true,
  featured: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// Payments table to track payment transactions
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  transactionId: text("transaction_id").notNull().unique(),
  merchantTransactionId: text("merchant_transaction_id").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("INR"),
  method: text("method").notNull(), // PhonePe, COD, etc.
  status: text("status").notNull().default("initiated"), // initiated, completed, failed, refunded
  gatewayResponse: json("gateway_response"), // Response from payment gateway
  gatewayErrorCode: text("gateway_error_code"),
  gatewayErrorMessage: text("gateway_error_message"),
  paymentDate: timestamp("payment_date"),
  refundDate: timestamp("refund_date"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  orderId: true,
  userId: true,
  transactionId: true,
  merchantTransactionId: true,
  amount: true,
  currency: true,
  method: true,
  status: true,
  gatewayResponse: true,
  gatewayErrorCode: true,
  gatewayErrorMessage: true,
  paymentDate: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
