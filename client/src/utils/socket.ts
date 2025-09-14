import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      upgrade: true,
    });

    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Server methods
  joinServer(serverId: string): void {
    this.socket?.emit('join_server', serverId);
  }

  leaveServer(serverId: string): void {
    this.socket?.emit('leave_server', serverId);
  }

  // Channel methods
  joinChannel(serverId: string, channelId: string): void {
    this.socket?.emit('join_channel', { serverId, channelId });
  }

  leaveChannel(channelId: string): void {
    this.socket?.emit('leave_channel', channelId);
  }

  // Message methods
  sendMessage(serverId: string, channelId: string, content: string, type = 'text'): void {
    this.socket?.emit('send_message', { serverId, channelId, content, type });
  }

  editMessage(serverId: string, channelId: string, messageId: string, content: string): void {
    this.socket?.emit('edit_message', { serverId, channelId, messageId, content });
  }

  deleteMessage(serverId: string, channelId: string, messageId: string): void {
    this.socket?.emit('delete_message', { serverId, channelId, messageId });
  }

  // Typing indicators
  startTyping(channelId: string): void {
    this.socket?.emit('typing_start', { channelId });
  }

  stopTyping(channelId: string): void {
    this.socket?.emit('typing_stop', { channelId });
  }

  // Crypto price subscriptions
  subscribeToCryptoPrices(coinIds: string[]): void {
    this.socket?.emit('subscribe_crypto_prices', coinIds);
  }

  unsubscribeFromCryptoPrices(coinIds: string[]): void {
    this.socket?.emit('unsubscribe_crypto_prices', coinIds);
  }

  // Event listeners
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    this.socket?.on(event as string, callback);
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    this.socket?.off(event as string, callback);
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;