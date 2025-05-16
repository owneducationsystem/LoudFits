import { storage } from '../storage';
import { notificationService } from './notificationService';

/**
 * Dashboard metrics data structure
 */
export interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: string;
  totalUsers: number;
  lowStockProducts: number;
  updatedAt: string;
}

/**
 * Order status count data structure
 */
export interface OrderStatusCount {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  canceled: number;
}

/**
 * Dashboard service for handling admin metrics and stats
 */
export class DashboardService {
  /**
   * Get all dashboard metrics
   */
  async getAllMetrics(): Promise<DashboardMetrics> {
    const [
      totalOrders,
      pendingOrders,
      todayRevenue,
      totalUsers,
      lowStockProducts
    ] = await Promise.all([
      this.getTotalOrders(),
      this.getPendingOrdersCount(),
      this.getTodayRevenue(),
      this.getTotalUsers(),
      this.getLowStockCount()
    ]);
    
    return {
      totalOrders,
      pendingOrders,
      todayRevenue,
      totalUsers,
      lowStockProducts,
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Get total orders count
   */
  async getTotalOrders(): Promise<number> {
    try {
      return await storage.countOrders();
    } catch (error) {
      console.error('Error getting total orders:', error);
      return 0;
    }
  }
  
  /**
   * Get count of pending and processing orders
   */
  async getPendingOrdersCount(): Promise<number> {
    try {
      const allOrders = await storage.getAllOrders();
      return allOrders.filter(order => 
        order.status === 'pending' || 
        order.status === 'processing'
      ).length;
    } catch (error) {
      console.error('Error getting pending orders:', error);
      return 0;
    }
  }
  
  /**
   * Get today's revenue
   */
  async getTodayRevenue(): Promise<string> {
    try {
      const allOrders = await storage.getAllOrders();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today && order.status !== 'canceled';
      });
      
      const totalRevenue = todayOrders.reduce((sum, order) => {
        return sum + parseFloat(order.total.toString());
      }, 0);
      
      return totalRevenue.toFixed(2);
    } catch (error) {
      console.error('Error calculating today revenue:', error);
      return '0.00';
    }
  }
  
  /**
   * Get total users count
   */
  async getTotalUsers(): Promise<number> {
    try {
      return await storage.countUsers();
    } catch (error) {
      console.error('Error getting total users:', error);
      return 0;
    }
  }
  
  /**
   * Get count of products with low stock
   */
  async getLowStockCount(): Promise<number> {
    try {
      const allProducts = await storage.getAllProducts();
      return allProducts.filter(product => 
        product.stockQuantity !== null && 
        product.stockQuantity !== undefined && 
        product.stockQuantity <= 5
      ).length;
    } catch (error) {
      console.error('Error getting low stock products count:', error);
      return 0;
    }
  }
  
  /**
   * Get counts of orders by status
   */
  async getOrderStatusCounts(): Promise<OrderStatusCount> {
    try {
      const allOrders = await storage.getAllOrders();
      
      const statusCounts: OrderStatusCount = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        canceled: 0
      };
      
      allOrders.forEach(order => {
        const status = order.status?.toLowerCase();
        if (status && status in statusCounts) {
          statusCounts[status as keyof OrderStatusCount]++;
        }
      });
      
      return statusCounts;
    } catch (error) {
      console.error('Error getting order status counts:', error);
      return {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        canceled: 0
      };
    }
  }
  
  /**
   * Update dashboard metrics and broadcast to admin clients
   * @param metricType Type of metric to update
   */
  async updateDashboardMetrics(metricType: 'orders' | 'revenue' | 'users' | 'stock' | 'all' = 'all'): Promise<boolean> {
    try {
      let metricsData: Partial<DashboardMetrics> = {};
      
      // Get metrics based on the requested type
      if (metricType === 'orders' || metricType === 'all') {
        const totalOrders = await this.getTotalOrders();
        const pendingOrders = await this.getPendingOrdersCount();
        metricsData.totalOrders = totalOrders;
        metricsData.pendingOrders = pendingOrders;
      }
      
      if (metricType === 'revenue' || metricType === 'all') {
        const todayRevenue = await this.getTodayRevenue();
        metricsData.todayRevenue = todayRevenue;
      }
      
      if (metricType === 'users' || metricType === 'all') {
        const totalUsers = await this.getTotalUsers();
        metricsData.totalUsers = totalUsers;
      }
      
      if (metricType === 'stock' || metricType === 'all') {
        const lowStockProducts = await this.getLowStockCount();
        metricsData.lowStockProducts = lowStockProducts;
      }
      
      // Add timestamp
      metricsData.updatedAt = new Date().toISOString();
      
      // Send to all admin clients
      notificationService.sendAdminDashboardUpdate(metricsData);
      
      return true;
    } catch (error) {
      console.error('Error updating dashboard metrics:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService();