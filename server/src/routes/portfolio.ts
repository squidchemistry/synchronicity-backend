import express from 'express';
import axios from 'axios';
import { body, validationResult } from 'express-validator';
import { Portfolio, IPortfolioItem } from '../models/Portfolio';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = express.Router();

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Get user's portfolio
router.get('/', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  let portfolio = await Portfolio.findOne({ userId: req.user!._id });

  if (!portfolio) {
    portfolio = new Portfolio({
      userId: req.user!._id,
      items: []
    });
    await portfolio.save();
  }

  res.json({ portfolio });
}));

// Add coin to portfolio
router.post('/add', [
  body('coinId').notEmpty().withMessage('Coin ID is required'),
  body('symbol').notEmpty().withMessage('Symbol is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('averageBuyPrice').isFloat({ min: 0 }).withMessage('Average buy price must be a positive number')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { coinId, symbol, name, amount, averageBuyPrice } = req.body;

  // Get current price from CoinGecko
  let currentPrice = 0;
  try {
    const priceResponse = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: 'usd'
      }
    });
    currentPrice = priceResponse.data[coinId]?.usd || 0;
  } catch (error) {
    console.warn('Failed to fetch current price for', coinId);
  }

  let portfolio = await Portfolio.findOne({ userId: req.user!._id });

  if (!portfolio) {
    portfolio = new Portfolio({
      userId: req.user!._id,
      items: []
    });
  }

  // Check if coin already exists in portfolio
  const existingItemIndex = portfolio.items.findIndex(item => item.coinId === coinId);

  if (existingItemIndex >= 0) {
    // Update existing item (average the buy price)
    const existingItem = portfolio.items[existingItemIndex];
    const totalAmount = existingItem.amount + amount;
    const totalInvestment = (existingItem.amount * existingItem.averageBuyPrice) + (amount * averageBuyPrice);
    
    existingItem.amount = totalAmount;
    existingItem.averageBuyPrice = totalInvestment / totalAmount;
    existingItem.currentPrice = currentPrice;
    existingItem.totalValue = totalAmount * currentPrice;
    existingItem.profitLoss = existingItem.totalValue - (totalAmount * existingItem.averageBuyPrice);
    existingItem.profitLossPercentage = existingItem.averageBuyPrice > 0 
      ? (existingItem.profitLoss / (totalAmount * existingItem.averageBuyPrice)) * 100 
      : 0;
    existingItem.lastUpdated = new Date();
  } else {
    // Add new item
    const totalValue = amount * currentPrice;
    const profitLoss = totalValue - (amount * averageBuyPrice);
    const profitLossPercentage = averageBuyPrice > 0 ? (profitLoss / (amount * averageBuyPrice)) * 100 : 0;

    const newItem: IPortfolioItem = {
      coinId,
      symbol: symbol.toUpperCase(),
      name,
      amount,
      averageBuyPrice,
      currentPrice,
      totalValue,
      profitLoss,
      profitLossPercentage,
      lastUpdated: new Date()
    };

    portfolio.items.push(newItem);
  }

  await portfolio.save();

  res.json({
    message: 'Coin added to portfolio successfully',
    portfolio
  });
}));

// Update portfolio item
router.put('/update/:coinId', [
  body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('averageBuyPrice').optional().isFloat({ min: 0 }).withMessage('Average buy price must be a positive number')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { coinId } = req.params;
  const { amount, averageBuyPrice } = req.body;

  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  if (!portfolio) {
    throw createError('Portfolio not found', 404);
  }

  const itemIndex = portfolio.items.findIndex(item => item.coinId === coinId);
  if (itemIndex === -1) {
    throw createError('Coin not found in portfolio', 404);
  }

  const item = portfolio.items[itemIndex];

  // Update fields if provided
  if (amount !== undefined) item.amount = amount;
  if (averageBuyPrice !== undefined) item.averageBuyPrice = averageBuyPrice;

  // Recalculate values
  item.totalValue = item.amount * item.currentPrice;
  item.profitLoss = item.totalValue - (item.amount * item.averageBuyPrice);
  item.profitLossPercentage = item.averageBuyPrice > 0 
    ? (item.profitLoss / (item.amount * item.averageBuyPrice)) * 100 
    : 0;
  item.lastUpdated = new Date();

  await portfolio.save();

  res.json({
    message: 'Portfolio item updated successfully',
    portfolio
  });
}));

