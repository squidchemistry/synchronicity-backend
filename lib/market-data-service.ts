import { type WebSocketManager, createBinanceWebSocketManager } from "./websocket-manager"
import { EventEmitter } from "events"

// Market data types
export interface Ticker {
  symbol: string
  price: number
  priceChange: number
  priceChangePercent: number
  high: number
  low: number
  volume: number
  quoteVolume: number
  timestamp: number
}

export interface Trade {
  symbol: string
  id: string
  price: number
  quantity: number
  side: "buy" | "sell"
  timestamp: number
}

export interface OrderBook {
  symbol: string
  bids: [number, number][] // [price, quantity]
  asks: [number, number][] // [price, quantity]
  timestamp: number
}

// Market data service class
export class MarketDataService extends EventEmitter {
  private wsManager: WebSocketManager
  private tickers: Map<string, Ticker> = new Map()
  private trades: Map<string, Trade[]> = new Map()
  private orderBooks: Map<string, OrderBook> = new Map()
  private maxTradesPerSymbol = 100

  constructor(wsManager: WebSocketManager) {
    super()
    this.wsManager = wsManager
    this.setupEventListeners()
  }

  // Initialize the service
  public init(): void {
    this.wsManager.connect()
  }

  // Subscribe to ticker updates for a symbol
  public subscribeTicker(symbol: string): void {
    this.wsManager.subscribe(`${symbol.toLowerCase()}@ticker`)
  }

  // Subscribe to trade updates for a symbol
  public subscribeTrades(symbol: string): void {
    this.wsManager.subscribe(`${symbol.toLowerCase()}@trade`)
  }

  // Subscribe to order book updates for a symbol
  public subscribeOrderBook(symbol: string): void {
    this.wsManager.subscribe(`${symbol.toLowerCase()}@depth20`)
  }

  // Unsubscribe from ticker updates for a symbol
  public unsubscribeTicker(symbol: string): void {
    this.wsManager.unsubscribe(`${symbol.toLowerCase()}@ticker`)
  }

  // Unsubscribe from trade updates for a symbol
  public unsubscribeTrades(symbol: string): void {
    this.wsManager.unsubscribe(`${symbol.toLowerCase()}@trade`)
  }

  // Unsubscribe from order book updates for a symbol
  public unsubscribeOrderBook(symbol: string): void {
    this.wsManager.unsubscribe(`${symbol.toLowerCase()}@depth20`)
  }

  // Get ticker for a symbol
  public getTicker(symbol: string): Ticker | undefined {
    return this.tickers.get(symbol)
  }

  // Get all tickers
  public getAllTickers(): Map<string, Ticker> {
    return this.tickers
  }

  // Get trades for a symbol
  public getTrades(symbol: string): Trade[] {
    return this.trades.get(symbol) || []
  }

  // Get order book for a symbol
  public getOrderBook(symbol: string): OrderBook | undefined {
    return this.orderBooks.get(symbol)
  }

  // Setup WebSocket event listeners
  private setupEventListeners(): void {
    this.wsManager.on("message", (data) => {
      if (data.e === "24hrTicker") {
        this.handleTickerUpdate(data)
      } else if (data.e === "trade") {
        this.handleTradeUpdate(data)
      } else if (data.e === "depthUpdate") {
        this.handleOrderBookUpdate(data)
      }
    })

    this.wsManager.on("connected", () => {
      this.emit("connected")
    })

    this.wsManager.on("disconnected", () => {
      this.emit("disconnected")
    })

    this.wsManager.on("error", (error) => {
      this.emit("error", error)
    })
  }

  // Handle ticker update
  private handleTickerUpdate(data: any): void {
    const ticker: Ticker = {
      symbol: data.s,
      price: Number.parseFloat(data.c),
      priceChange: Number.parseFloat(data.p),
      priceChangePercent: Number.parseFloat(data.P),
      high: Number.parseFloat(data.h),
      low: Number.parseFloat(data.l),
      volume: Number.parseFloat(data.v),
      quoteVolume: Number.parseFloat(data.q),
      timestamp: data.E,
    }

    this.tickers.set(data.s, ticker)
    this.emit("ticker", ticker)
  }

  // Handle trade update
  private handleTradeUpdate(data: any): void {
    const trade: Trade = {
      symbol: data.s,
      id: data.t,
      price: Number.parseFloat(data.p),
      quantity: Number.parseFloat(data.q),
      side: data.m ? "sell" : "buy",
      timestamp: data.E,
    }

    const trades = this.trades.get(data.s) || []
    trades.unshift(trade)

    // Limit the number of trades stored
    if (trades.length > this.maxTradesPerSymbol) {
      trades.pop()
    }

    this.trades.set(data.s, trades)
    this.emit("trade", trade)
  }

  // Handle order book update
  private handleOrderBookUpdate(data: any): void {
    const orderBook = this.orderBooks.get(data.s) || {
      symbol: data.s,
      bids: [],
      asks: [],
      timestamp: data.E,
    }

    // Update bids
    data.b.forEach((bid: [string, string]) => {
      const price = Number.parseFloat(bid[0])
      const quantity = Number.parseFloat(bid[1])

      // Remove price level if quantity is 0
      if (quantity === 0) {
        orderBook.bids = orderBook.bids.filter(([p]) => p !== price)
      } else {
        // Update or add price level
        const index = orderBook.bids.findIndex(([p]) => p === price)
        if (index !== -1) {
          orderBook.bids[index] = [price, quantity]
        } else {
          orderBook.bids.push([price, quantity])
        }
      }
    })

    // Update asks
    data.a.forEach((ask: [string, string]) => {
      const price = Number.parseFloat(ask[0])
      const quantity = Number.parseFloat(ask[1])

      // Remove price level if quantity is 0
      if (quantity === 0) {
        orderBook.asks = orderBook.asks.filter(([p]) => p !== price)
      } else {
        // Update or add price level
        const index = orderBook.asks.findIndex(([p]) => p === price)
        if (index !== -1) {
          orderBook.asks[index] = [price, quantity]
        } else {
          orderBook.asks.push([price, quantity])
        }
      }
    })

    // Sort bids (descending) and asks (ascending)
    orderBook.bids.sort((a, b) => b[0] - a[0])
    orderBook.asks.sort((a, b) => a[0] - b[0])

    orderBook.timestamp = data.E
    this.orderBooks.set(data.s, orderBook)
    this.emit("orderBook", orderBook)
  }
}

// Create a market data service instance
export function createMarketDataService(): MarketDataService {
  const wsManager = createBinanceWebSocketManager()
  return new MarketDataService(wsManager)
}

