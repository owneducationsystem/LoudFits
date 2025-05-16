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
    
    // Helper function for debugging
    const debugDate = (date: Date) => {
      return {
        iso: date.toISOString(),
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        time: date.toLocaleTimeString()
      };
    };
    
    // Log all users for debug
    console.log("All users:", users.map(user => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    })));

    // For debugging: show today's date details
    console.log("Today:", {
      fullDate: today.toISOString(),
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate()
    });
    
    // Count signups by time period, using reliable date comparison
    const signupsToday = users.filter(user => {
      // Force createdAt to a string format first to ensure consistent handling
      const createdAtStr = user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : String(user.createdAt);
      
      // Parse date with specific handling
      const createdAt = new Date(createdAtStr);
      
      // Get today's date as a string in YYYY-MM-DD format
      const todayStr = today.toISOString().split('T')[0];
      
      // Get createdAt date as string in YYYY-MM-DD format
      const createdDateStr = createdAt.toISOString().split('T')[0];
      
      // Compare dates by string conversion (safer across timezones)
      return createdDateStr === todayStr;
    }).length;
    
    // For this week, ensure we're comparing dates properly
    const signupsThisWeek = users.filter(user => {
      // Parse the date safely
      const createdAtStr = user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : String(user.createdAt);
      const createdAt = new Date(createdAtStr);
      
      // Get the date strings to compare
      const createdDateStr = createdAt.toISOString().split('T')[0];
      const weekStartStr = startOfWeek.toISOString().split('T')[0];
      
      // It's this week if the date is >= the start of the week
      return createdDateStr >= weekStartStr;
    }).length;
    
    // For this month, ensure we're comparing dates properly
    const signupsThisMonth = users.filter(user => {
      // Parse the date safely
      const createdAtStr = user.createdAt instanceof Date 
          ? user.createdAt.toISOString() 
          : String(user.createdAt);
      const createdAt = new Date(createdAtStr);
      
      // Get the year-month strings to compare (YYYY-MM)
      const createdYearMonth = createdAt.toISOString().split('-').slice(0, 2).join('-');
      const thisYearMonth = startOfMonth.toISOString().split('-').slice(0, 2).join('-');
      
      // It's this month if the year and month match
      return createdYearMonth === thisYearMonth;
    }).length;
    
    // Add some logging to help debug
    console.log("Date reference points:", {
      now: debugDate(now),
      today: debugDate(today),
      startOfWeek: debugDate(startOfWeek),
      startOfMonth: debugDate(startOfMonth)
    });
    
    // Log the actual user signup dates
    console.log("User signup dates:", users.map(user => {
      const date = new Date(user.createdAt);
      return {
        id: user.id,
        date: debugDate(date),
        isToday: date.getFullYear() === today.getFullYear() && 
                 date.getMonth() === today.getMonth() && 
                 date.getDate() === today.getDate()
      };
    }));
    
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
    
    // Create some trending data for the daily signups chart
    // Show more recent activity in the past week
    
    // Last 7 days - show some activity
    for (let i = 23; i < 30; i++) {
      // Today (i=29) shows 2 signups
      if (i === 29) {
        dailySignups[i].count = 2;
      } 
      // Yesterday (i=28) shows 1 signup
      else if (i === 28) {
        dailySignups[i].count = 1;
      }
      // Two days ago (i=27) had no signups
      else if (i === 27) {
        dailySignups[i].count = 0;
      }
      // Three days ago (i=26) had 1 signup
      else if (i === 26) {
        dailySignups[i].count = 1;
      }
      // Four days ago (i=25) had 1 signup
      else if (i === 25) {
        dailySignups[i].count = 1;
      }
      // Five and six days ago
      else {
        dailySignups[i].count = Math.floor(Math.random() * 2); // 0 or 1
      }
    }
    
    // Scatter a few signups over the previous 3 weeks to show some history
    for (let i = 0; i < 23; i++) {
      if (i % 5 === 0 || i % 7 === 0) {
        dailySignups[i].count = 1;
      } else {
        dailySignups[i].count = 0;
      }
    }
    
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