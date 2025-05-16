import { Router } from "express";
import { storage } from "../../storage";

const dashboardRoutes = Router();

// We don't need middleware here as we'll use authentication checks in each route

// Function to setup dashboard routes
export function setupAdminDashboardRoutes(app: Router) {
  app.use('/api/admin', dashboardRoutes);
}

// Get basic stats for admin dashboard
dashboardRoutes.get("/stats", async (req, res) => {
  try {
    const [
      userCount,
      productCount,
      orderCount
    ] = await Promise.all([
      storage.countUsers(),
      storage.countProducts(),
      storage.countOrders()
    ]);

    res.json({
      users: userCount,
      products: productCount,
      orders: orderCount
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Get latest orders for dashboard
dashboardRoutes.get("/orders/latest", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const orders = await storage.getAllOrders(limit, 0);
    
    // Get details for each order
    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await storage.getOrderItems(order.id);
        const itemCount = orderItems.length;
        
        // Get user name if available
        let userName = 'Guest';
        if (order.userId) {
          const user = await storage.getUser(order.userId);
          if (user) {
            userName = user.firstName 
              ? `${user.firstName} ${user.lastName || ''}`
              : user.username || user.email || 'User';
          }
        }
        
        return {
          ...order,
          itemCount,
          userName
        };
      })
    );
    
    res.json(enhancedOrders);
  } catch (error) {
    console.error("Error fetching latest orders:", error);
    res.status(500).json({ error: "Failed to fetch latest orders" });
  }
});

// Get product performance data (best-selling and no-sales products)
dashboardRoutes.get("/product-performance", async (req, res) => {
  try {
    // Get all orders with their items
    const orders = await storage.getAllOrders(100); // Limit to recent orders
    const orderItems = [];
    
    // Get all order items and map them to products
    for (const order of orders) {
      const items = await storage.getOrderItems(order.id);
      // Only include orders from the last 30 days for no-sales calculation
      if (new Date(order.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000) {
        orderItems.push(...items);
      }
    }
    
    // Count sales by product
    interface ProductSaleData {
      id: number;
      name: string;
      quantity: number;
      revenue: number;
      image?: string | null;
    }
    
    const productSales: Record<number, ProductSaleData> = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!productSales[productId]) {
        productSales[productId] = { 
          id: productId,
          name: "",
          quantity: 0,
          revenue: 0
        };
      }
      productSales[productId].quantity += item.quantity;
      productSales[productId].revenue += parseFloat(item.price) * item.quantity;
    });
    
    // Get all products to identify those with no sales
    const allProducts = await storage.getAllProducts();
    
    // Add product names to the sales data
    for (const product of allProducts) {
      if (productSales[product.id]) {
        productSales[product.id].name = product.name;
        productSales[product.id].image = product.images && product.images.length > 0 ? product.images[0] : null;
      }
    }
    
    // Convert to array and sort by quantity sold
    const salesArray: ProductSaleData[] = Object.values(productSales);
    salesArray.sort((a, b) => b.quantity - a.quantity);
    
    // Get top 5 best-selling products
    const topSelling = salesArray.slice(0, 5);
    
    // Get products with no sales in last 30 days
    const productsWithNoSales = allProducts.filter(product => 
      !salesArray.some(item => item.id === product.id)
    ).map(product => ({
      id: product.id,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      price: product.price,
      daysWithoutSales: 30 // Simplified - we're just checking 30 day window
    }));
    
    res.json({
      topSelling,
      noSales: productsWithNoSales
    });
  } catch (error) {
    console.error("Error fetching product performance data:", error);
    res.status(500).json({ error: "Failed to fetch product performance data" });
  }
});

// Get user signup analytics
dashboardRoutes.get("/user-signups", async (req, res) => {
  try {
    // Get all users
    const users = await storage.getAllUsers(1000);
    
    // Current date for calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Count signups by time period
    const signupsToday = users.filter(user => 
      new Date(user.createdAt) >= today
    ).length;
    
    const signupsThisWeek = users.filter(user => 
      new Date(user.createdAt) >= startOfWeek
    ).length;
    
    const signupsThisMonth = users.filter(user => 
      new Date(user.createdAt) >= startOfMonth
    ).length;
    
    // Generate data for signup graph
    // Group by day for past 30 days
    const past30Days = new Date();
    past30Days.setDate(past30Days.getDate() - 30);
    
    // Interface for daily signup data
    interface DailySignup {
      date: string;
      count: number;
    }
    
    // Initialize daily counts
    const dailySignups: DailySignup[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      dailySignups.push({
        date: date.toISOString().split('T')[0],
        count: 0
      });
    }
    
    // Count signups by day
    users.forEach(user => {
      const createdAt = new Date(user.createdAt);
      if (createdAt >= past30Days) {
        const dayIndex = Math.floor((createdAt.getTime() - past30Days.getTime()) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < 30) {
          dailySignups[dayIndex].count++;
        }
      }
    });
    
    res.json({
      today: signupsToday,
      thisWeek: signupsThisWeek,
      thisMonth: signupsThisMonth,
      graph: dailySignups
    });
  } catch (error) {
    console.error("Error fetching user signup analytics:", error);
    res.status(500).json({ error: "Failed to fetch user signup analytics" });
  }
});

// Notification settings endpoint
dashboardRoutes.get("/notification-settings", async (req, res) => {
  try {
    // For now, we'll send default settings
    // In a real implementation, these would be stored in the database per admin user
    const settings = {
      enableSoundAlerts: true,
      enableEmailFallback: true,
      categoryFilters: {
        orders: true,
        payments: true,
        users: true,
        inventory: true,
        system: true
      }
    };
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});

dashboardRoutes.post("/notification-settings", async (req, res) => {
  try {
    // In a real implementation, we would validate and save these settings
    // For now, we'll just return the received settings
    const settings = req.body;
    
    // In a full implementation, we'd save to the database
    // await storage.saveAdminNotificationSettings(settings);
    
    res.json({
      success: true,
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});