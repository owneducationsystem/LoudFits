import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  testimonials, type Testimonial, type InsertTestimonial
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private testimonials: Map<number, Testimonial>;
  
  private userIdCounter: number;
  private productIdCounter: number;
  private cartIdCounter: number;
  private cartItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private testimonialIdCounter: number;

  constructor() {
    // Initialize maps
    this.users = new Map();
    this.products = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.testimonials = new Map();
    
    // Initialize ID counters
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.cartIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.testimonialIdCounter = 1;
    
    // Add initial sample data
    this.initializeSampleData();
  }

  // Initialize with sample data for development
  private initializeSampleData() {
    // Sample products
    const sampleProducts: InsertProduct[] = [
      {
        name: "Abstract Design Tee",
        description: "Stylish black t-shirt with abstract graphic design. This premium cotton t-shirt features a unique, artistic print that sets you apart from the crowd. The soft, breathable fabric ensures comfort all day long, while the bold design makes a statement without saying a word.",
        price: "899" as any,
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
        price: "799" as any,
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
        price: "999" as any,
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
        price: "849" as any,
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
        price: "949" as any,
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
        price: "899" as any,
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

    // Add sample products
    sampleProducts.forEach(product => {
      const id = this.productIdCounter++;
      this.products.set(id, { ...product, id });
    });

    // Sample testimonials
    const sampleTestimonials: InsertTestimonial[] = [
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

    // Add sample testimonials
    sampleTestimonials.forEach(testimonial => {
      const id = this.testimonialIdCounter++;
      this.testimonials.set(id, { ...testimonial, id });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.featured);
  }

  async getTrendingProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.trending);
  }

  async getProductsByCollection(collection: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.collection === collection);
  }

  // Cart methods
  async getCartByUserId(userId: number): Promise<{ cart: Cart; items: CartItem[] } | undefined> {
    const cart = Array.from(this.carts.values()).find(cart => cart.userId === userId);
    if (!cart) return undefined;

    const items = Array.from(this.cartItems.values()).filter(item => item.cartId === cart.id);
    return { cart, items };
  }

  async createCart(insertCart: InsertCart): Promise<Cart> {
    const id = this.cartIdCounter++;
    const now = new Date();
    const cart: Cart = { ...insertCart, id, createdAt: now };
    this.carts.set(id, cart);
    return cart;
  }

  async addItemToCart(insertItem: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemIdCounter++;
    const cartItem: CartItem = { ...insertItem, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  // Order methods
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const order: Order = { ...insertOrder, id, createdAt: now };
    this.orders.set(id, order);
    return order;
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
}

export const storage = new MemStorage();
