import { Router } from 'express';
import { storage } from '../../storage';
import { notificationService } from '../../services/notificationService';
import { dashboardService } from '../../services/dashboardService';
import { getSystemHealth } from './healthRoutes';

export const setupAdminDashboardRoutes = (app: Router) => {
  // System health check
  app.get('/api/admin/health', getSystemHealth);
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
      // Get product count directly from database with a count query instead of fetching all products
      const productCount = await storage.countProducts();
      
      // Use fixed values to showcase the dashboard functionality
      const lowStockCount = await dashboardService.getLowStockCount();
      const outOfStockCount = 2;
      
      // Sample product data
      const lowStockProducts = [
        {
          id: 1,
          name: "Urban Graphic Tee",
          stockStatus: "Low stock",
          category: "T-Shirts",
          image: "/assets/product1.jpg"
        },
        {
          id: 2,
          name: "Vibrant Color Block Tee",
          stockStatus: "Low stock",
          category: "T-Shirts",
          image: "/assets/product2.jpg"
        }
      ];
      
      res.json({
        totalProducts: productCount,
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