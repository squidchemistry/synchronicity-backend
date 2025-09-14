import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Server } from '../models/Server';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export const setupSocketHandlers = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.username} connected with socket ID: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining a server
    socket.on('join_server', async (serverId: string) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(serverId)) {
          socket.emit('error', { message: 'Invalid server ID' });
          return;
        }

        const server = await Server.findById(serverId);
        if (!server) {
          socket.emit('error', { message: 'Server not found' });
          return;
        }

        // Check if user is a member
        const isMember = server.members.some(memberId => memberId.toString() === socket.userId);
        if (!isMember && !server.isPublic) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`server:${serverId}`);
        socket.emit('joined_server', { serverId, serverName: server.name });

        // Notify other members of the server
        socket.to(`server:${serverId}`).emit('user_joined_server', {
          userId: socket.userId,
          username: socket.username,
          serverId
        });

      } catch (error) {
        console.error('Error joining server:', error);
        socket.emit('error', { message: 'Failed to join server' });
      }
    });

    // Handle leaving a server
    socket.on('leave_server', (serverId: string) => {
      socket.leave(`server:${serverId}`);
      socket.emit('left_server', { serverId });

      // Notify other members
      socket.to(`server:${serverId}`).emit('user_left_server', {
        userId: socket.userId,
        username: socket.username,
        serverId
      });
    });

    // Handle joining a channel
    socket.on('join_channel', async (data: { serverId: string; channelId: string }) => {
      try {
        const { serverId, channelId } = data;

        if (!mongoose.Types.ObjectId.isValid(serverId) || !mongoose.Types.ObjectId.isValid(channelId)) {
          socket.emit('error', { message: 'Invalid server or channel ID' });
          return;
        }

        const server = await Server.findById(serverId);
        if (!server) {
          socket.emit('error', { message: 'Server not found' });
          return;
        }

        // Check if user is a member
        const isMember = server.members.some(memberId => memberId.toString() === socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const channel = server.channels.id(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        socket.join(`channel:${channelId}`);
        socket.emit('joined_channel', { serverId, channelId, channelName: channel.name });

      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Failed to join channel' });
      }
    });

    // Handle leaving a channel
    socket.on('leave_channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      socket.emit('left_channel', { channelId });
    });

    // Handle sending a message
    socket.on('send_message', async (data: {
      serverId: string;
      channelId: string;
      content: string;
      type?: 'text' | 'image' | 'file';
    }) => {
      try {
        const { serverId, channelId, content, type = 'text' } = data;

        if (!content || content.trim().length === 0 || content.length > 2000) {
          socket.emit('error', { message: 'Invalid message content' });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(serverId) || !mongoose.Types.ObjectId.isValid(channelId)) {
          socket.emit('error', { message: 'Invalid server or channel ID' });
          return;
        }

        const server = await Server.findById(serverId);
        if (!server) {
          socket.emit('error', { message: 'Server not found' });
          return;
        }

        // Check if user is a member
        const isMember = server.members.some(memberId => memberId.toString() === socket.userId);
        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        const channel = server.channels.id(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Get user data for the message
        const user = await User.findById(socket.userId).select('username avatar');
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }

        const message = {
          _id: new mongoose.Types.ObjectId(),
          userId: socket.userId!,
          username: user.username,
          avatar: user.avatar,
          content: content.trim(),
          type,
          timestamp: new Date()
        };

        channel.messages.push(message);

        // Keep only last 1000 messages per channel
        if (channel.messages.length > 1000) {
          channel.messages = channel.messages.slice(-1000);
        }

        await server.save();

        // Broadcast the message to all users in the channel
        io.to(`channel:${channelId}`).emit('new_message', {
          serverId,
          channelId,
          message
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message editing
    socket.on('edit_message', async (data: {
      serverId: string;
      channelId: string;
      messageId: string;
      content: string;
    }) => {
      try {
        const { serverId, channelId, messageId, content } = data;

        if (!content || content.trim().length === 0 || content.length > 2000) {
          socket.emit('error', { message: 'Invalid message content' });
          return;
        }

        if (!mongoose.Types.ObjectId.isValid(serverId) || 
            !mongoose.Types.ObjectId.isValid(channelId) || 
            !mongoose.Types.ObjectId.isValid(messageId)) {
          socket.emit('error', { message: 'Invalid IDs' });
          return;
        }

        const server = await Server.findById(serverId);
        if (!server) {
          socket.emit('error', { message: 'Server not found' });
          return;
        }

        const channel = server.channels.id(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const message = channel.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message
        if (message.userId.toString() !== socket.userId) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        message.content = content.trim();
        message.edited = true;
        message.editedAt = new Date();

        await server.save();

        // Broadcast the edited message
        io.to(`channel:${channelId}`).emit('message_edited', {
          serverId,
          channelId,
          messageId,
          content: message.content,
          edited: true,
          editedAt: message.editedAt
        });

      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message deletion
    socket.on('delete_message', async (data: {
      serverId: string;
      channelId: string;
      messageId: string;
    }) => {
      try {
        const { serverId, channelId, messageId } = data;

        if (!mongoose.Types.ObjectId.isValid(serverId) || 
            !mongoose.Types.ObjectId.isValid(channelId) || 
            !mongoose.Types.ObjectId.isValid(messageId)) {
          socket.emit('error', { message: 'Invalid IDs' });
          return;
        }

        const server = await Server.findById(serverId);
        if (!server) {
          socket.emit('error', { message: 'Server not found' });
          return;
        }

        const channel = server.channels.id(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        const message = channel.messages.id(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user owns the message or is server owner
        const isOwner = message.userId.toString() === socket.userId;
        const isServerOwner = server.ownerId.toString() === socket.userId;

        if (!isOwner && !isServerOwner) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        channel.messages.pull(messageId);
        await server.save();

        // Broadcast the message deletion
        io.to(`channel:${channelId}`).emit('message_deleted', {
          serverId,
          channelId,
          messageId
        });

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user_typing_start', {
        userId: socket.userId,
        username: socket.username,
        channelId: data.channelId
      });
    });

    socket.on('typing_stop', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user_typing_stop', {
        userId: socket.userId,
        username: socket.username,
        channelId: data.channelId
      });
    });

    // Handle crypto price updates (for real-time price streaming)
    socket.on('subscribe_crypto_prices', (coinIds: string[]) => {
      if (Array.isArray(coinIds) && coinIds.length > 0) {
        coinIds.forEach(coinId => {
          socket.join(`crypto:${coinId}`);
        });
        socket.emit('subscribed_crypto_prices', { coinIds });
      }
    });

    socket.on('unsubscribe_crypto_prices', (coinIds: string[]) => {
      if (Array.isArray(coinIds) && coinIds.length > 0) {
        coinIds.forEach(coinId => {
          socket.leave(`crypto:${coinId}`);
        });
        socket.emit('unsubscribed_crypto_prices', { coinIds });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.username} disconnected: ${reason}`);
      
      // Leave all rooms
      socket.rooms.forEach(room => {
        if (room.startsWith('server:')) {
          socket.to(room).emit('user_left_server', {
            userId: socket.userId,
            username: socket.username
          });
        }
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  // Broadcast crypto price updates (this would be called from a separate price update service)
  const broadcastPriceUpdate = (coinId: string, priceData: any) => {
    io.to(`crypto:${coinId}`).emit('crypto_price_update', {
      coinId,
      ...priceData,
      timestamp: new Date().toISOString()
    });
  };

  // Export function for external use
  (io as any).broadcastPriceUpdate = broadcastPriceUpdate;
};