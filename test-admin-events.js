// Test script to send admin events via the REST API

const sendEvent = async () => {
  try {
    const response = await fetch('/api/admin/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Admin-ID': '1', // Assuming admin ID 1 exists
      },
      body: JSON.stringify({
        event: 'order_update',
        data: {
          orderId: 123,
          status: 'shipped',
          updatedAt: new Date().toISOString(),
          message: 'Order has been shipped.',
        }
      })
    });

    const result = await response.json();
    console.log('Event sent:', result);
  } catch (error) {
    console.error('Error sending event:', error);
  }
};

// Send event when the script is loaded
sendEvent();

// Export for reuse if needed
window.sendAdminEvent = sendEvent;