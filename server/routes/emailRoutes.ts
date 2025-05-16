import { Router } from 'express';
import { emailService } from '../services/emailService';
import { storage } from '../storage';

const router = Router();

// Test route to send a welcome email
router.post('/test-welcome', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const success = await emailService.sendWelcomeEmail(user);
    
    if (success) {
      return res.json({ success: true, message: 'Welcome email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send welcome email' });
    }
  } catch (error) {
    console.error('Error in test-welcome route:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test route to send an order confirmation email
router.post('/test-order', async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    
    if (!userId || !orderId) {
      return res.status(400).json({ success: false, message: 'User ID and Order ID are required' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const order = await storage.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Get order items
    const orderItems = await storage.getOrderItems(order.id);
    
    // Get products for order items
    const productIds = orderItems.map(item => item.productId);
    const products = [];
    
    for (const productId of productIds) {
      const product = await storage.getProduct(productId);
      if (product) {
        products.push(product);
      }
    }
    
    const success = await emailService.sendOrderConfirmationEmail(order, user, products);
    
    if (success) {
      return res.json({ success: true, message: 'Order confirmation email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send order confirmation email' });
    }
  } catch (error) {
    console.error('Error in test-order route:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Test route to send a payment confirmation email
router.post('/test-payment', async (req, res) => {
  try {
    const { userId, orderId, amount, transactionId } = req.body;
    
    if (!userId || !orderId || !amount || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID, Order ID, Amount, and Transaction ID are required' 
      });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const order = await storage.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    const success = await emailService.sendPaymentConfirmationEmail(
      order, 
      user, 
      parseFloat(amount), 
      transactionId
    );
    
    if (success) {
      return res.json({ success: true, message: 'Payment confirmation email sent successfully' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to send payment confirmation email' });
    }
  } catch (error) {
    console.error('Error in test-payment route:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;