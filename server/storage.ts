import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  testimonials, type Testimonial, type InsertTestimonial
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getAllProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getTrendingProducts(): Promise<Product[]>;
  getProductsByCollection(collection: string): Promise<Product[]>;
  
  // Cart methods
  getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  addItemToCart(item: InsertCartItem): Promise<CartItem>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  
  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async getTrendingProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.trending, true));
  }

  async getProductsByCollection(collection: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.collection, collection));
  }

  // Cart methods
  async getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
    if (!cart) return undefined;

    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
    return { cart, items };
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const [cart] = await db.insert(carts).values(insertCart).returning();
    return cart;
  }

  async addItemToCart(insertItem: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db.insert(cartItems).values(insertItem).returning();
    return cartItem;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  // Seed the database with initial data if it's empty
  async seedInitialData() {
    // Check if products table is empty
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      // Sample products
      const sampleProducts = [
        {
          name: "Abstract Design Tee",
          description: "Stylish black t-shirt with abstract graphic design. This premium cotton t-shirt features a unique, artistic print that sets you apart from the crowd. The soft, breathable fabric ensures comfort all day long, while the bold design makes a statement without saying a word.",
          price: "899",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "White", "Gray"],
          images: [
            "https://images.unsplash.com/photo-1527719327859-c6ce80353573?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
            "https://images.unsplash.com/photo-1503341733017-1901578f9f1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"
          ],
          trending: true,
          featured: false,
          collection: "urban-streetwear",
          inStock: true
        },
        {
          name: "Geometric Print Tee",
          description: "White t-shirt with minimal geometric design. Modern, clean, and versatile, this t-shirt pairs perfectly with any outfit. The precision-cut geometric pattern represents balance and harmony, making this piece both fashionable and meaningful.",
          price: "799",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["White", "Black"],
          images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
          trending: true,
          featured: true,
          collection: "minimalist",
          inStock: true
        },
        {
          name: "Vintage Graphic Tee",
          description: "Gray t-shirt with vintage-style graphic print. This t-shirt brings back the iconic designs of a bygone era with a modern twist. The distressed print gives it an authentic, lived-in feel that only gets better with age.",
          price: "999",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Gray", "Black"],
          images: ["https://images.unsplash.com/photo-1554568218-0f1715e72254?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
          trending: true,
          featured: false,
          collection: "vintage",
          inStock: true
        },
        {
          name: "Statement Logo Tee",
          description: "Navy blue t-shirt with bold logo print. Make a statement with our signature logo design prominently displayed on premium fabric. This t-shirt combines simplicity with bold branding for those who appreciate subtle yet confident style.",
          price: "849",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Navy", "Black", "White"],
          images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
          trending: true,
          featured: true,
          collection: "urban-streetwear",
          inStock: true
        },
        {
          name: "Artistic Pattern Tee",
          description: "Creative pattern design on premium cotton. This t-shirt features a hand-drawn pattern created by our in-house artists, ensuring you're wearing a truly unique piece. The intricate details reveal something new every time someone looks at it.",
          price: "949",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["White", "Black"],
          images: ["https://images.unsplash.com/photo-1503341733017-1901578f9f1e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
          trending: true,
          featured: false,
          collection: "artistic-prints",
          inStock: true
        },
        {
          name: "Urban Style Tee",
          description: "Modern urban design for street style. Inspired by city landscapes and urban culture, this t-shirt captures the essence of contemporary street fashion. The dynamic print reflects the energy and rhythm of city life.",
          price: "899",
          category: "printed-tees",
          gender: "unisex",
          sizes: ["S", "M", "L", "XL"],
          colors: ["Black", "Gray"],
          images: ["https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=500"],
          trending: true,
          featured: true,
          collection: "urban-streetwear",
          inStock: true
        }
      ];

      // Insert sample products one by one to avoid type issues
      for (const product of sampleProducts) {
        await db.insert(products).values(product);
      }
    }

    // Check if testimonials table is empty
    const existingTestimonials = await db.select().from(testimonials);
    if (existingTestimonials.length === 0) {
      // Sample testimonials
      const sampleTestimonials = [
        {
          name: "Priya S.",
          rating: 5,
          review: "The quality of these t-shirts is amazing. The prints are vibrant and haven't faded even after multiple washes. Definitely my go-to for statement tees!",
          featured: true
        },
        {
          name: "Rahul M.",
          rating: 5,
          review: "I used the customization feature to create a tee for my friend's birthday. The process was super easy and the final product looked exactly like the preview. Fast shipping too!",
          featured: true
        },
        {
          name: "Ananya K.",
          rating: 4.5,
          review: "The fit is perfect and the material is so comfortable. I've gotten so many compliments on my Urban Streetwear collection tees. Will definitely be ordering more designs!",
          featured: true
        }
      ];

      // Insert sample testimonials one by one
      for (const testimonial of sampleTestimonials) {
        await db.insert(testimonials).values(testimonial);
      }
    }
  }
}

// Initialize the database storage and seed if needed
export const storage = new DatabaseStorage();

// Seed initial data
(async () => {
  try {
    // Wait for database connection and seed initial data
    await (storage as DatabaseStorage).seedInitialData();
    console.log("Database initialized with seed data if needed");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
})();
