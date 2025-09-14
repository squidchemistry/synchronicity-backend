import { useParams } from 'react-router-dom';

const ServerPage = () => {
  const { serverId } = useParams<{ serverId: string }>();

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Server Chat</h1>
        <p className="text-gray-400">
          Server ID: {serverId}
        </p>
        <p className="text-gray-400 mt-2">
          Chat functionality will be implemented with Socket.io integration
        </p>
      </div>
    </div>
  );
};

export default ServerPage;