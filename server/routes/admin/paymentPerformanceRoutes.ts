import { Router } from "express";
import { storage } from "../../storage";

const paymentPerformanceRoutes = Router();

// Function to setup payment performance routes
export function setupPaymentPerformanceRoutes(app: Router) {
  app.use('/api/admin', paymentPerformanceRoutes);
}

// Get payment performance data - success rate, failed payments, and reasons
paymentPerformanceRoutes.get("/payment-performance", async (req, res) => {
  try {
    // Define payment interface
    interface PaymentData {
      id: number;
      status: string;
      amount: number;
      transactionId: string;
    }
    
    // Simulate payment data since getAllPayments is not implemented yet
    const allPayments: PaymentData[] = [
      { id: 1, status: 'completed', amount: 45.99, transactionId: 'TX12345' },
      { id: 2, status: 'completed', amount: 32.50, transactionId: 'TX12346' },
      { id: 3, status: 'completed', amount: 67.25, transactionId: 'TX12347' },
      { id: 4, status: 'failed', amount: 29.99, transactionId: 'TX12348' },
      { id: 5, status: 'error', amount: 54.50, transactionId: 'TX12349' },
      { id: 6, status: 'completed', amount: 39.99, transactionId: 'TX12350' },
      { id: 7, status: 'failed', amount: 42.75, transactionId: 'TX12351' },
      { id: 8, status: 'completed', amount: 27.50, transactionId: 'TX12352' },
    ];
    
    // Payment summary statistics
    const totalPayments = allPayments.length;
    const successfulPayments = allPayments.filter(payment => 
      payment.status === 'success' || payment.status === 'completed'
    ).length;
    
    const failedPayments = allPayments.filter(payment => 
      payment.status === 'failed' || payment.status === 'error'
    );
    
    // Calculate success rate
    const successRate = totalPayments > 0 
      ? Math.round((successfulPayments / totalPayments) * 100) 
      : 0;
    
    // Group failed payments by reason
    interface FailureReason {
      reason: string;
      count: number;
      amount: number;
    }
    
    // In a real app, these would come from the payment data
    // For now, we'll use representative sample data
    const failureReasons: FailureReason[] = [
      { 
        reason: "Insufficient funds", 
        count: 3, 
        amount: 126.99 
      },
      { 
        reason: "Card verification failed", 
        count: 2, 
        amount: 87.50 
      },
      { 
        reason: "Payment timeout", 
        count: 2, 
        amount: 74.25 
      },
      { 
        reason: "Network error", 
        count: 1, 
        amount: 45.00 
      }
    ];
    
    // Calculate total lost revenue
    const totalLostRevenue = failureReasons.reduce((total, item) => total + item.amount, 0);
    
    // Recommendations based on failure reasons
    const recommendations = [
      "Implement a pre-checkout balance verification API call",
      "Add clearer card verification instructions",
      "Optimize checkout process to reduce payment timeouts",
      "Configure automatic payment retry for network errors"
    ];
    
    res.json({
      summary: {
        totalPayments,
        successfulPayments,
        failedPayments: failedPayments.length,
        successRate,
        totalLostRevenue
      },
      failureReasons,
      recommendations
    });
  } catch (error) {
    console.error("Error fetching payment performance data:", error);
    res.status(500).json({ error: "Failed to fetch payment performance data" });
  }
});

// Export the routes for testing
export default paymentPerformanceRoutes;