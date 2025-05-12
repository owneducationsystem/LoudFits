/**
 * Global WebSocket Service
 * 
 * This service maintains a single WebSocket connection that can be shared
 * across the entire application. It handles:
 * - Connection establishment and reconnection
 * - Registration with the server
 * - Emitting events for subscribers
 * - Periodic keep-alive pings
 */

import { EventEmitter } from 'events';

// Custom WebSocket interface with additional properties
export interface EnhancedWebSocket extends WebSocket {
  pingInterval?: NodeJS.Timeout;
  reconnectTimeout?: NodeJS.Timeout;
}

export interface WebSocketOptions {
  reconnectInterval?: number;
  pingInterval?: number;
  debug?: boolean;
}

// Create a custom event emitter interface
export interface WebSocketEvents {
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;
  on(event: 'registered', listener: (clientId: string) => void): this;
  on(event: 'message', listener: (data: any) => void): this;
  on(event: 'error', listener: (error: any) => void): this;
  on(event: string, listener: Function): this;
  
  emit(event: 'connected'): boolean;
  emit(event: 'disconnected'): boolean;
  emit(event: 'registered', clientId: string): boolean;
  emit(event: 'message', data: any): boolean;
  emit(event: 'error', error: any): boolean;
  emit(event: string, ...args: any[]): boolean;
  
  // Additional methods needed for cleanup
  removeListener(event: 'connected', listener: Function): this;
  removeListener(event: 'disconnected', listener: Function): this;
  removeListener(event: 'registered', listener: Function): this;
  removeListener(event: 'message', listener: Function): this;
  removeListener(event: 'error', listener: Function): this;
  removeListener(event: string, listener: Function): this;
  
  removeAllListeners(event?: string): this;
}

class GlobalWebSocketService {
  private socket: EnhancedWebSocket | null = null;
  private connected: boolean = false;
  private registered: boolean = false;
  private registrationData: any = null;
  private reconnectAttempts: number = 0;
  private events: WebSocketEvents = new EventEmitter() as WebSocketEvents;
  private options: Required<WebSocketOptions> = {
    reconnectInterval: 3000,
    pingInterval: 30000,
    debug: false
  };

  /**
   * Initialize the WebSocket service
   */
  constructor() {
    // Default options
    this.log('WebSocket service initialized');
  }

  /**
   * Configure service options
   */
  configure(options: WebSocketOptions): this {
    this.options = { ...this.options, ...options };
    this.log('WebSocket service configured', this.options);
    return this;
  }

  /**
   * Get event emitter for subscribing to events
   */
  getEventEmitter(): WebSocketEvents {
    return this.events;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): this {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      this.log('WebSocket already connected or connecting');
      return this;
    }

    // Clear any existing reconnect timeout
    if (this.socket?.reconnectTimeout) {
      clearTimeout(this.socket.reconnectTimeout);
      this.socket.reconnectTimeout = undefined;
    }

    // Clear any existing ping interval
    if (this.socket?.pingInterval) {
      clearInterval(this.socket.pingInterval);
      this.socket.pingInterval = undefined;
    }

    try {
      // Determine WebSocket URL (secure if page is secure)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket
      const socket = new WebSocket(wsUrl) as EnhancedWebSocket;
      this.socket = socket;
      
      // Connection opened
      socket.addEventListener('open', () => {
        this.log('WebSocket connection established');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.events.emit('connected');
        
        // If we have registration data, register immediately
        if (this.registrationData) {
          this.register(this.registrationData);
        }
        
        // Setup ping interval
        socket.pingInterval = setInterval(() => {
          this.sendPing();
        }, this.options.pingInterval);
      });
      
      // Connection closed
      socket.addEventListener('close', (event) => {
        this.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.handleDisconnect();
      });
      
      // Connection error
      socket.addEventListener('error', (error) => {
        this.log('WebSocket error:', error);
        this.events.emit('error', error);
        // The close event will be fired after an error
      });
      
      // Message received
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.log('WebSocket message received:', data);
          
          // Handle registration confirmation
          if (data.type === 'registered') {
            this.registered = true;
            const clientId = data.data?.clientId || 'unknown';
            this.log(`Registered with ID: ${clientId}`);
            this.events.emit('registered', clientId);
          }
          
          // Emit message event for subscribers
          this.events.emit('message', data);
        } catch (error) {
          this.log('Error parsing WebSocket message:', error);
          this.events.emit('error', error);
        }
      });

      return this;
    } catch (error) {
      this.log('Error connecting to WebSocket:', error);
      this.events.emit('error', error);
      this.handleDisconnect();
      return this;
    }
  }

  /**
   * Register with the WebSocket server
   */
  register(data: any): this {
    this.registrationData = data;
    
    if (this.isConnected()) {
      this.log('Registering with WebSocket server', data);
      this.send('register', data);
    } else {
      this.log('Not connected, registration data saved for when connection is established');
    }
    
    return this;
  }

  /**
   * Send a ping to keep the connection alive
   */
  private sendPing(): void {
    if (this.isConnected()) {
      this.log('Sending ping');
      this.send('ping', { timestamp: new Date().toISOString() });
    }
  }

  /**
   * Handle disconnection and reconnection
   */
  private handleDisconnect(): void {
    this.connected = false;
    this.registered = false;
    
    // Clear ping interval
    if (this.socket?.pingInterval) {
      clearInterval(this.socket.pingInterval);
      this.socket.pingInterval = undefined;
    }
    
    this.events.emit('disconnected');
    
    // Calculate reconnect delay with exponential backoff
    const maxReconnectInterval = 30000; // 30 seconds max
    const reconnectDelay = Math.min(
      this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts),
      maxReconnectInterval
    );
    
    this.reconnectAttempts++;
    this.log(`Scheduling reconnect in ${reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    // Schedule reconnect
    if (this.socket) {
      this.socket.reconnectTimeout = setTimeout(() => {
        this.log('Attempting to reconnect...');
        this.connect();
      }, reconnectDelay);
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  send(type: string, data?: any): boolean {
    if (!this.isConnected()) {
      this.log('Cannot send message, not connected');
      return false;
    }
    
    try {
      const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      });
      
      this.socket!.send(message);
      this.log(`Sent message type: ${type}`, data);
      return true;
    } catch (error) {
      this.log('Error sending WebSocket message:', error);
      this.events.emit('error', error);
      return false;
    }
  }

  /**
   * Check if connected to the WebSocket server
   */
  isConnected(): boolean {
    return this.connected && !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Check if registered with the WebSocket server
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.socket) {
      // Clear intervals and timeouts
      if (this.socket.pingInterval) {
        clearInterval(this.socket.pingInterval);
        this.socket.pingInterval = undefined;
      }
      
      if (this.socket.reconnectTimeout) {
        clearTimeout(this.socket.reconnectTimeout);
        this.socket.reconnectTimeout = undefined;
      }
      
      // Close socket
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    this.connected = false;
    this.registered = false;
    this.log('WebSocket disconnected');
  }

  /**
   * Log messages if debug is enabled
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.debug) {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  }
}

// Create a singleton instance
export const globalWebSocket = new GlobalWebSocketService();

export default globalWebSocket;