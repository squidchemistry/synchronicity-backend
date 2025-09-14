import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import api from '@/utils/api';
import { CryptoCoin } from '@/types';
import { formatCurrency, formatPercentage, formatLargeNumber, getPriceChangeColor } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

type SortField = 'marketCapRank' | 'currentPrice' | 'priceChangePercentage24h' | 'marketCap' | 'totalVolume';
type SortDirection = 'asc' | 'desc';

const MarketPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('marketCapRank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  const { data: coins, isLoading, error } = useQuery<CryptoCoin[]>(
    'market-coins',
    () => api.get('/crypto/market?per_page=100').then(res => res.data.coins),
    { 
      refetchInterval: 30000,
      staleTime: 15000
    }
  );

  const { data: globalData } = useQuery(
    'global-market',
    () => api.get('/crypto/global').then(res => res.data),
    { refetchInterval: 60000 }
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'marketCapRank' ? 'asc' : 'desc');
    }
  };

  const toggleWatchlist = (coinId: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(coinId)) {
      newWatchlist.delete(coinId);
    } else {
      newWatchlist.add(coinId);
    }
    setWatchlist(newWatchlist);
  };

  const filteredAndSortedCoins = useMemo(() => {
    if (!coins) return [];

    let filtered = coins.filter(coin => 
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (showWatchlistOnly) {
      filtered = filtered.filter(coin => watchlist.has(coin.id));
    }

    return filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'marketCapRank':
          aValue = a.marketCapRank || Infinity;
          bValue = b.marketCapRank || Infinity;
          break;
        case 'currentPrice':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'priceChangePercentage24h':
          aValue = a.priceChangePercentage24h || 0;
          bValue = b.priceChangePercentage24h || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'totalVolume':
          aValue = a.totalVolume;
          bValue = b.totalVolume;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [coins, searchQuery, sortField, sortDirection, watchlist, showWatchlistOnly]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
    >
      <span>{children}</span>
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load market data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cryptocurrency Market</h1>
          <p className="text-gray-400 mt-1">
            Track live prices and market data for all cryptocurrencies
          </p>
        </div>
        
        {globalData && (
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-gray-400">Global Market Cap</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(globalData.totalMarketCap.usd, 'USD', 0)}
            </p>
            <p className={`text-sm ${getPriceChangeColor(globalData.marketCapChangePercentage24hUsd)}`}>
              {formatPercentage(globalData.marketCapChangePercentage24hUsd)}
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
              className={`btn btn-sm ${showWatchlistOnly ? 'btn-primary' : 'btn-secondary'}`}
            >
              <StarIcon className="h-4 w-4 mr-2" />
              Watchlist ({watchlist.size})
            </button>
            
            <button className="btn-secondary btn-sm">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Market Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  <SortButton field="marketCapRank">#</SortButton>
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">
                  Name
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  <SortButton field="currentPrice">Price</SortButton>
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  <SortButton field="priceChangePercentage24h">24h %</SortButton>
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  <SortButton field="totalVolume">24h Volume</SortButton>
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">
                  <SortButton field="marketCap">Market Cap</SortButton>
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">
                  Last 7 Days
                </th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">
                  Watch
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCoins.map((coin) => (
                <tr 
                  key={coin.id} 
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-sm text-gray-400">
                    {coin.marketCapRank || '-'}
                  </td>
                  <td className="p-4">
                    <Link 
                      to={`/market/${coin.id}`}
                      className="flex items-center space-x-3 hover:text-primary-400 transition-colors"
                    >
                      <img 
                        src={coin.image} 
                        alt={coin.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-white">{coin.name}</p>
                        <p className="text-sm text-gray-400">{coin.symbol.toUpperCase()}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 text-right font-medium text-white">
                    {formatCurrency(coin.currentPrice)}
                  </td>
                  <td className={`p-4 text-right font-medium ${getPriceChangeColor(coin.priceChangePercentage24h)}`}>
                    {formatPercentage(coin.priceChangePercentage24h || 0)}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {formatLargeNumber(coin.totalVolume)}
                  </td>
                  <td className="p-4 text-right text-gray-300">
                    {formatLargeNumber(coin.marketCap)}
                  </td>
                  <td className="p-4 text-center">
                    {coin.sparklineIn7d?.price && (
                      <div className="w-20 h-8 mx-auto">
                        <svg viewBox="0 0 80 32" className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke={coin.priceChangePercentage24h >= 0 ? '#22c55e' : '#ef4444'}
                            strokeWidth="1.5"
                            points={coin.sparklineIn7d.price
                              .slice(-20)
                              .map((price, index) => `${index * 4},${32 - (price / Math.max(...coin.sparklineIn7d.price.slice(-20))) * 24}`)
                              .join(' ')}
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleWatchlist(coin.id)}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      {watchlist.has(coin.id) ? (
                        <StarIconSolid className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedCoins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            {showWatchlistOnly 
              ? 'No cryptocurrencies in your watchlist'
              : 'No cryptocurrencies found'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketPage;