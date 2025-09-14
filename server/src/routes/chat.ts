import express from 'express';
import { body, validationResult } from 'express-validator';
import { Server, IServer } from '../models/Server';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

const router = express.Router();

// Get all public servers
router.get('/servers', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { page = 1, limit = 20, search, tags } = req.query;
  
  const query: any = { isPublic: true };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagArray };
  }

  const servers = await Server.find(query)
    .populate('ownerId', 'username avatar')
    .select('-channels.messages') // Exclude messages from server list
    .sort({ createdAt: -1 })
    .limit(Number(limit) * Number(page))
    .skip((Number(page) - 1) * Number(limit));

  const total = await Server.countDocuments(query);

  res.json({
    servers: servers.map(server => ({
      ...server.toObject(),
      memberCount: server.members.length,
      channelCount: server.channels.length
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get user's joined servers
router.get('/servers/joined', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const servers = await Server.find({ 
    members: req.user!._id 
  })
    .populate('ownerId', 'username avatar')
    .select('-channels.messages')
    .sort({ updatedAt: -1 });

  res.json({
    servers: servers.map(server => ({
      ...server.toObject(),
      memberCount: server.members.length,
      channelCount: server.channels.length
    }))
  });
}));

// Create a new server
router.post('/servers', [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Server name must be between 1 and 100 characters')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, isPublic = true, tags = [] } = req.body;

  const server = new Server({
    name,
    description,
    ownerId: req.user!._id,
    members: [req.user!._id],
    isPublic,
    tags: tags.map((tag: string) => tag.toLowerCase()),
    channels: [
      {
        name: 'general',
        description: 'General discussion',
        type: 'text',
        messages: []
      },
      {
        name: 'trading-signals',
        description: 'Share trading insights and signals',
        type: 'text',
        messages: []
      },
      {
        name: 'announcements',
        description: 'Server announcements',
        type: 'announcement',
        messages: []
      }
    ]
  });

  await server.save();
  await server.populate('ownerId', 'username avatar');

  res.status(201).json({
    message: 'Server created successfully',
    server: {
      ...server.toObject(),
      memberCount: server.members.length,
      channelCount: server.channels.length
    }
  });
}));

// Get server details
router.get('/servers/:serverId', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { serverId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serverId)) {
    throw createError('Invalid server ID', 400);
  }

  const server = await Server.findById(serverId)
    .populate('ownerId', 'username avatar')
    .populate('members', 'username avatar');

  if (!server) {
    throw createError('Server not found', 404);
  }

  // Check if user has access to this server
  const isMember = server.members.some(member => member._id.toString() === req.user!._id.toString());
  if (!server.isPublic && !isMember) {
    throw createError('Access denied', 403);
  }

  res.json({ server });
}));

// Join a server
router.post('/servers/:serverId/join', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { serverId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serverId)) {
    throw createError('Invalid server ID', 400);
  }

  const server = await Server.findById(serverId);
  if (!server) {
    throw createError('Server not found', 404);
  }

  if (!server.isPublic) {
    throw createError('This server is private', 403);
  }

  const userId = req.user!._id;
  if (server.members.includes(userId)) {
    return res.json({ message: 'Already a member of this server' });
  }

  server.members.push(userId);
  await server.save();

  // Add server to user's joined servers
  await User.findByIdAndUpdate(userId, {
    $addToSet: { joinedServers: serverId }
  });

  res.json({ message: 'Successfully joined the server' });
}));

// Leave a server
router.post('/servers/:serverId/leave', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { serverId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serverId)) {
    throw createError('Invalid server ID', 400);
  }

  const server = await Server.findById(serverId);
  if (!server) {
    throw createError('Server not found', 404);
  }

  const userId = req.user!._id;

  // Check if user is the owner
  if (server.ownerId.toString() === userId.toString()) {
    throw createError('Server owner cannot leave the server', 400);
  }

  // Remove user from server members
  server.members = server.members.filter(memberId => memberId.toString() !== userId.toString());
  await server.save();

  // Remove server from user's joined servers
  await User.findByIdAndUpdate(userId, {
    $pull: { joinedServers: serverId }
  });

  res.json({ message: 'Successfully left the server' });
}));

// Get channel messages
router.get('/servers/:serverId/channels/:channelId/messages', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { serverId, channelId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(serverId) || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw createError('Invalid server or channel ID', 400);
  }

  const server = await Server.findById(serverId);
  if (!server) {
    throw createError('Server not found', 404);
  }

  // Check if user is a member
  const isMember = server.members.some(memberId => memberId.toString() === req.user!._id.toString());
  if (!isMember) {
    throw createError('Access denied', 403);
  }

  const channel = server.channels.id(channelId);
  if (!channel) {
    throw createError('Channel not found', 404);
  }

  // Get messages with pagination (newest first)
  const startIndex = (Number(page) - 1) * Number(limit);
  const messages = channel.messages
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(startIndex, startIndex + Number(limit));

  res.json({
    messages: messages.reverse(), // Return in chronological order
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: channel.messages.length,
      pages: Math.ceil(channel.messages.length / Number(limit))
    }
  });
}));

// Send a message
router.post('/servers/:serverId/channels/:channelId/messages', [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
    .trim(),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Message type must be text, image, or file')
], asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { serverId, channelId } = req.params;
  const { content, type = 'text' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(serverId) || !mongoose.Types.ObjectId.isValid(channelId)) {
    throw createError('Invalid server or channel ID', 400);
  }

  const server = await Server.findById(serverId);
  if (!server) {
    throw createError('Server not found', 404);
  }

  // Check if user is a member
  const isMember = server.members.some(memberId => memberId.toString() === req.user!._id.toString());
  if (!isMember) {
    throw createError('Access denied', 403);
  }

  const channel = server.channels.id(channelId);
  if (!channel) {
    throw createError('Channel not found', 404);
  }

  const message = {
    _id: new mongoose.Types.ObjectId(),
    userId: req.user!._id,
    username: req.user!.username,
    avatar: req.user!.avatar,
    content,
    type,
    timestamp: new Date()
  };

  channel.messages.push(message);
  
  // Keep only last 1000 messages per channel
  if (channel.messages.length > 1000) {
    channel.messages = channel.messages.slice(-1000);
  }

  await server.save();

  res.status(201).json({
    message: 'Message sent successfully',
    messageData: message
  });
}));

// Delete a message
router.delete('/servers/:serverId/channels/:channelId/messages/:messageId', asyncHandler(async (req: AuthRequest, res: express.Response) => {
  const { serverId, channelId, messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(serverId) || 
      !mongoose.Types.ObjectId.isValid(channelId) || 
      !mongoose.Types.ObjectId.isValid(messageId)) {
    throw createError('Invalid server, channel, or message ID', 400);
  }

  const server = await Server.findById(serverId);
  if (!server) {
    throw createError('Server not found', 404);
  }

  const channel = server.channels.id(channelId);
  if (!channel) {
    throw createError('Channel not found', 404);
  }

  const message = channel.messages.id(messageId);
  if (!message) {
    throw createError('Message not found', 404);
  }

  // Check if user owns the message or is server owner
  const isOwner = message.userId.toString() === req.user!._id.toString();
  const isServerOwner = server.ownerId.toString() === req.user!._id.toString();

  if (!isOwner && !isServerOwner) {
    throw createError('Permission denied', 403);
  }

  channel.messages.pull(messageId);
  await server.save();

  res.json({ message: 'Message deleted successfully' });
}));

export default router;