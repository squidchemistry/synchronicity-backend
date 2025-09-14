// User types
export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    currency: string;
    notifications: boolean;
  };
  portfolio: {
    totalValue: number;
    lastUpdated: string;
  };
  joinedServers: string[];
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Cryptocurrency types
export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  fullyDilutedValuation?: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage1h?: number;
  priceChangePercentage7d?: number;
  marketCapChange24h: number;
  marketCapChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  maxSupply?: number;
  ath: number;
  athChangePercentage: number;
  athDate: string;
  atl: number;
  atlChangePercentage: number;
  atlDate: string;
  sparklineIn7d?: {
    price: number[];
  };
  lastUpdated: string;
}

export interface CoinDetails extends CryptoCoin {
  description?: string;
  links?: {
    homepage?: string;
    blockchain_site?: string[];
    official_forum_url?: string[];
    chat_url?: string[];
    announcement_url?: string[];
    twitter_screen_name?: string;
    facebook_username?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
  };
  marketData?: any;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank?: number;
  priceChange24h?: number;
}

export interface GlobalMarketData {
  activeCryptocurrencies: number;
  upcomingIcos: number;
  ongoingIcos: number;
  endedIcos: number;
  markets: number;
  totalMarketCap: Record<string, number>;
  totalVolume: Record<string, number>;
  marketCapPercentage: Record<string, number>;
  marketCapChangePercentage24hUsd: number;
  updatedAt: number;
}

// Portfolio types
export interface PortfolioItem {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  lastUpdated: string;
}

export interface Portfolio {
  _id: string;
  userId: string;
  items: PortfolioItem[];
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  itemCount: number;
  topPerformers: Array<{
    coinId: string;
    symbol: string;
    name: string;
    profitLossPercentage: number;
    profitLoss: number;
  }>;
  worstPerformers: Array<{
    coinId: string;
    symbol: string;
    name: string;
    profitLossPercentage: number;
    profitLoss: number;
  }>;
  allocation: Array<{
    coinId: string;
    symbol: string;
    name: string;
    percentage: number;
    value: number;
  }>;
  lastUpdated: string;
}

// AI types
export interface AIResponse {
  response: string;
  timestamp: string;
}

export interface MarketAnalysis {
  analysis: string;
  marketData: Array<{
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    change7d: number;
    marketCap: number;
    volume: number;
  }>;
  timestamp: string;
}

export interface PortfolioAnalysisResponse {
  analysis: string;
  recommendations: string[];
  portfolioMetrics: {
    totalValue: number;
    totalProfitLoss: number;
    profitLossPercentage: number;
    diversificationScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  timestamp: string;
}

export interface TradingSignals {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  signals: string;
  technicalData: {
    currentPrice: number;
    change24h: number;
    change7d: number;
    change30d: number;
    volume24h: number;
    marketCap: number;
    volatility30d: string;
  };
  timestamp: string;
  disclaimer: string;
}

// Chat/Community types
export interface Message {
  _id: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'announcement';
  messages: Message[];
  createdAt: string;
}

export interface Server {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string | User;
  members: string[] | User[];
  channels: Channel[];
  isPublic: boolean;
  tags: string[];
  memberCount?: number;
  channelCount?: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Chart data types
export interface PriceData {
  timestamp: number;
  price: number;
}

export interface ChartData {
  prices: [number, number][];
  marketCaps: [number, number][];
  totalVolumes: [number, number][];
}

// Socket types
export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  
  // Server events
  join_server: (serverId: string) => void;
  leave_server: (serverId: string) => void;
  joined_server: (data: { serverId: string; serverName: string }) => void;
  left_server: (data: { serverId: string }) => void;
  
  // Channel events
  join_channel: (data: { serverId: string; channelId: string }) => void;
  leave_channel: (channelId: string) => void;
  joined_channel: (data: { serverId: string; channelId: string; channelName: string }) => void;
  left_channel: (data: { channelId: string }) => void;
  
  // Message events
  send_message: (data: { serverId: string; channelId: string; content: string; type?: string }) => void;
  new_message: (data: { serverId: string; channelId: string; message: Message }) => void;
  edit_message: (data: { serverId: string; channelId: string; messageId: string; content: string }) => void;
  message_edited: (data: { serverId: string; channelId: string; messageId: string; content: string; edited: boolean; editedAt: string }) => void;
  delete_message: (data: { serverId: string; channelId: string; messageId: string }) => void;
  message_deleted: (data: { serverId: string; channelId: string; messageId: string }) => void;
  
  // Typing events
  typing_start: (data: { channelId: string }) => void;
  typing_stop: (data: { channelId: string }) => void;
  user_typing_start: (data: { userId: string; username: string; channelId: string }) => void;
  user_typing_stop: (data: { userId: string; username: string; channelId: string }) => void;
  
  // Crypto events
  subscribe_crypto_prices: (coinIds: string[]) => void;
  unsubscribe_crypto_prices: (coinIds: string[]) => void;
  crypto_price_update: (data: { coinId: string; price: number; change24h: number; timestamp: string }) => void;
  
  // Error events
  error: (data: { message: string }) => void;
}

// Theme types
export type Theme = 'light' | 'dark';

// Route types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  protected?: boolean;
  title?: string;
}