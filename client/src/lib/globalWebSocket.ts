// Global WebSocket singleton for the entire application

let wsInstance: WebSocket | null = null;
let wsConnected = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let listeners: Array<(connected: boolean) => void> = [];

// Connect to WebSocket
export function connectWebSocket() {
  try {
    // If already connected, don't do anything
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Clean up existing connection if not already closed
    if (wsInstance && wsInstance.readyState !== WebSocket.CLOSED) {
      wsInstance.close();
    }
    
    // Cancel any pending reconnect
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Setup new connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`[GlobalWebSocket] Connecting to ${wsUrl}...`);
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('[GlobalWebSocket] Connected');
      wsConnected = true;
      
      // Register as admin
      socket.send(JSON.stringify({
        type: 'register',
        data: {
          id: 1,
          role: 'admin'
        },
        timestamp: new Date().toISOString()
      }));
      
      // Notify all listeners
      notifyListeners();
    };
    
    socket.onclose = (event) => {
      console.log(`[GlobalWebSocket] Disconnected (code: ${event.code})`, event);
      wsConnected = false;
      
      // Notify all listeners
      notifyListeners();
      
      // Auto-reconnect after delay
      reconnectTimer = setTimeout(() => {
        console.log('[GlobalWebSocket] Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
    };
    
    socket.onerror = (error) => {
      console.error('[GlobalWebSocket] Error:', error);
    };
    
    socket.onmessage = (event) => {
      console.log('[GlobalWebSocket] Message received:', event.data);
      // Handle messages as needed
    };
    
    wsInstance = socket;
  } catch (error) {
    console.error('[GlobalWebSocket] Error setting up WebSocket:', error);
    wsConnected = false;
    
    // Notify all listeners
    notifyListeners();
    
    // Retry after error
    reconnectTimer = setTimeout(() => {
      connectWebSocket();
    }, 5000);
  }
}

// Send a message through the WebSocket
export function sendWebSocketMessage(type: string, data: any) {
  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
    console.error('[GlobalWebSocket] Cannot send message, not connected');
    return false;
  }
  
  try {
    wsInstance.send(JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString()
    }));
    return true;
  } catch (error) {
    console.error('[GlobalWebSocket] Error sending message:', error);
    return false;
  }
}

// Subscribe to connection status changes
export function subscribeToWebSocket(callback: (connected: boolean) => void): () => void {
  listeners.push(callback);
  
  // Immediately notify with current status
  callback(wsConnected);
  
  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

// Notify all listeners of connection status
function notifyListeners() {
  listeners.forEach(callback => {
    try {
      callback(wsConnected);
    } catch (error) {
      console.error('[GlobalWebSocket] Error in listener callback:', error);
    }
  });
}

// Get current connection status
export function isWebSocketConnected(): boolean {
  return wsConnected;
}

// Initialize connection
connectWebSocket();