// Remove coin from portfolio
router.delete('/remove/:coinId', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { coinId } = req.params;

  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  if (!portfolio) {
    throw createError('Portfolio not found', 404);
  }

  const itemIndex = portfolio.items.findIndex(item => item.coinId === coinId);
  if (itemIndex === -1) {
    throw createError('Coin not found in portfolio', 404);
  }

  portfolio.items.splice(itemIndex, 1);
  await portfolio.save();

  res.json({
    message: 'Coin removed from portfolio successfully',
    portfolio
  });
}));

// Refresh portfolio prices
router.post('/refresh', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  if (!portfolio) {
    throw createError('Portfolio not found', 404);
  }

  if (portfolio.items.length === 0) {
    return res.json({
      message: 'Portfolio is empty',
      portfolio
    });
  }

  // Get all coin IDs
  const coinIds = portfolio.items.map(item => item.coinId).join(',');

  try {
    // Fetch current prices
    const priceResponse = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
      params: {
        ids: coinIds,
        vs_currencies: 'usd'
      }
    });

    // Update each item
    portfolio.items.forEach(item => {
      const currentPrice = priceResponse.data[item.coinId]?.usd || item.currentPrice;
      item.currentPrice = currentPrice;
      item.totalValue = item.amount * currentPrice;
      item.profitLoss = item.totalValue - (item.amount * item.averageBuyPrice);
      item.profitLossPercentage = item.averageBuyPrice > 0 
        ? (item.profitLoss / (item.amount * item.averageBuyPrice)) * 100 
        : 0;
      item.lastUpdated = new Date();
    });

    await portfolio.save();

    res.json({
      message: 'Portfolio refreshed successfully',
      portfolio
    });

  } catch (error) {
    console.error('Failed to refresh portfolio prices:', error);
    throw createError('Failed to refresh portfolio prices', 500);
  }
}));

// Get portfolio analytics
router.get('/analytics', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  if (!portfolio) {
    throw createError('Portfolio not found', 404);
  }

  const analytics = {
    totalValue: portfolio.totalValue,
    totalInvestment: portfolio.totalInvestment,
    totalProfitLoss: portfolio.totalProfitLoss,
    totalProfitLossPercentage: portfolio.totalProfitLossPercentage,
    itemCount: portfolio.items.length,
    topPerformers: portfolio.items
      .filter(item => item.profitLossPercentage > 0)
      .sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
      .slice(0, 5)
      .map(item => ({
        coinId: item.coinId,
        symbol: item.symbol,
        name: item.name,
        profitLossPercentage: item.profitLossPercentage,
        profitLoss: item.profitLoss
      })),
    worstPerformers: portfolio.items
      .filter(item => item.profitLossPercentage < 0)
      .sort((a, b) => a.profitLossPercentage - b.profitLossPercentage)
      .slice(0, 5)
      .map(item => ({
        coinId: item.coinId,
        symbol: item.symbol,
        name: item.name,
        profitLossPercentage: item.profitLossPercentage,
        profitLoss: item.profitLoss
      })),
    allocation: portfolio.items.map(item => ({
      coinId: item.coinId,
      symbol: item.symbol,
      name: item.name,
      percentage: portfolio.totalValue > 0 ? (item.totalValue / portfolio.totalValue) * 100 : 0,
      value: item.totalValue
    })),
    lastUpdated: portfolio.lastUpdated
  };

  res.json({ analytics });
}));

export default router;