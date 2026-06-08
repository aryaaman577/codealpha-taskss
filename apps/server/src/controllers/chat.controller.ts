import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DirectChat from '../models/DirectChat';
import GroupChat from '../models/GroupChat';
import Message from '../models/Message';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';

export const createChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, participantIds, name } = req.body;

    if (!type || !['direct', 'group'].includes(type)) {
      throw new AppError('Invalid chat type', 400);
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      throw new AppError('Participants are required', 400);
    }

    const uniqueParticipants = Array.from(new Set([...participantIds, req.user._id.toString()]));

    if (type === 'direct') {
      if (uniqueParticipants.length !== 2) {
        throw new AppError('Direct chat must have exactly 2 participants', 400);
      }

      // Check if direct chat already exists
      const existing = await DirectChat.findOne({
        participants: { $all: uniqueParticipants, $size: 2 },
      }).populate('participants', 'username displayName avatar status');

      if (existing) {
        return sendSuccess(res, { chat: existing }, 'Direct chat already exists');
      }

      const chat = await DirectChat.create({
        participants: uniqueParticipants,
      });

      const populated = await chat.populate('participants', 'username displayName avatar status');
      return sendSuccess(res, { chat: populated }, 'Direct chat created', 201);
    } else {
      if (!name) {
        throw new AppError('Group chat name is required', 400);
      }

      const chat = await GroupChat.create({
        name,
        members: uniqueParticipants.map((id) => ({
          user: id,
          role: id === req.user._id.toString() ? 'admin' : 'member',
          joinedAt: new Date(),
          unreadCount: 0,
        })),
        createdBy: req.user._id,
      });

      const populated = await chat.populate('members.user', 'username displayName avatar status');
      return sendSuccess(res, { chat: populated }, 'Group chat created', 201);
    }
  } catch (err) {
    next(err);
  }
};

export const getUserChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    const directChats = await DirectChat.find({ participants: userId })
      .populate('participants', 'username displayName avatar status customStatus')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'displayName username' },
      });

    const groupChats = await GroupChat.find({ 'members.user': userId })
      .populate('members.user', 'username displayName avatar status customStatus')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'displayName username' },
      });

    // Format consistent chat representation
    const chats = [
      ...directChats.map((c: any) => ({
        _id: c._id,
        type: 'direct',
        name: c.participants.find((p: any) => p._id.toString() !== userId.toString())?.displayName || 'Direct Chat',
        participants: c.participants,
        lastMessage: c.lastMessage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      ...groupChats.map((c: any) => ({
        _id: c._id,
        type: 'group',
        name: c.name,
        participants: c.members.map((m: any) => m.user),
        lastMessage: c.lastMessage,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return sendSuccess(res, { chats }, 'User chats loaded');
  } catch (err) {
    next(err);
  }
};

export const getChatMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { channelType, channelId } = req.params;

    if (!['direct', 'group', 'meeting'].includes(channelType)) {
      throw new AppError('Invalid channel type', 400);
    }

    const query: any = { channelType };
    if (channelType === 'direct') query.directChat = channelId;
    else if (channelType === 'group') query.groupChat = channelId;
    else if (channelType === 'meeting') query.meeting = channelId;

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'displayName' },
      })
      .sort({ createdAt: 1 })
      .limit(100);

    return sendSuccess(res, { messages }, 'Messages loaded');
  } catch (err) {
    next(err);
  }
};
