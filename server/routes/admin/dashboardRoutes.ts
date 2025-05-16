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

// Add more dashboard-specific endpoints as needed