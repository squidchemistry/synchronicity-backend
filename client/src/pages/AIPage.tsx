import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { 
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  LightBulbIcon,
  SparklesIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import api from '@/utils/api';
import { formatRelativeTime } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const AIPage = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'signals'>('chat');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');

  // AI Chat mutation
  const chatMutation = useMutation(
    (message: string) => api.post('/ai/chat', { message }),
    {
      onSuccess: (response) => {
        const aiMessage: ChatMessage = {
          id: Date.now().toString() + '_ai',
          type: 'ai',
          content: response.data.response,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, aiMessage]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to get AI response');
      }
    }
  );

  // Market Analysis query
  const { data: marketAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery(
    'market-analysis',
    () => api.get('/ai/market-analysis').then(res => res.data),
    { 
      enabled: activeTab === 'analysis',
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Portfolio Analysis query
  const { data: portfolioAnalysis, isLoading: portfolioLoading, refetch: refetchPortfolio } = useQuery(
    'portfolio-analysis',
    () => api.get('/ai/portfolio-analysis').then(res => res.data),
    { 
      enabled: activeTab === 'analysis',
      staleTime: 5 * 60 * 1000
    }
  );

  // Trading Signals query
  const { data: tradingSignals, isLoading: signalsLoading, refetch: refetchSignals } = useQuery(
    ['trading-signals', selectedCoin],
    () => api.get(`/ai/trading-signals/${selectedCoin}`).then(res => res.data),
    { 
      enabled: activeTab === 'signals' && !!selectedCoin,
      staleTime: 10 * 60 * 1000 // 10 minutes
    }
  );

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: chatMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    chatMutation.mutate(chatMessage);
    setChatMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const tabs = [
    { id: 'chat', name: 'AI Assistant', icon: ChatBubbleLeftRightIcon },
    { id: 'analysis', name: 'Market Analysis', icon: ChartBarIcon },
    { id: 'signals', name: 'Trading Signals', icon: SparklesIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CpuChipIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get AI-powered insights, trading signals, and personalized recommendations 
          for your cryptocurrency investments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Chat with AI Assistant
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Ask questions about cryptocurrency, trading strategies, or market analysis
                </p>
              </div>
              
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 border-b border-gray-800">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-400 py-12">
                    <LightBulbIcon className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium">Start a conversation</p>
                    <p className="text-sm mt-2">
                      Try asking: "What's the best crypto to invest in?" or "Analyze my portfolio"
                    </p>
                  </div>
                ) : (
                  chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-800 text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-primary-200' : 'text-gray-400'
                        }`}>
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {chatMutation.isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 text-gray-100 px-4 py-2 rounded-lg">
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6">
                <div className="flex space-x-3">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about cryptocurrency..."
                    className="flex-1 input resize-none"
                    rows={2}
                    disabled={chatMutation.isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || chatMutation.isLoading}
                    className="btn-primary btn-md self-end"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Analysis */}
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Market Analysis</h3>
                <button
                  onClick={() => refetchAnalysis()}
                  disabled={analysisLoading}
                  className="btn-secondary btn-sm"
                >
                  {analysisLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Refresh
                </button>
              </div>
              <div className="card-body">
                {analysisLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : marketAnalysis ? (
                  <div>
                    <div className="prose prose-gray prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                        {marketAnalysis.analysis}
                      </p>
                    </div>
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Top Market Movers</h4>
                      <div className="space-y-2">
                        {marketAnalysis.marketData?.slice(0, 5).map((coin: any) => (
                          <div key={coin.symbol} className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">{coin.name}</span>
                            <span className={`font-medium ${
                              coin.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
                            }`}>
                              {coin.change24h >= 0 ? '+' : ''}{coin.change24h?.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Last updated: {formatRelativeTime(marketAnalysis.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Click refresh to get the latest market analysis
                  </p>
                )}
              </div>
            </div>

            {/* Portfolio Analysis */}
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Portfolio Analysis</h3>
                <button
                  onClick={() => refetchPortfolio()}
                  disabled={portfolioLoading}
                  className="btn-secondary btn-sm"
                >
                  {portfolioLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  Refresh
                </button>
              </div>
              <div className="card-body">
                {portfolioLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : portfolioAnalysis ? (
                  <div>
                    <div className="prose prose-gray prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                        {portfolioAnalysis.analysis}
                      </p>
                    </div>
                    
                    {portfolioAnalysis.recommendations?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Recommendations</h4>
                        <ul className="space-y-2">
                          {portfolioAnalysis.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start text-sm text-gray-300">
                              <span className="text-primary-400 mr-2">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {portfolioAnalysis.portfolioMetrics && (
                      <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Risk Level</p>
                          <p className={`font-medium ${
                            portfolioAnalysis.portfolioMetrics.riskLevel === 'Low' ? 'text-success-400' :
                            portfolioAnalysis.portfolioMetrics.riskLevel === 'Medium' ? 'text-warning-400' :
                            'text-danger-400'
                          }`}>
                            {portfolioAnalysis.portfolioMetrics.riskLevel}
                          </p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Diversification</p>
                          <p className="font-medium text-white">
                            {portfolioAnalysis.portfolioMetrics.diversificationScore}/100
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-4">
                      Last updated: {formatRelativeTime(portfolioAnalysis.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Click refresh to analyze your portfolio
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div className="max-w-4xl mx-auto">
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
                  <select
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    className="input w-auto"
                  >
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                    <option value="binancecoin">Binance Coin (BNB)</option>
                    <option value="cardano">Cardano (ADA)</option>
                    <option value="solana">Solana (SOL)</option>
                  </select>
                </div>
              </div>
              <div className="card-body">
                {signalsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : tradingSignals ? (
                  <div>
                    <div className="mb-6">
                      <h4 className="text-xl font-semibold text-white mb-2">
                        {tradingSignals.coinName} ({tradingSignals.coinSymbol})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Current Price</p>
                          <p className="font-medium text-white">
                            ${tradingSignals.technicalData.currentPrice?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">24h Change</p>
                          <p className={`font-medium ${
                            tradingSignals.technicalData.change24h >= 0 ? 'text-success-400' : 'text-danger-400'
                          }`}>
                            {tradingSignals.technicalData.change24h >= 0 ? '+' : ''}
                            {tradingSignals.technicalData.change24h?.toFixed(2)}%
                          </p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Volume 24h</p>
                          <p className="font-medium text-white">
                            ${tradingSignals.technicalData.volume24h?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400">Volatility</p>
                          <p className="font-medium text-white">
                            {tradingSignals.technicalData.volatility30d}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-gray prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                        {tradingSignals.signals}
                      </p>
                    </div>

                    <div className="mt-6 p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
                      <p className="text-warning-400 text-sm font-medium mb-1">⚠️ Disclaimer</p>
                      <p className="text-warning-300 text-sm">
                        {tradingSignals.disclaimer}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 mt-4">
                      Last updated: {formatRelativeTime(tradingSignals.timestamp)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Select a cryptocurrency to view trading signals
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPage;