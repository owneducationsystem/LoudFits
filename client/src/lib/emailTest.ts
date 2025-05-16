/**
 * Email testing utility functions
 */

// Test sending a welcome email
export async function sendWelcomeEmail(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    // Check if the response has a valid status
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Welcome email sent successfully to user ${userId}` 
    };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

// Test sending a login notification email
export async function sendLoginEmail(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Login notification email sent successfully to user ${userId}` 
    };
  } catch (error) {
    console.error('Failed to send login email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

// Test sending an order confirmation email
export async function sendOrderEmail(userId: number, orderId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Order confirmation email sent successfully to user ${userId} for order ${orderId}` 
    };
  } catch (error) {
    console.error('Failed to send order email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

// Test sending a payment confirmation email
export async function sendPaymentSuccessEmail(userId: number, orderId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/payment-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Payment confirmation email sent successfully to user ${userId} for order ${orderId}` 
    };
  } catch (error) {
    console.error('Failed to send payment success email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

// Test sending a payment failure email
export async function sendPaymentFailureEmail(userId: number, orderId: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/payment-failure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Payment failure email sent successfully to user ${userId} for order ${orderId}` 
    };
  } catch (error) {
    console.error('Failed to send payment failure email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}

// Test sending an order status update email
export async function sendOrderStatusEmail(userId: number, orderId: number, status: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/ajax/email/order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, orderId, status })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        message: `Server error: ${response.status} ${response.statusText}` 
      };
    }
    
    return { 
      success: true, 
      message: `Order status update email sent successfully to user ${userId} for order ${orderId} (${status})` 
    };
  } catch (error) {
    console.error('Failed to send order status email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending email' 
    };
  }
}