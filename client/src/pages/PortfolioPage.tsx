import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  ChartPieIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '@/utils/api';
import { Portfolio, PortfolioItem } from '@/types';
import { formatCurrency, formatPercentage, formatCryptoAmount, getPriceChangeColor } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface AddCoinForm {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

const PortfolioPage = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddCoinForm>();

  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery<{ portfolio: Portfolio }>(
    'portfolio',
    () => api.get('/portfolio').then(res => res.data),
    { refetchInterval: 60000 }
  );

  // Fetch portfolio analytics
  const { data: analytics } = useQuery(
    'portfolio-analytics',
    () => api.get('/portfolio/analytics').then(res => res.data.analytics),
    { 
      refetchInterval: 60000,
      enabled: portfolio?.portfolio?.items?.length > 0
    }
  );

  // Search coins for adding to portfolio
  const { data: searchResults, isLoading: searchLoading } = useQuery(
    ['coin-search', searchQuery],
    () => api.get(`/crypto/search?query=${searchQuery}`).then(res => res.data.coins),
    { 
      enabled: searchQuery.length > 2,
      staleTime: 30000
    }
  );

  // Add coin mutation
  const addCoinMutation = useMutation(
    (data: AddCoinForm) => api.post('/portfolio/add', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('portfolio');
        queryClient.invalidateQueries('portfolio-analytics');
        setIsAddModalOpen(false);
        reset();
        toast.success('Coin added to portfolio');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to add coin');
      }
    }
  );

  // Update coin mutation
  const updateCoinMutation = useMutation(
    ({ coinId, ...data }: { coinId: string } & Partial<AddCoinForm>) => 
      api.put(`/portfolio/update/${coinId}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('portfolio');
        queryClient.invalidateQueries('portfolio-analytics');
        setEditingItem(null);
        toast.success('Portfolio updated');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update portfolio');
      }
    }
  );

  // Remove coin mutation
  const removeCoinMutation = useMutation(
    (coinId: string) => api.delete(`/portfolio/remove/${coinId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('portfolio');
        queryClient.invalidateQueries('portfolio-analytics');
        toast.success('Coin removed from portfolio');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to remove coin');
      }
    }
  );

  // Refresh prices mutation
  const refreshMutation = useMutation(
    () => api.post('/portfolio/refresh'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('portfolio');
        queryClient.invalidateQueries('portfolio-analytics');
        toast.success('Portfolio refreshed');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to refresh portfolio');
      }
    }
  );

  const onSubmit = (data: AddCoinForm) => {
    if (editingItem) {
      updateCoinMutation.mutate({ coinId: editingItem.coinId, ...data });
    } else {
      addCoinMutation.mutate(data);
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setValue('coinId', item.coinId);
    setValue('symbol', item.symbol);
    setValue('name', item.name);
    setValue('amount', item.amount);
    setValue('averageBuyPrice', item.averageBuyPrice);
    setIsAddModalOpen(true);
  };

  const handleRemove = (coinId: string) => {
    if (confirm('Are you sure you want to remove this coin from your portfolio?')) {
      removeCoinMutation.mutate(coinId);
    }
  };

  const selectCoin = (coin: any) => {
    setValue('coinId', coin.id);
    setValue('symbol', coin.symbol.toUpperCase());
    setValue('name', coin.name);
    setSearchQuery('');
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
    reset();
    setSearchQuery('');
  };

  if (portfolioLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const portfolioData = portfolio?.portfolio;
  const hasItems = portfolioData?.items?.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio</h1>
          <p className="text-gray-400 mt-1">
            Track and manage your cryptocurrency investments
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isLoading}
            className="btn-secondary btn-md"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshMutation.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary btn-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Coin
          </button>
        </div>
      </div>

      {hasItems ? (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(portfolioData.totalValue)}
                  </p>
                </div>
                <ChartPieIcon className="h-8 w-8 text-primary-400" />
              </div>
            </div>

            <div className="card card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold ${getPriceChangeColor(portfolioData.totalProfitLoss)}`}>
                    {formatCurrency(portfolioData.totalProfitLoss)}
                  </p>
                  <p className={`text-sm ${getPriceChangeColor(portfolioData.totalProfitLossPercentage)}`}>
                    {formatPercentage(portfolioData.totalProfitLossPercentage)}
                  </p>
                </div>
                {portfolioData.totalProfitLoss >= 0 ? (
                  <TrendingUpIcon className="h-8 w-8 text-success-400" />
                ) : (
                  <TrendingDownIcon className="h-8 w-8 text-danger-400" />
                )}
              </div>
            </div>

            <div className="card card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Investment</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(portfolioData.totalInvestment)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Holdings</p>
                  <p className="text-lg font-semibold text-white">
                    {portfolioData.items.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Allocation Pie Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">Portfolio Allocation</h3>
                </div>
                <div className="card-body">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.allocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="percentage"
                        >
                          {analytics.allocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name) => [`${value.toFixed(1)}%`, 'Allocation']}
                          labelFormatter={(label) => analytics.allocation.find(item => item.percentage === label)?.name}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {analytics.allocation.slice(0, 6).map((item, index) => (
                      <div key={item.coinId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-gray-300">{item.symbol}</span>
                        </div>
                        <span className="text-white">{item.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Performance Bar Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
                </div>
                <div className="card-body">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={portfolioData.items.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="symbol" 
                          stroke="#9ca3af"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9ca3af"
                          fontSize={12}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'P&L %']}
                          labelFormatter={(label) => `${label} Performance`}
                        />
                        <Bar 
                          dataKey="profitLossPercentage" 
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Holdings Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-white">Holdings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Asset</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Avg. Buy Price</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Current Price</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Total Value</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">P&L</th>
                    <th className="text-center p-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.items.map((item) => (
                    <tr key={item.coinId} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-sm text-gray-400">{item.symbol}</p>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-300">
                        {formatCryptoAmount(item.amount)}
                      </td>
                      <td className="p-4 text-right text-gray-300">
                        {formatCurrency(item.averageBuyPrice)}
                      </td>
                      <td className="p-4 text-right font-medium text-white">
                        {formatCurrency(item.currentPrice)}
                      </td>
                      <td className="p-4 text-right font-medium text-white">
                        {formatCurrency(item.totalValue)}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`${getPriceChangeColor(item.profitLoss)}`}>
                          <p className="font-medium">
                            {formatCurrency(item.profitLoss)}
                          </p>
                          <p className="text-sm">
                            {formatPercentage(item.profitLossPercentage)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-gray-400 hover:text-primary-400 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.coinId)}
                            className="text-gray-400 hover:text-danger-400 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="card card-body text-center py-12">
          <ChartPieIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No investments yet</h3>
          <p className="text-gray-400 mb-6">
            Start building your cryptocurrency portfolio by adding your first coin.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary btn-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Your First Coin
          </button>
        </div>
      )}

      {/* Add/Edit Coin Modal */}
      <Transition appear show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-gray-900 border border-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-white mb-4">
                    {editingItem ? 'Edit Investment' : 'Add Coin to Portfolio'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {!editingItem && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Search Cryptocurrency
                        </label>
                        <input
                          type="text"
                          placeholder="Search for a coin..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input"
                        />
                        {searchLoading && (
                          <div className="mt-2 flex justify-center">
                            <LoadingSpinner size="sm" />
                          </div>
                        )}
                        {searchResults && searchResults.length > 0 && (
                          <div className="mt-2 max-h-32 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700">
                            {searchResults.slice(0, 5).map((coin: any) => (
                              <button
                                key={coin.id}
                                type="button"
                                onClick={() => selectCoin(coin)}
                                className="w-full p-2 text-left hover:bg-gray-700 flex items-center space-x-2"
                              >
                                <img src={coin.thumb} alt={coin.name} className="w-6 h-6" />
                                <div>
                                  <p className="text-white text-sm">{coin.name}</p>
                                  <p className="text-gray-400 text-xs">{coin.symbol.toUpperCase()}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Symbol
                        </label>
                        <input
                          {...register('symbol', { required: 'Symbol is required' })}
                          type="text"
                          className="input"
                          readOnly={!!editingItem}
                        />
                        {errors.symbol && (
                          <p className="text-danger-400 text-sm mt-1">{errors.symbol.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          {...register('name', { required: 'Name is required' })}
                          type="text"
                          className="input"
                          readOnly={!!editingItem}
                        />
                        {errors.name && (
                          <p className="text-danger-400 text-sm mt-1">{errors.name.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Amount
                      </label>
                      <input
                        {...register('amount', { 
                          required: 'Amount is required',
                          min: { value: 0.00000001, message: 'Amount must be positive' }
                        })}
                        type="number"
                        step="any"
                        className="input"
                      />
                      {errors.amount && (
                        <p className="text-danger-400 text-sm mt-1">{errors.amount.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Average Buy Price (USD)
                      </label>
                      <input
                        {...register('averageBuyPrice', { 
                          required: 'Average buy price is required',
                          min: { value: 0.00000001, message: 'Price must be positive' }
                        })}
                        type="number"
                        step="any"
                        className="input"
                      />
                      {errors.averageBuyPrice && (
                        <p className="text-danger-400 text-sm mt-1">{errors.averageBuyPrice.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-secondary btn-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addCoinMutation.isLoading || updateCoinMutation.isLoading}
                        className="btn-primary btn-md"
                      >
                        {addCoinMutation.isLoading || updateCoinMutation.isLoading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        {editingItem ? 'Update' : 'Add'} Coin
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default PortfolioPage;