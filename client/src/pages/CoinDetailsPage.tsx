import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '@/utils/api';
import { formatCurrency, formatPercentage, formatLargeNumber, getPriceChangeColor } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

const CoinDetailsPage = () => {
  const { coinId } = useParams<{ coinId: string }>();

  const { data: coin, isLoading, error } = useQuery(
    ['coin-details', coinId],
    () => api.get(`/crypto/coin/${coinId}`).then(res => res.data),
    { 
      enabled: !!coinId,
      staleTime: 60000
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load coin details</p>
        <Link to="/market" className="btn-primary btn-md mt-4">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Market
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/market" className="btn-ghost btn-md">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Market
        </Link>
      </div>

      {/* Coin Header */}
      <div className="card card-body">
        <div className="flex items-center space-x-4">
          {coin.image?.large && (
            <img 
              src={coin.image.large} 
              alt={coin.name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
            <p className="text-gray-400 text-lg">{coin.symbol?.toUpperCase()}</p>
            {coin.marketData?.marketCapRank && (
              <p className="text-sm text-gray-500">
                Rank #{coin.marketData.marketCapRank}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Price Information */}
      {coin.marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card card-body">
            <h3 className="text-sm text-gray-400 mb-2">Current Price</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(coin.marketData.currentPrice?.usd || 0)}
            </p>
            <p className={`text-sm ${getPriceChangeColor(coin.marketData.priceChangePercentage24h || 0)}`}>
              {formatPercentage(coin.marketData.priceChangePercentage24h || 0)}
            </p>
          </div>

          <div className="card card-body">
            <h3 className="text-sm text-gray-400 mb-2">Market Cap</h3>
            <p className="text-2xl font-bold text-white">
              {formatLargeNumber(coin.marketData.marketCap?.usd || 0)}
            </p>
            <p className={`text-sm ${getPriceChangeColor(coin.marketData.marketCapChangePercentage24h || 0)}`}>
              {formatPercentage(coin.marketData.marketCapChangePercentage24h || 0)}
            </p>
          </div>

          <div className="card card-body">
            <h3 className="text-sm text-gray-400 mb-2">24h Volume</h3>
            <p className="text-2xl font-bold text-white">
              {formatLargeNumber(coin.marketData.totalVolume?.usd || 0)}
            </p>
          </div>

          <div className="card card-body">
            <h3 className="text-sm text-gray-400 mb-2">Circulating Supply</h3>
            <p className="text-2xl font-bold text-white">
              {formatLargeNumber(coin.marketData.circulatingSupply || 0)}
            </p>
            {coin.marketData.maxSupply && (
              <p className="text-sm text-gray-400">
                Max: {formatLargeNumber(coin.marketData.maxSupply)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {coin.description && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-white">About {coin.name}</h3>
          </div>
          <div className="card-body">
            <div 
              className="prose prose-gray prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: coin.description.substring(0, 1000) + '...' }}
            />
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {coin.marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Price Statistics</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">24h High</span>
                <span className="text-white font-medium">
                  {formatCurrency(coin.marketData.high24h?.usd || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">24h Low</span>
                <span className="text-white font-medium">
                  {formatCurrency(coin.marketData.low24h?.usd || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">All-Time High</span>
                <span className="text-white font-medium">
                  {formatCurrency(coin.marketData.ath?.usd || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">All-Time Low</span>
                <span className="text-white font-medium">
                  {formatCurrency(coin.marketData.atl?.usd || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Market Information</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap Rank</span>
                <span className="text-white font-medium">
                  #{coin.marketData.marketCapRank || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fully Diluted Valuation</span>
                <span className="text-white font-medium">
                  {coin.marketData.fullyDilutedValuation?.usd 
                    ? formatLargeNumber(coin.marketData.fullyDilutedValuation.usd)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Supply</span>
                <span className="text-white font-medium">
                  {coin.marketData.totalSupply 
                    ? formatLargeNumber(coin.marketData.totalSupply)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Supply</span>
                <span className="text-white font-medium">
                  {coin.marketData.maxSupply 
                    ? formatLargeNumber(coin.marketData.maxSupply)
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinDetailsPage;