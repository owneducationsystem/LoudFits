import { Router } from 'express';
import { storage } from '../../storage';
import { notificationService } from '../../services/notificationService';

export const setupAdminDashboardRoutes = (app: Router) => {
  // Get order stats for admin dashboard
  app.get('/api/admin/orders/stats', async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      
      // Calculate total orders
      const totalOrders = allOrders.length;
      
      // Calculate orders by status
      const statusCounts = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        canceled: 0
      };
      
      allOrders.forEach(order => {
        const status = order.status?.toLowerCase() || 'pending';
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
      
      // Calculate pending orders
      const pendingOrders = statusCounts.pending + statusCounts.processing;
      
      // Calculate today's revenue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && order.status !== 'canceled';
      });
      
      const todayRevenue = todayOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total.toString());
      }, 0).toFixed(2);
      
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
      const allUsers = await storage.getAllUsers();
      
      // Calculate total users
      const totalUsers = allUsers.length;
      
      // Calculate new users today
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
      const allProducts = await storage.getAllProducts();
      
      // Total product count
      const totalProducts = allProducts.length;
      
      // Count low stock products (5 or fewer items)
      const lowStockCount = allProducts.filter(product => 
        product.stockQuantity !== null && 
        product.stockQuantity !== undefined && 
        product.stockQuantity <= 5
      ).length;
      
      // Count out of stock products
      const outOfStockCount = allProducts.filter(product => 
        product.stockQuantity !== null && 
        product.stockQuantity !== undefined && 
        product.stockQuantity === 0
      ).length;
      
      // Get low stock products details
      const lowStockProducts = allProducts
        .filter(product => 
          product.stockQuantity !== null && 
          product.stockQuantity !== undefined && 
          product.stockQuantity <= 5
        )
        .map(product => ({
          id: product.id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          category: product.category,
          image: product.images[0] || null
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
      // Trigger a dashboard update via notification service
      // This is a simplified version - implement the actual method in notificationService
      await notificationService.sendAdminDashboardUpdate({
        updatedAt: new Date().toISOString()
      });
      
      res.json({ 
        success: true, 
        message: 'Dashboard metrics updated'
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