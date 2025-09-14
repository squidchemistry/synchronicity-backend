import mongoose, { Document, Schema } from 'mongoose';

export interface IPortfolioItem {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  lastUpdated: Date;
}

export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId;
  items: IPortfolioItem[];
  totalValue: number;
  totalInvestment: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema = new Schema<IPortfolioItem>({
  coinId: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  averageBuyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const PortfolioSchema = new Schema<IPortfolio>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [PortfolioItemSchema],
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInvestment: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfitLoss: {
    type: Number,
    default: 0
  },
  totalProfitLossPercentage: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate portfolio totals before saving
PortfolioSchema.pre('save', function(next) {
  this.totalValue = this.items.reduce((sum, item) => sum + item.totalValue, 0);
  this.totalInvestment = this.items.reduce((sum, item) => sum + (item.amount * item.averageBuyPrice), 0);
  this.totalProfitLoss = this.totalValue - this.totalInvestment;
  this.totalProfitLossPercentage = this.totalInvestment > 0 
    ? (this.totalProfitLoss / this.totalInvestment) * 100 
    : 0;
  this.lastUpdated = new Date();
  next();
});

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);