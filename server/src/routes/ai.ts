import express from 'express';
import { OpenAI } from 'openai';
import { body, validationResult } from 'express-validator';
import { Portfolio } from '../models/Portfolio';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import axios from 'axios';

const router = express.Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// AI Chat Assistant
router.post('/chat', [
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isString().withMessage('Context must be a string')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!openai) {
    throw createError('AI service not available', 503);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message, context } = req.body;

  // Get user's portfolio for context
  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  
  let systemPrompt = `You are Synchronicity AI, an expert cryptocurrency and trading assistant. You provide helpful, accurate, and actionable advice about cryptocurrency investments, trading strategies, and market analysis.

Key guidelines:
- Always provide balanced, educational information
- Never give definitive financial advice - remind users to do their own research
- Focus on risk management and diversification
- Be aware of current market trends and volatility
- Provide specific, actionable insights when possible
- Keep responses concise but comprehensive`;

  if (portfolio && portfolio.items.length > 0) {
    const portfolioSummary = portfolio.items.map(item => 
      `${item.name} (${item.symbol}): ${item.amount} coins, Current Value: $${item.totalValue.toFixed(2)}, P&L: ${item.profitLossPercentage.toFixed(2)}%`
    ).join('\n');

    systemPrompt += `\n\nUser's current portfolio:\nTotal Value: $${portfolio.totalValue.toFixed(2)}\nTotal P&L: ${portfolio.totalProfitLossPercentage.toFixed(2)}%\n\nHoldings:\n${portfolioSummary}`;
  }

  if (context) {
    systemPrompt += `\n\nAdditional context: ${context}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw createError('Failed to generate AI response', 500);
  }
}));

// AI Market Analysis
router.get('/market-analysis', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!openai) {
    throw createError('AI service not available', 503);
  }

  try {
    // Get top 10 cryptocurrencies data
    const marketResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h,7d'
      }
    });

    const marketData = marketResponse.data.map((coin: any) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      change7d: coin.price_change_percentage_7d_in_currency,
      marketCap: coin.market_cap,
      volume: coin.total_volume
    }));

    const marketSummary = marketData.map(coin => 
      `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.price}, 24h: ${coin.change24h?.toFixed(2)}%, 7d: ${coin.change7d?.toFixed(2)}%`
    ).join('\n');

    const prompt = `Analyze the current cryptocurrency market based on this data for the top 10 coins by market cap:

${marketSummary}

Provide a concise market analysis covering:
1. Overall market sentiment
2. Notable trends or patterns
3. Key opportunities or risks
4. Brief outlook for the next few days

Keep the analysis under 300 words and focus on actionable insights.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional cryptocurrency market analyst. Provide objective, data-driven analysis." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const analysis = completion.choices[0]?.message?.content || 'Unable to generate market analysis.';

    res.json({
      analysis,
      marketData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market analysis error:', error);
    throw createError('Failed to generate market analysis', 500);
  }
}));

