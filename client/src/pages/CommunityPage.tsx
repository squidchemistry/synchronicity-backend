import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import api from '@/utils/api';
import { Server } from '@/types';
import { formatRelativeTime } from '@/utils/format';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

const CommunityPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'joined'>('browse');

  // Fetch public servers
  const { data: serversData, isLoading: serversLoading } = useQuery(
    ['servers', searchQuery, selectedTags],
    () => api.get('/chat/servers', {
      params: {
        search: searchQuery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined
      }
    }).then(res => res.data),
    { staleTime: 30000 }
  );

  // Fetch joined servers
  const { data: joinedServers, isLoading: joinedLoading } = useQuery(
    'joined-servers',
    () => api.get('/chat/servers/joined').then(res => res.data.servers),
    { staleTime: 30000 }
  );

  const popularTags = [
    'bitcoin', 'ethereum', 'defi', 'nft', 'trading', 'analysis', 
    'altcoins', 'mining', 'staking', 'dao'
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const servers = serversData?.servers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Synchronicity Community</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Join servers focused on AI & cryptocurrency. Share insights, discuss strategies, 
          and connect with fellow traders and enthusiasts.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8 justify-center">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'browse'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <GlobeAltIcon className="h-5 w-5" />
            <span>Browse Servers</span>
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
              activeTab === 'joined'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <UsersIcon className="h-5 w-5" />
            <span>My Servers ({joinedServers?.length || 0})</span>
          </button>
        </nav>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <div className="card card-body">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search servers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <button className="btn-primary btn-md">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Server
                </button>
              </div>

              {/* Tag Filters */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Popular Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Server List */}
          {serversLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server: Server) => (
                <Link
                  key={server._id}
                  to={`/community/${server._id}`}
                  className="card hover:border-primary-500/50 transition-colors group"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {server.icon ? (
                          <img 
                            src={server.icon} 
                            alt={server.name}
                            className="w-12 h-12 rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {server.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                            {server.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400">
                            {server.isPublic ? (
                              <GlobeAltIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <LockClosedIcon className="h-4 w-4 mr-1" />
                            )}
                            {server.isPublic ? 'Public' : 'Private'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {server.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {server.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          {server.memberCount || 0} members
                        </div>
                        <div className="flex items-center">
                          <HashtagIcon className="h-4 w-4 mr-1" />
                          {server.channelCount || 0} channels
                        </div>
                      </div>
                    </div>

                    {server.tags && server.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {server.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {server.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                            +{server.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created {formatRelativeTime(server.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {servers.length === 0 && !serversLoading && (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No servers found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to create a server in this community'
                }
              </p>
              <button className="btn-primary btn-lg">
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Server
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'joined' && (
        <div>
          {joinedLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : joinedServers && joinedServers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedServers.map((server: Server) => (
                <Link
                  key={server._id}
                  to={`/community/${server._id}`}
                  className="card hover:border-primary-500/50 transition-colors group"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {server.icon ? (
                          <img 
                            src={server.icon} 
                            alt={server.name}
                            className="w-12 h-12 rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {server.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                            {server.name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400">
                            <UsersIcon className="h-4 w-4 mr-1" />
                            {server.memberCount || 0} members
                          </div>
                        </div>
                      </div>
                    </div>

                    {server.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {server.description}
                      </p>
                    )}

                    <div className="flex items-center text-sm text-gray-400">
                      <HashtagIcon className="h-4 w-4 mr-1" />
                      {server.channelCount || 0} channels
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UsersIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No servers joined</h3>
              <p className="text-gray-400 mb-6">
                Join some servers to start connecting with the community
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="btn-primary btn-lg"
              >
                Browse Servers
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;