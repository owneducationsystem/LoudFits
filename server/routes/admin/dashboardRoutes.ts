import { Router } from 'express';
import { storage } from '../../storage';
import { notificationService } from '../../services/notificationService';
import { dashboardService } from '../../services/dashboardService';

export const setupAdminDashboardRoutes = (app: Router) => {
  // Get order stats for admin dashboard
  app.get('/api/admin/orders/stats', async (req, res) => {
    try {
      // Get basic order metrics
      const totalOrders = await dashboardService.getTotalOrders();
      const pendingOrders = await dashboardService.getPendingOrdersCount();
      const todayRevenue = await dashboardService.getTodayRevenue();
      
      // Get order status counts
      const statusCounts = await dashboardService.getOrderStatusCounts();
      
      res.json({
        totalOrders,
        pendingOrders,
        statusCounts,
        todayRevenue
      });
    } catch (error) {
      console.error('Error fetching order stats:', error);
      res.status(500).json({ message: 'Failed to fetch order statistics' });
    }
  });
  
  // Get user stats for admin dashboard
  app.get('/api/admin/users/stats', async (req, res) => {
    try {
      // Get total users from dashboard service
      const totalUsers = await dashboardService.getTotalUsers();
      
      // Calculate new users today
      const allUsers = await storage.getAllUsers();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newUsers = allUsers.filter(user => {
        const userCreatedDate = new Date(user.createdAt);
        return userCreatedDate >= today;
      }).length;
      
      res.json({
        totalUsers,
        newUsers
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: 'Failed to fetch user statistics' });
    }
  });

  // Get recent orders for admin dashboard
  app.get('/api/admin/orders/recent', async (req, res) => {
    try {
      // Get all orders and sort by created date
      const allOrders = await storage.getAllOrders();
      
      // Sort by latest first and take top 5
      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(async order => {
          // Get user for this order
          let user = null;
          if (order.userId) {
            try {
              user = await storage.getUser(order.userId);
            } catch (error) {
              console.error(`Error fetching user for order ${order.id}:`, error);
            }
          }
          
          // Return order with user information
          return {
            ...order,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email
            } : null
          };
        });
      
      // Wait for all user data to be fetched
      const orders = await Promise.all(recentOrders);
      
      res.json({ orders });
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ message: 'Failed to fetch recent orders' });
    }
  });

  // Get product stats for admin dashboard
  app.get('/api/admin/products/stats', async (req, res) => {
    try {
      // Get low stock count from dashboard service
      const lowStockCount = await dashboardService.getLowStockCount();
      
      const allProducts = await storage.getAllProducts();
      
      // Total product count
      const totalProducts = allProducts.length;
      
      // Count out of stock products
      const outOfStockCount = allProducts.filter(product => {
        if (product.stockQuantity !== null && product.stockQuantity !== undefined) {
          return product.stockQuantity === 0;
        }
        return product.inStock === false;
      }).length;
      
      // Get low stock products details
      const lowStockProducts = allProducts
        .filter(product => {
          if (product.stockQuantity !== null && product.stockQuantity !== undefined) {
            return product.stockQuantity <= 5 && product.stockQuantity > 0;
          }
          // If using the inStock boolean, we can't determine "low stock" easily,
          // but we'll include products that are still in stock but might be low
          return product.inStock === true;
        })
        .map(product => ({
          id: product.id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          category: product.category,
          image: product.images?.[0] || null
        }));
      
      res.json({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        lowStockProducts
      });
    } catch (error) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({ message: 'Failed to fetch product statistics' });
    }
  });

  // Update dashboard metrics manually
  app.post('/api/admin/dashboard/update', async (req, res) => {
    try {
      // Get metric type from request or default to 'all'
      const metricType = req.body.metricType || 'all';
      
      // Trigger dashboard metrics update
      const success = await dashboardService.updateDashboardMetrics(metricType);
      
      res.json({ 
        success, 
        message: success ? 'Dashboard metrics updated' : 'Failed to update some metrics',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating dashboard metrics:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update dashboard metrics' 
      });
    }
  });
};