// AI Portfolio Analysis
router.get('/portfolio-analysis', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!openai) {
    throw createError('AI service not available', 503);
  }

  const portfolio = await Portfolio.findOne({ userId: req.user!._id });
  
  if (!portfolio || portfolio.items.length === 0) {
    return res.json({
      analysis: "You don't have any coins in your portfolio yet. Consider starting with well-established cryptocurrencies like Bitcoin or Ethereum, and always diversify your investments across different projects and sectors.",
      recommendations: [
        "Start with major cryptocurrencies (BTC, ETH)",
        "Diversify across different sectors",
        "Only invest what you can afford to lose",
        "Set up regular portfolio reviews"
      ],
      timestamp: new Date().toISOString()
    });
  }

  const portfolioSummary = portfolio.items.map(item => 
    `${item.name} (${item.symbol}): ${item.amount} coins, Value: $${item.totalValue.toFixed(2)}, P&L: ${item.profitLossPercentage.toFixed(2)}%, Allocation: ${portfolio.totalValue > 0 ? ((item.totalValue / portfolio.totalValue) * 100).toFixed(1) : 0}%`
  ).join('\n');

  const prompt = `Analyze this cryptocurrency portfolio:

Total Value: $${portfolio.totalValue.toFixed(2)}
Total P&L: ${portfolio.totalProfitLossPercentage.toFixed(2)}%
Number of Holdings: ${portfolio.items.length}

Holdings:
${portfolioSummary}

Provide analysis covering:
1. Portfolio diversification assessment
2. Risk evaluation
3. Performance analysis
4. Specific recommendations for improvement
5. Suggested rebalancing if needed

Keep the analysis under 400 words and provide actionable advice.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional cryptocurrency portfolio advisor. Provide balanced, risk-aware analysis and recommendations." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.4
    });

    const analysis = completion.choices[0]?.message?.content || 'Unable to generate portfolio analysis.';

    // Generate specific recommendations
    const recommendations = [];
    
    // Diversification check
    if (portfolio.items.length < 3) {
      recommendations.push("Consider diversifying with 3-5 different cryptocurrencies");
    }
    
    // Concentration risk
    const topHolding = Math.max(...portfolio.items.map(item => 
      portfolio.totalValue > 0 ? (item.totalValue / portfolio.totalValue) * 100 : 0
    ));
    if (topHolding > 50) {
      recommendations.push("Reduce concentration risk - no single holding should exceed 40-50%");
    }
    
    // Performance-based recommendations
    const underperformers = portfolio.items.filter(item => item.profitLossPercentage < -20);
    if (underperformers.length > 0) {
      recommendations.push("Review underperforming assets and consider stop-loss strategies");
    }

    res.json({
      analysis,
      recommendations,
      portfolioMetrics: {
        totalValue: portfolio.totalValue,
        totalProfitLoss: portfolio.totalProfitLoss,
        profitLossPercentage: portfolio.totalProfitLossPercentage,
        diversificationScore: Math.min(portfolio.items.length * 20, 100), // Simple score out of 100
        riskLevel: topHolding > 60 ? 'High' : topHolding > 40 ? 'Medium' : 'Low'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Portfolio analysis error:', error);
    throw createError('Failed to generate portfolio analysis', 500);
  }
}));

// AI Trading Signals
router.get('/trading-signals/:coinId', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  if (!openai) {
    throw createError('AI service not available', 503);
  }

  const { coinId } = req.params;

  try {
    // Get coin data and price history
    const [coinResponse, historyResponse] = await Promise.all([
      axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
        params: { market_data: true, sparkline: true }
      }),
      axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
        params: { vs_currency: 'usd', days: '30', interval: 'daily' }
      })
    ]);

    const coin = coinResponse.data;
    const priceHistory = historyResponse.data.prices;

    // Calculate basic technical indicators
    const prices = priceHistory.map((p: any) => p[1]);
    const currentPrice = prices[prices.length - 1];
    const avgPrice30d = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
    const volatility = Math.sqrt(prices.reduce((sum: number, price: number) => sum + Math.pow(price - avgPrice30d, 2), 0) / prices.length) / avgPrice30d * 100;

    const technicalData = {
      currentPrice,
      change24h: coin.market_data.price_change_percentage_24h,
      change7d: coin.market_data.price_change_percentage_7d,
      change30d: coin.market_data.price_change_percentage_30d,
      volume24h: coin.market_data.total_volume.usd,
      marketCap: coin.market_data.market_cap.usd,
      volatility30d: volatility.toFixed(2)
    };

    const prompt = `Generate trading signals for ${coin.name} (${coin.symbol.toUpperCase()}) based on this data:

Current Price: $${currentPrice}
24h Change: ${technicalData.change24h?.toFixed(2)}%
7d Change: ${technicalData.change7d?.toFixed(2)}%
30d Change: ${technicalData.change30d?.toFixed(2)}%
30d Volatility: ${technicalData.volatility30d}%
24h Volume: $${technicalData.volume24h?.toLocaleString()}
Market Cap: $${technicalData.marketCap?.toLocaleString()}

Provide:
1. Overall signal (Bullish/Bearish/Neutral)
2. Confidence level (1-10)
3. Key support and resistance levels
4. Risk assessment
5. Short-term outlook (1-7 days)

Keep response under 300 words and focus on actionable insights.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a technical analyst providing cryptocurrency trading signals. Be objective and include risk warnings." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.2
    });

    const signals = completion.choices[0]?.message?.content || 'Unable to generate trading signals.';

    res.json({
      coinId,
      coinName: coin.name,
      coinSymbol: coin.symbol.toUpperCase(),
      signals,
      technicalData,
      timestamp: new Date().toISOString(),
      disclaimer: "This is AI-generated analysis for educational purposes only. Always do your own research and never invest more than you can afford to lose."
    });

  } catch (error) {
    console.error('Trading signals error:', error);
    throw createError('Failed to generate trading signals', 500);
  }
}));

export default router;