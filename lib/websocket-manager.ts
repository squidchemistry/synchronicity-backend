import { EventEmitter } from "events"

// WebSocket manager class to handle connections with crypto exchanges
export class WebSocketManager extends EventEmitter {
  private socket: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout = 5000
  private reconnectTimer: NodeJS.Timeout | null = null
  private subscriptions: Set<string> = new Set()
  private isConnected = false

  constructor(url: string) {
    super()
    this.url = url
  }

  // Connect to WebSocket server
  public connect(): void {
    if (this.socket) {
      this.disconnect()
    }

    try {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onerror = this.handleError.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
    } catch (error) {
      console.error("WebSocket connection error:", error)
      this.attemptReconnect()
    }
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onerror = null
      this.socket.onclose = null

      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close()
      }

      this.socket = null
    }

    this.isConnected = false
  }

  // Subscribe to a channel
  public subscribe(channel: string, params: any = {}): void {
    const subscriptionKey = this.getSubscriptionKey(channel, params)

    if (this.subscriptions.has(subscriptionKey)) {
      return
    }

    this.subscriptions.add(subscriptionKey)

    if (this.isConnected) {
      this.sendSubscription(channel, params)
    }
  }

  // Unsubscribe from a channel
  public unsubscribe(channel: string, params: any = {}): void {
    const subscriptionKey = this.getSubscriptionKey(channel, params)

    if (!this.subscriptions.has(subscriptionKey)) {
      return
    }

    this.subscriptions.delete(subscriptionKey)

    if (this.isConnected) {
      this.sendUnsubscription(channel, params)
    }
  }

  // Send a message to the WebSocket server
  public send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  // Handle WebSocket open event
  private handleOpen(): void {
    console.log("WebSocket connected")
    this.isConnected = true
    this.reconnectAttempts = 0
    this.emit("connected")

    // Resubscribe to all channels
    this.resubscribeAll()
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      this.emit("message", data)

      // Emit specific events based on the message type
      if (data.type) {
        this.emit(data.type, data)
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  // Handle WebSocket error event
  private handleError(error: Event): void {
    console.error("WebSocket error:", error)
    this.emit("error", error)
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`)
    this.isConnected = false
    this.emit("disconnected", event)

    // Attempt to reconnect
    this.attemptReconnect()
  }

  // Attempt to reconnect to WebSocket server
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached")
      this.emit("reconnect_failed")
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.reconnectTimeout)

    this.emit("reconnecting", this.reconnectAttempts)
  }

  // Resubscribe to all channels
  private resubscribeAll(): void {
    for (const subscriptionKey of this.subscriptions) {
      const { channel, params } = this.parseSubscriptionKey(subscriptionKey)
      this.sendSubscription(channel, params)
    }
  }

  // Send subscription message
  private sendSubscription(channel: string, params: any): void {
    this.send({
      method: "SUBSCRIBE",
      params: [channel, params],
      id: Date.now(),
    })
  }

  // Send unsubscription message
  private sendUnsubscription(channel: string, params: any): void {
    this.send({
      method: "UNSUBSCRIBE",
      params: [channel, params],
      id: Date.now(),
    })
  }

  // Get subscription key
  private getSubscriptionKey(channel: string, params: any): string {
    return `${channel}:${JSON.stringify(params)}`
  }

  // Parse subscription key
  private parseSubscriptionKey(key: string): { channel: string; params: any } {
    const [channel, paramsStr] = key.split(":")
    return {
      channel,
      params: JSON.parse(paramsStr),
    }
  }
}

// Create exchange-specific WebSocket managers
export function createBinanceWebSocketManager(): WebSocketManager {
  return new WebSocketManager("wss://stream.binance.com:9443/ws")
}

export function createCoinbaseWebSocketManager(): WebSocketManager {
  return new WebSocketManager("wss://ws-feed.pro.coinbase.com")
}

