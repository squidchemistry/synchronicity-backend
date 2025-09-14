import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { 
  ChartBarIcon, 
  BriefcaseIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatPercentage, getPriceChangeColor } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

interface DashboardStats {
  totalPortfolioValue: number;
  portfolioProfitLoss: number;
  portfolioProfitLossPercentage: number;
  topGainer: {
    symbol: string;
    name: string;
    change: number;
  } | null;
  topLoser: {
    symbol: string;
    name: string;
    change: number;
  } | null;
}

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPortfolioValue: 0,
    portfolioProfitLoss: 0,
    portfolioProfitLossPercentage: 0,
    topGainer: null,
    topLoser: null,
  });

  // Fetch market data
  const { data: marketData, isLoading: marketLoading } = useQuery(
    'market-overview',
    () => api.get('/crypto/market?per_page=10').then(res => res.data.coins),
    { refetchInterval: 30000 }
  );

  // Fetch portfolio data
  const { data: portfolioData, isLoading: portfolioLoading } = useQuery(
    'portfolio',
    () => api.get('/portfolio').then(res => res.data.portfolio),
    { refetchInterval: 60000 }
  );

  // Fetch global market data
  const { data: globalData, isLoading: globalLoading } = useQuery(
    'global-market',
    () => api.get('/crypto/global').then(res => res.data),
    { refetchInterval: 60000 }
  );

  useEffect(() => {
    if (portfolioData) {
      const stats: DashboardStats = {
        totalPortfolioValue: portfolioData.totalValue || 0,
        portfolioProfitLoss: portfolioData.totalProfitLoss || 0,
        portfolioProfitLossPercentage: portfolioData.totalProfitLossPercentage || 0,
        topGainer: null,
        topLoser: null,
      };

      if (portfolioData.items && portfolioData.items.length > 0) {
        const sortedByPerformance = [...portfolioData.items].sort(
          (a, b) => b.profitLossPercentage - a.profitLossPercentage
        );
        
        stats.topGainer = {
          symbol: sortedByPerformance[0].symbol,
          name: sortedByPerformance[0].name,
          change: sortedByPerformance[0].profitLossPercentage,
        };

        stats.topLoser = {
          symbol: sortedByPerformance[sortedByPerformance.length - 1].symbol,
          name: sortedByPerformance[sortedByPerformance.length - 1].name,
          change: sortedByPerformance[sortedByPerformance.length - 1].profitLossPercentage,
        };
      }

      setDashboardStats(stats);
    }
  }, [portfolioData]);

  // Generate mock chart data for portfolio performance
  const generateChartData = () => {
    const data = [];
    const baseValue = dashboardStats.totalPortfolioValue || 10000;
    const days = 7;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const value = baseValue * (1 + variation);
      
      data.push({
        date: date.toLocaleDateString(),
        value: value,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  if (marketLoading || portfolioLoading || globalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-900/20 to-gray-900 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {user?.username}! 👋
        </h1>
        <p className="text-gray-400">
          Here's what's happening with your investments today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Portfolio Value */}
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(dashboardStats.totalPortfolioValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <BriefcaseIcon className="h-6 w-6 text-primary-400" />
            </div>
          </div>
        </div>

        {/* Portfolio P&L */}
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold ${getPriceChangeColor(dashboardStats.portfolioProfitLoss)}`}>
                {formatCurrency(dashboardStats.portfolioProfitLoss)}
              </p>
              <p className={`text-sm ${getPriceChangeColor(dashboardStats.portfolioProfitLossPercentage)}`}>
                {formatPercentage(dashboardStats.portfolioProfitLossPercentage)}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-500/10 rounded-lg flex items-center justify-center">
              {dashboardStats.portfolioProfitLoss >= 0 ? (
                <TrendingUpIcon className="h-6 w-6 text-success-400" />
              ) : (
                <TrendingDownIcon className="h-6 w-6 text-danger-400" />
              )}
            </div>
          </div>
        </div>

        {/* Global Market Cap */}
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Global Market Cap</p>
              <p className="text-2xl font-bold text-white">
                {globalData ? formatCurrency(globalData.totalMarketCap.usd, 'USD', 0) : '$0'}
              </p>
              <p className={`text-sm ${getPriceChangeColor(globalData?.marketCapChangePercentage24hUsd || 0)}`}>
                {globalData ? formatPercentage(globalData.marketCapChangePercentage24hUsd) : '0%'}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-500/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-warning-400" />
            </div>
          </div>
        </div>

        {/* Active Cryptocurrencies */}
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Cryptos</p>
              <p className="text-2xl font-bold text-white">
                {globalData?.activeCryptocurrencies?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-info-500/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-info-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">Portfolio Performance</h3>
            <p className="text-sm text-gray-400">Last 7 days</p>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value, 'USD', 0)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#f9fafb' }}
                    formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Movers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">Market Movers</h3>
            <p className="text-sm text-gray-400">Top performing cryptocurrencies</p>
          </div>
          <div className="card-body space-y-4">
            {marketData?.slice(0, 5).map((coin: any) => (
              <div key={coin.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">{coin.name}</p>
                    <p className="text-sm text-gray-400">{coin.symbol.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">
                    {formatCurrency(coin.currentPrice)}
                  </p>
                  <p className={`text-sm ${getPriceChangeColor(coin.priceChangePercentage24h)}`}>
                    {formatPercentage(coin.priceChangePercentage24h)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Performance Summary */}
      {dashboardStats.topGainer && dashboardStats.topLoser && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top Performer</h3>
              <TrendingUpIcon className="h-6 w-6 text-success-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{dashboardStats.topGainer.name}</p>
              <p className="text-sm text-gray-400">{dashboardStats.topGainer.symbol}</p>
              <p className="text-lg font-semibold text-success-400 mt-2">
                {formatPercentage(dashboardStats.topGainer.change)}
              </p>
            </div>
          </div>

          <div className="card card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
              <TrendingDownIcon className="h-6 w-6 text-danger-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{dashboardStats.topLoser.name}</p>
              <p className="text-sm text-gray-400">{dashboardStats.topLoser.symbol}</p>
              <p className="text-lg font-semibold text-danger-400 mt-2">
                {formatPercentage(dashboardStats.topLoser.change)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;