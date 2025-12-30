// WebSocket client with auto-reconnection for Orbit backend

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WebSocketClientOptions {
  url: string;
  onMessage: (data: unknown) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: (data: unknown) => void;
  private onStatusChange: (status: ConnectionStatus) => void;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose: boolean = false;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.onMessage = options.onMessage;
    this.onStatusChange = options.onStatusChange;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.intentionalClose = false;
    this.onStatusChange('connecting');
    console.log(`[WebSocket] Connecting to ${this.url}...`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] Closed (code: ${event.code})`);
        this.ws = null;
        
        if (!this.intentionalClose) {
          this.onStatusChange('disconnected');
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.onStatusChange('error');
      };
    } catch (error) {
      console.error('[WebSocket] Failed to create connection:', error);
      this.onStatusChange('error');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached');
      this.onStatusChange('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.onStatusChange('disconnected');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getStatus(): ConnectionStatus {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }
}

// Singleton instance for the app
let clientInstance: WebSocketClient | null = null;

export function getWebSocketClient(
  onMessage: (data: unknown) => void,
  onStatusChange: (status: ConnectionStatus) => void
): WebSocketClient {
  const url = import.meta.env.VITE_TERMINAL_WS_URL || 'ws://127.0.0.1:3001';
  
  if (!clientInstance) {
    clientInstance = new WebSocketClient({
      url,
      onMessage,
      onStatusChange,
    });
  }
  
  return clientInstance;
}

export function disconnectWebSocket(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

