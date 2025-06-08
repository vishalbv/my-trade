const WEBSOCKET_URL = "wss://socket.india.delta.exchange";

interface WebSocketMessage {
  type: string;
  payload: {
    channels: {
      name: string;
      symbols: string[];
    }[];
  };
}

class DeltaWebSocket {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(WEBSOCKET_URL);

      this.ws.onopen = () => {
        console.log("Delta WebSocket Connected");
        this.reconnectAttempts = 0;
        this.resubscribe();
      };

      this.ws.onclose = (event) => {
        console.log("Delta WebSocket Closed:", event.code, event.reason);
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("Delta WebSocket Error:", error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(
        () => this.connect(),
        this.reconnectDelay * this.reconnectAttempts
      );
    }
  }

  private resubscribe() {
    // Resubscribe to all active channels
    for (const [channel] of this.subscriptions) {
      const [channelName, symbol] = channel.split(":");
      this.subscribe(channelName, [symbol]);
    }
  }

  private handleMessage(data: any) {
    if (data.type === "candlestick_15m") {
      const channel = `${data.type}:${data.symbol}`;
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        handlers.forEach((handler) => handler(data));
      }
    }
  }

  public subscribe(channel: string, symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      setTimeout(() => this.subscribe(channel, symbols), 1000);
      return;
    }

    const message: WebSocketMessage = {
      type: "subscribe",
      payload: {
        channels: [
          {
            name: channel,
            symbols: symbols,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  public addChannelHandler(
    channel: string,
    symbol: string,
    handler: (data: any) => void
  ) {
    const key = `${channel}:${symbol}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)?.add(handler);
  }

  public removeChannelHandler(
    channel: string,
    symbol: string,
    handler: (data: any) => void
  ) {
    const key = `${channel}:${symbol}`;
    this.subscriptions.get(key)?.delete(handler);
    if (this.subscriptions.get(key)?.size === 0) {
      this.subscriptions.delete(key);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const deltaWebSocket = new DeltaWebSocket();
