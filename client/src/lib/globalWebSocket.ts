/**
 * Global WebSocket singleton for maintaining a persistent WebSocket connection
 * throughout the application lifecycle.
 */

// Handle WebSocket connections
let socket: WebSocket | null = null;
let isConnected = false;
let isConnecting = false;
let adminId = 1;
let pingInterval: NodeJS.Timeout | null = null;
const PING_INTERVAL_MS = 15000;
const RECONNECT_DELAY_MS = 5000;

// Event listeners
const messageListeners: Array<(event: MessageEvent) => void> = [];
const statusChangeListeners: Array<(status: boolean) => void> = [];

/**
 * Initialize the WebSocket connection
 */
export function initWebSocket(): WebSocket | null {
  if (isConnecting) return socket;
  
  isConnecting = true;
  
  try {
    // Close existing connection if any
    if (socket) {
      try {
        clearPingInterval();
        socket.close();
      } catch (error) {
        console.error('Error closing existing WebSocket:', error);
      }
    }
    
    // Create new connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      isConnected = true;
      isConnecting = false;
      
      // Register as admin
      sendMessage('register', {
        id: adminId,
        role: 'admin'
      });
      
      // Start ping interval
      startPingInterval();
      
      // Notify listeners
      notifyStatusChange(true);
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      isConnected = false;
      isConnecting = false;
      clearPingInterval();
      
      // Notify listeners
      notifyStatusChange(false);
      
      // Auto-reconnect after delay if not hidden
      if (document.visibilityState !== 'hidden') {
        setTimeout(() => {
          initWebSocket();
        }, RECONNECT_DELAY_MS);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnecting = false;
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        // Forward message to all listeners
        notifyMessageListeners(event);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
    
    return socket;
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    isConnecting = false;
    return null;
  }
}

/**
 * Get the current WebSocket instance, creating one if it doesn't exist
 */
export function getWebSocket(): WebSocket | null {
  if (!socket || socket.readyState > WebSocket.OPEN) {
    return initWebSocket();
  }
  return socket;
}

/**
 * Send a message through the WebSocket
 */
export function sendMessage(type: string, data: any = {}): boolean {
  const ws = getWebSocket();
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected, cannot send message');
    return false;
  }
  
  try {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    ws.send(message);
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
}

/**
 * Set the admin ID for registration
 */
export function setAdminId(id: number): void {
  adminId = id;
  
  // Re-register with new ID if connected
  if (isConnected) {
    sendMessage('register', {
      id: adminId,
      role: 'admin'
    });
  }
}

/**
 * Start ping interval to keep connection alive
 */
function startPingInterval(): void {
  clearPingInterval();
  
  pingInterval = setInterval(() => {
    sendMessage('ping', { id: adminId });
  }, PING_INTERVAL_MS);
}

/**
 * Clear the ping interval
 */
function clearPingInterval(): void {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

/**
 * Add a message listener
 */
export function addMessageListener(listener: (event: MessageEvent) => void): void {
  messageListeners.push(listener);
}

/**
 * Remove a message listener
 */
export function removeMessageListener(listener: (event: MessageEvent) => void): void {
  const index = messageListeners.indexOf(listener);
  if (index !== -1) {
    messageListeners.splice(index, 1);
  }
}

/**
 * Add a status change listener
 */
export function addStatusChangeListener(listener: (status: boolean) => void): void {
  statusChangeListeners.push(listener);
  
  // Immediately notify with current status
  listener(isConnected);
}

/**
 * Remove a status change listener
 */
export function removeStatusChangeListener(listener: (status: boolean) => void): void {
  const index = statusChangeListeners.indexOf(listener);
  if (index !== -1) {
    statusChangeListeners.splice(index, 1);
  }
}

/**
 * Notify all message listeners
 */
function notifyMessageListeners(event: MessageEvent): void {
  messageListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in WebSocket message listener:', error);
    }
  });
}

/**
 * Notify all status change listeners
 */
function notifyStatusChange(status: boolean): void {
  statusChangeListeners.forEach(listener => {
    try {
      listener(status);
    } catch (error) {
      console.error('Error in WebSocket status change listener:', error);
    }
  });
}

// Initialize WebSocket on module load
if (typeof window !== 'undefined') {
  // Add visibility change handler to reconnect when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && (!socket || socket.readyState !== WebSocket.OPEN)) {
      console.log('Tab visible, reconnecting WebSocket');
      initWebSocket();
    }
  });
  
  // Initialize connection
  initWebSocket();
}

export default {
  initWebSocket,
  getWebSocket,
  sendMessage,
  setAdminId,
  addMessageListener,
  removeMessageListener,
  addStatusChangeListener,
  removeStatusChangeListener,
};