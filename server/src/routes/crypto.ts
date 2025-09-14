import express from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = express.Router();

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Get trending cryptocurrencies
router.get('/trending', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const response = await axios.get(`${COINGECKO_BASE_URL}/search/trending`);
  
  res.json({
    trending: response.data.coins.map((coin: any) => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      thumb: coin.item.thumb,
      marketCapRank: coin.item.market_cap_rank,
      priceChange24h: coin.item.price_btc_24h
    }))
  });
}));

// Get market overview
router.get('/market', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { vs_currency = 'usd', order = 'market_cap_desc', per_page = 100, page = 1 } = req.query;
  
  const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
    params: {
      vs_currency,
      order,
      per_page,
      page,
      sparkline: true,
      price_change_percentage: '1h,24h,7d'
    }
  });

  res.json({
    coins: response.data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      fullyDilutedValuation: coin.fully_diluted_valuation,
      totalVolume: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      priceChange24h: coin.price_change_24h,
      priceChangePercentage24h: coin.price_change_percentage_24h,
      priceChangePercentage1h: coin.price_change_percentage_1h_in_currency,
      priceChangePercentage7d: coin.price_change_percentage_7d_in_currency,
      marketCapChange24h: coin.market_cap_change_24h,
      marketCapChangePercentage24h: coin.market_cap_change_percentage_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      maxSupply: coin.max_supply,
      ath: coin.ath,
      athChangePercentage: coin.ath_change_percentage,
      athDate: coin.ath_date,
      atl: coin.atl,
      atlChangePercentage: coin.atl_change_percentage,
      atlDate: coin.atl_date,
      sparklineIn7d: coin.sparkline_in_7d,
      lastUpdated: coin.last_updated
    }))
  });
}));

// Get specific coin data
router.get('/coin/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { localization = false, tickers = false, market_data = true, community_data = false, developer_data = false, sparkline = true } = req.query;

  const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${id}`, {
    params: {
      localization,
      tickers,
      market_data,
      community_data,
      developer_data,
      sparkline
    }
  });

  const coin = response.data;
  
  res.json({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    description: coin.description?.en,
    image: {
      thumb: coin.image?.thumb,
      small: coin.image?.small,
      large: coin.image?.large
    },
    links: {
      homepage: coin.links?.homepage?.[0],
      blockchain_site: coin.links?.blockchain_site?.slice(0, 3),
      official_forum_url: coin.links?.official_forum_url?.slice(0, 2),
      chat_url: coin.links?.chat_url?.slice(0, 3),
      announcement_url: coin.links?.announcement_url?.slice(0, 2),
      twitter_screen_name: coin.links?.twitter_screen_name,
      facebook_username: coin.links?.facebook_username,
      telegram_channel_identifier: coin.links?.telegram_channel_identifier,
      subreddit_url: coin.links?.subreddit_url,
      repos_url: {
        github: coin.links?.repos_url?.github?.slice(0, 3),
        bitbucket: coin.links?.repos_url?.bitbucket?.slice(0, 3)
      }
    },
    marketData: coin.market_data ? {
      currentPrice: coin.market_data.current_price,
      marketCap: coin.market_data.market_cap,
      marketCapRank: coin.market_data.market_cap_rank,
      fullyDilutedValuation: coin.market_data.fully_diluted_valuation,
      totalVolume: coin.market_data.total_volume,
      high24h: coin.market_data.high_24h,
      low24h: coin.market_data.low_24h,
      priceChange24h: coin.market_data.price_change_24h,
      priceChangePercentage24h: coin.market_data.price_change_percentage_24h,
      priceChangePercentage7d: coin.market_data.price_change_percentage_7d,
      priceChangePercentage14d: coin.market_data.price_change_percentage_14d,
      priceChangePercentage30d: coin.market_data.price_change_percentage_30d,
      priceChangePercentage60d: coin.market_data.price_change_percentage_60d,
      priceChangePercentage200d: coin.market_data.price_change_percentage_200d,
      priceChangePercentage1y: coin.market_data.price_change_percentage_1y,
      marketCapChange24h: coin.market_data.market_cap_change_24h,
      marketCapChangePercentage24h: coin.market_data.market_cap_change_percentage_24h,
      circulatingSupply: coin.market_data.circulating_supply,
      totalSupply: coin.market_data.total_supply,
      maxSupply: coin.market_data.max_supply,
      ath: coin.market_data.ath,
      athChangePercentage: coin.market_data.ath_change_percentage,
      athDate: coin.market_data.ath_date,
      atl: coin.market_data.atl,
      atlChangePercentage: coin.market_data.atl_change_percentage,
      atlDate: coin.market_data.atl_date,
      sparkline7d: coin.market_data.sparkline_7d
    } : null,
    lastUpdated: coin.last_updated
  });
}));

// Get coin price history
router.get('/coin/:id/history', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { vs_currency = 'usd', days = '7', interval = 'daily' } = req.query;

  const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${id}/market_chart`, {
    params: {
      vs_currency,
      days,
      interval
    }
  });

  res.json({
    prices: response.data.prices,
    marketCaps: response.data.market_caps,
    totalVolumes: response.data.total_volumes
  });
}));

// Search coins
router.get('/search', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
    params: { query }
  });

  res.json({
    coins: response.data.coins.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      thumb: coin.thumb,
      marketCapRank: coin.market_cap_rank
    })),
    exchanges: response.data.exchanges.map((exchange: any) => ({
      id: exchange.id,
      name: exchange.name,
      thumb: exchange.thumb,
      marketType: exchange.market_type
    }))
  });
}));

// Get global market data
router.get('/global', optionalAuth, asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const response = await axios.get(`${COINGECKO_BASE_URL}/global`);

  const data = response.data.data;
  res.json({
    activeCryptocurrencies: data.active_cryptocurrencies,
    upcomingIcos: data.upcoming_icos,
    ongoingIcos: data.ongoing_icos,
    endedIcos: data.ended_icos,
    markets: data.markets,
    totalMarketCap: data.total_market_cap,
    totalVolume: data.total_volume,
    marketCapPercentage: data.market_cap_percentage,
    marketCapChangePercentage24hUsd: data.market_cap_change_percentage_24h_usd,
    updatedAt: data.updated_at
  });
}));

export default router;