import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Meeting from '../models/Meeting';
import Message from '../models/Message';
import { env } from '../config/env';
import mongoose from 'mongoose';
import Notification, { INotificationDocument } from '../models/Notification';

interface ActiveUser {
  userId: string;
  status: 'online' | 'offline';
}

const activeSocketsByUser = new Map<string, Set<string>>();
const activeStatus = new Map<string, ActiveUser>();
const meetingRooms = new Map<string, Set<string>>();

function getActiveParticipants(io: SocketIOServer, room: string) {
  const roomSockets = meetingRooms.get(room);
  if (!roomSockets) return [];

  const list: any[] = [];
  const seenUserIds = new Set<string>();

  for (const socketId of roomSockets) {
    const s = io.sockets.sockets.get(socketId);
    if (s && s.data?.user) {
      const u = s.data.user;
      // Prevent duplicates if same userId is connected via multiple sockets
      if (!seenUserIds.has(u._id)) {
        seenUserIds.add(u._id);
        list.push({
          userId: u._id,
          name: u.displayName,
          email: u.email || '',
          avatar: u.avatar || '',
          socketId: socketId,
          joinedAt: s.data.joinedAt || new Date().toISOString(),
          audioMuted: s.data.audioMuted ?? false,
          videoMuted: s.data.videoMuted ?? false,
          screenSharing: s.data.screenSharing ?? false,
          handRaised: s.data.handRaised ?? false,
        });
      }
    }
  }
  return list;
}

type UserSocketData = {
  user: {
    _id: string;
    displayName: string;
    username?: string;
    email?: string;
    avatar?: string;
  };
};

function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const match = parts.find((p) => p.startsWith(`${name}=`));
  if (!match) return undefined;
  return match.split('=').slice(1).join('=');
}

function getUserIdFromAccessToken(token: string): string | null {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id?: string };
  return decoded?.id ?? null;
}

function chatChannelRoom(channelType: string, channelId: string): string {
  if (channelType === 'meeting') return `meeting:${channelId}`;
  if (channelType === 'direct') return `chat:direct:${channelId}`;
  return `chat:group:${channelId}`;
}

async function setUserPresence(io: SocketIOServer, userId: string, nextOnline: boolean, lastSeen?: Date) {
  const next = nextOnline ? 'online' : 'offline';
  const prev = activeStatus.get(userId);

  if (prev?.status === next) return;

  activeStatus.set(userId, { userId, status: next });

  if (nextOnline) {
    await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: lastSeen ?? new Date() });
    io.emit('user:online', { userId });
  } else {
    const seen = lastSeen ?? new Date();
    await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: seen });
    io.emit('user:offline', { userId, lastSeen: seen.toISOString() });
  }

  io.emit('presence:update', { userId, status: next, lastSeen: lastSeen ? lastSeen.toISOString() : undefined });
}

export function emitNotificationToUser(
  io: SocketIOServer,
  notification: INotificationDocument & { recipient?: any },
) {
  const recipientId = (notification.recipient?._id ?? notification.recipient) as any;
  const userId = typeof recipientId === 'string' ? recipientId : recipientId?.toString?.();
  if (!userId) return;

  const createdAt = (notification as any).createdAt;

  io.to(`user:${userId}`).emit('notification:new', {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    link: notification.actionUrl ?? undefined,
    createdAt,
    metadata: notification.metadata,
  });
}

export function configureSocket(io: SocketIOServer) {
  io.use(async (socket: Socket, next) => {
    try {
      const cookieHeader = socket.request.headers.cookie;
      const accessToken = getCookieValue(cookieHeader, 'access_token');
      if (!accessToken) return next(new Error('Unauthorized'));

      const userId = getUserIdFromAccessToken(accessToken);
      if (!userId) return next(new Error('Unauthorized'));

      const user = await User.findById(userId).select('_id displayName username email avatar');
      if (!user) return next(new Error('Unauthorized'));

      (socket.data as UserSocketData).user = {
        _id: user._id.toString(),
        displayName: user.displayName,
        username: user.username,
        email: (user as any).email || '',
        avatar: (user as any).avatar || '',
      };

      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as UserSocketData).user._id;

    if (!activeSocketsByUser.has(userId)) activeSocketsByUser.set(userId, new Set());
    const sockSet = activeSocketsByUser.get(userId)!;
    sockSet.add(socket.id);

    const firstSocket = sockSet.size === 1;
    if (firstSocket) {
      setUserPresence(io, userId, true).catch(() => {});
    }

    socket.join(`user:${userId}`);

    socket.on('disconnecting', async () => {
      const rooms = socket.rooms;
      rooms.forEach((room) => {
        if (room.startsWith('meeting:')) {
          const roomId = room.replace('meeting:', '');
          const roomSockets = meetingRooms.get(room);
          if (roomSockets) {
            roomSockets.delete(socket.id);
          }

          const userSockSet = activeSocketsByUser.get(userId);
          const hasOtherSocketsInRoom = userSockSet
            ? Array.from(userSockSet).some((sid) => sid !== socket.id && roomSockets?.has(sid))
            : false;

          // Broadcast updated participant list
          const participantsList = getActiveParticipants(io, room);
          io.to(room).emit('meeting:participants:sync', participantsList);

          if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV LOG] User disconnected. roomId: ${roomId}, socket.id: ${socket.id}, active count: ${participantsList.length}`);
          }

          if (!hasOtherSocketsInRoom) {
            socket.to(room).emit('meeting:participant-left', { roomId, userId });

            Meeting.findOne({ roomId }).then(async (meeting) => {
              if (meeting) {
                const participant = meeting.participants.find((p) => p.user.toString() === userId);
                if (participant) {
                  participant.leftAt = new Date();
                  participant.duration = Math.round((Date.now() - participant.joinedAt.getTime()) / 60000);
                  await meeting.save();
                }
                const populatedMeeting = await Meeting.findOne({ roomId })
                  .populate('participants.user', 'displayName username avatar');
                if (populatedMeeting) {
                  io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
                }
              }
            }).catch(() => {});
          }
        }
      });
    });

    socket.on('disconnect', async () => {
      const userSockets = activeSocketsByUser.get(userId);
      if (userSockets) userSockets.delete(socket.id);

      if (userSockets && userSockets.size === 0) {
        activeSocketsByUser.delete(userId);
        await setUserPresence(io, userId, false, new Date()).catch(() => {});
      }
    });

    // Presence events (explicit)
    socket.emit('presence:update', { userId, status: 'online' });

    // Notifications realtime readiness (socket already joined private room)
    socket.on('notification:subscribe', async () => {
      socket.join(`user:${userId}`);
      socket.emit('notification:subscribed', { userId });
    });

    socket.on('notification:request:sync', async () => {
      // Intentionally no heavy sync here; HTTP endpoints already exist for inbox.
      socket.emit('notification:sync:ack', { ok: true });
    });

    // Chat realtime
    socket.on('chat:join', (data: { roomId: string; type: 'direct' | 'group' | 'meeting' }) => {
      const room = chatChannelRoom(data.type, data.roomId);
      socket.join(room);
    });

    socket.on('chat:leave', (data: { roomId: string; type: 'direct' | 'group' | 'meeting' }) => {
      const room = chatChannelRoom(data.type, data.roomId);
      socket.leave(room);
    });

    const handleMessageSend = async (data: any) => {
      const userObjId = new mongoose.Types.ObjectId((socket.data as UserSocketData).user._id);

      const message = await Message.create({
        content: data.content,
        type: data.type ?? 'text',
        sender: userObjId,
        channelType: data.channelType,
        meeting: data.meetingId ? new mongoose.Types.ObjectId(data.meetingId) : undefined,
        directChat: data.directChatId ? new mongoose.Types.ObjectId(data.directChatId) : undefined,
        groupChat: data.groupChatId ? new mongoose.Types.ObjectId(data.groupChatId) : undefined,
        replyTo: data.replyTo ? new mongoose.Types.ObjectId(data.replyTo) : undefined,
      });

      const channel =
        data.channelType === 'meeting'
          ? chatChannelRoom('meeting', data.meetingId)
          : data.channelType === 'direct'
            ? chatChannelRoom('direct', data.directChatId)
            : chatChannelRoom('group', data.groupChatId);

      io.to(channel).emit('message:new', {
        _id: message._id,
        content: message.content,
        type: message.type,
        sender: { _id: message.sender, displayName: (socket.data as UserSocketData).user.displayName },
        channelType: message.channelType,
        meeting: message.meeting,
        directChat: message.directChat,
        groupChat: message.groupChat,
        createdAt: (message as any).createdAt,
      });

      // Back-compat with existing frontend
      io.to(channel).emit('chat:message:new', message);
    };

    // Required event names + compatibility aliases
    socket.on('message:send', handleMessageSend);
    socket.on('chat:message:send', handleMessageSend);

    socket.on('message:typing:start', (data: { channelType: string; channelId: string }) => {
      const room = chatChannelRoom(data.channelType, data.channelId);
      socket.to(room).emit('message:typing:start', { userId, channel: data });
      socket.to(room).emit('chat:typing:start', { userId, channel: data }); // back-compat
    });

    socket.on('message:typing:stop', (data: { channelType: string; channelId: string }) => {
      const room = chatChannelRoom(data.channelType, data.channelId);
      socket.to(room).emit('message:typing:stop', { userId, channel: data });
      socket.to(room).emit('chat:typing:stop', { userId, channel: data }); // back-compat
    });

    socket.on('chat:typing:start', (data: { channelType: string; channelId: string }) => {
      const room = chatChannelRoom(data.channelType, data.channelId);
      socket.to(room).emit('chat:typing:start', { userId, channel: data });
      socket.to(room).emit('message:typing:start', { userId, channel: data });
    });

    socket.on('chat:typing:stop', (data: { channelType: string; channelId: string }) => {
      const room = chatChannelRoom(data.channelType, data.channelId);
      socket.to(room).emit('chat:typing:stop', { userId, channel: data });
      socket.to(room).emit('message:typing:stop', { userId, channel: data });
    });

    // Meeting realtime
    socket.on('meeting:join', async (data: { roomId: string; audioMuted?: boolean; videoMuted?: boolean }) => {
      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (!meeting) return socket.emit('meeting:error', { message: 'Meeting not found' });
      if (meeting.settings.lockMeeting) return socket.emit('meeting:error', { message: 'Meeting is locked' });

      const room = `meeting:${data.roomId}`;
      socket.join(room);

      socket.data.audioMuted = data.audioMuted ?? false;
      socket.data.videoMuted = data.videoMuted ?? false;
      socket.data.screenSharing = false;
      socket.data.handRaised = false;

      if (!meetingRooms.has(room)) meetingRooms.set(room, new Set());
      const roomSockets = meetingRooms.get(room)!;
      roomSockets.add(socket.id);

      socket.data.joinedAt = new Date().toISOString();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV LOG] Socket ${socket.id} joining roomId: ${data.roomId}`);
      }

      // Broadcast updated participant list
      const participantsList = getActiveParticipants(io, room);
      io.to(room).emit('meeting:participants:sync', participantsList);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV LOG] Server roomId: ${data.roomId} participant count: ${participantsList.length}`);
      }

      const already = meeting.participants.some((participant) => participant.user.toString() === userId);

      if (!already) {
        meeting.participants.push({
          user: new mongoose.Types.ObjectId((socket.data as UserSocketData).user._id),
          role: 'participant',
          joinedAt: new Date(),
          duration: 0,
          audioEnabled: !socket.data.audioMuted,
          videoEnabled: !socket.data.videoMuted,
          screenSharing: false,
          handRaised: false,
        });
        await meeting.save();

        io.to(room).emit('meeting:participant-joined', { roomId: data.roomId, userId });
        socket.to(room).emit('meeting:participant-updated', { roomId: data.roomId, userId });
      }

      socket.data.currentRoom = data.roomId;

      // Compile active peers info for the joining socket
      const activePeers = Array.from(roomSockets)
        .filter((sid) => sid !== socket.id)
        .map((sid) => {
          const s = io.sockets.sockets.get(sid);
          return {
            socketId: sid,
            userId: s?.data?.user?._id,
            displayName: s?.data?.user?.displayName || 'Participant',
            avatar: s?.data?.user?.avatar,
            audioMuted: s?.data?.audioMuted ?? false,
            videoMuted: s?.data?.videoMuted ?? false,
            screenSharing: s?.data?.screenSharing ?? false,
            handRaised: s?.data?.handRaised ?? false,
          };
        });

      socket.emit('meeting:room-active-peers', activePeers);

      // Notify other participants in the room
      socket.to(room).emit('rtc:peer:joined', {
        userId,
        socketId: socket.id,
        displayName: (socket.data as UserSocketData).user.displayName,
        avatar: (socket.data as any).user?.avatar,
        audioMuted: socket.data.audioMuted,
        videoMuted: socket.data.videoMuted,
        screenSharing: socket.data.screenSharing,
        handRaised: socket.data.handRaised,
      });

      const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
        .populate('participants.user', 'displayName username avatar');
      if (populatedMeeting) {
        io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
      } else {
        io.to(room).emit('meeting:participants:update', meeting.participants);
      }
    });

    socket.on('meeting:leave', async (data: { roomId: string }) => {
      const room = `meeting:${data.roomId}`;
      socket.leave(room);
      meetingRooms.get(room)?.delete(socket.id);
      socket.data.currentRoom = undefined;

      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (meeting) {
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (participant) {
          participant.leftAt = new Date();
          participant.duration = Math.round((Date.now() - participant.joinedAt.getTime()) / 60000);
          await meeting.save();
        }
        const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
          .populate('participants.user', 'displayName username avatar');
        if (populatedMeeting) {
          io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
        } else {
          io.to(room).emit('meeting:participants:update', meeting.participants);
        }
        io.to(room).emit('meeting:participant-left', { roomId: data.roomId, userId });
      }

      socket.to(room).emit('rtc:peer:left', { userId, socketId: socket.id });

      // Broadcast updated participant list
      const participantsList = getActiveParticipants(io, room);
      io.to(room).emit('meeting:participants:sync', participantsList);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV LOG] Socket ${socket.id} left roomId: ${data.roomId}, active count: ${participantsList.length}`);
      }
    });

    socket.on('meeting:media-state-changed', (data: { roomId: string; audioMuted?: boolean; videoMuted?: boolean; screenSharing?: boolean; handRaised?: boolean }) => {
      const room = `meeting:${data.roomId}`;
      if (data.audioMuted !== undefined) socket.data.audioMuted = data.audioMuted;
      if (data.videoMuted !== undefined) socket.data.videoMuted = data.videoMuted;
      if (data.screenSharing !== undefined) socket.data.screenSharing = data.screenSharing;
      if (data.handRaised !== undefined) socket.data.handRaised = data.handRaised;

      // Broadcast to other participants in the room
      socket.to(room).emit('meeting:participant:media-state', {
        socketId: socket.id,
        audioMuted: data.audioMuted,
        videoMuted: data.videoMuted,
        screenSharing: data.screenSharing,
        handRaised: data.handRaised,
      });

      // Broadcast updated participant list
      const participantsList = getActiveParticipants(io, room);
      io.to(room).emit('meeting:participants:sync', participantsList);
    });

    socket.on('meeting:participant:mute', async (data: { roomId: string; muted: boolean }) => {
      const room = `meeting:${data.roomId}`;
      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (meeting) {
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (participant) {
          participant.audioEnabled = !data.muted;
          await meeting.save();
        }
        const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
          .populate('participants.user', 'displayName username avatar');
        if (populatedMeeting) {
          io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
        }
      }
    });

    socket.on('meeting:participant:camera', async (data: { roomId: string; cameraOff: boolean }) => {
      const room = `meeting:${data.roomId}`;
      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (meeting) {
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (participant) {
          participant.videoEnabled = !data.cameraOff;
          await meeting.save();
        }
        const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
          .populate('participants.user', 'displayName username avatar');
        if (populatedMeeting) {
          io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
        }
      }
    });

    socket.on('meeting:hand:raise', async (data: { roomId: string; raised: boolean }) => {
      const room = `meeting:${data.roomId}`;
      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (meeting) {
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (participant) {
          participant.handRaised = data.raised;
          await meeting.save();
        }
        const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
          .populate('participants.user', 'displayName username avatar');
        if (populatedMeeting) {
          io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
        }
      }
    });

    socket.on('meeting:participant:screenshare', async (data: { roomId: string; sharing: boolean }) => {
      const room = `meeting:${data.roomId}`;
      const meeting = await Meeting.findOne({ roomId: data.roomId });
      if (meeting) {
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (participant) {
          participant.screenSharing = data.sharing;
          await meeting.save();
        }
        const populatedMeeting = await Meeting.findOne({ roomId: data.roomId })
          .populate('participants.user', 'displayName username avatar');
        if (populatedMeeting) {
          io.to(room).emit('meeting:participants:update', populatedMeeting.participants);
        }
      }
    });

    // Alias required meeting chat pipeline to existing chat:message:* behavior
    socket.on('meeting:chat-message', (data: { roomId: string; content: string; type?: string }) => {
      socket.emit('chat:message:send', {
        content: data.content,
        type: data.type ?? 'text',
        channelType: 'meeting',
        meetingId: data.roomId,
      });
    });

    // Whiteboard realtime readiness (lightweight event pipeline)
    socket.on('whiteboard:join', (data: { whiteboardId: string }) => {
      const room = `whiteboard:${data.whiteboardId}`;
      socket.join(room);
      socket.emit('whiteboard:canvas:state', { whiteboardId: data.whiteboardId });
      socket.to(room).emit('whiteboard:update', { whiteboardId: data.whiteboardId, event: 'join', userId });
    });

    socket.on('whiteboard:update', (data: any) => {
      const room = `whiteboard:${data.whiteboardId ?? data.id ?? data.whiteboard_id}`;
      if (!room.includes('whiteboard:')) return;
      socket.to(room).emit('whiteboard:update', { ...data, userId });
      // Back-compat with object:add/modify/delete
      if (data.event === 'add' || data.type === 'object:add') {
        socket.to(room).emit('whiteboard:object:add', data);
      }
      if (data.event === 'clear') {
        socket.to(room).emit('whiteboard:clear', { whiteboardId: data.whiteboardId });
      }
    });

    socket.on('whiteboard:cursor', (data: { whiteboardId: string; x: number; y: number }) => {
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:cursor', { userId, x: data.x, y: data.y });
    });

    socket.on('whiteboard:clear', (data: { whiteboardId: string }) => {
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:clear', { whiteboardId: data.whiteboardId, userId });
    });

    // Back-compat with existing meeting page (object:add)
    socket.on('whiteboard:object:add', (data: any) => {
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:object:add', data);
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:update', {
        whiteboardId: data.whiteboardId,
        event: 'add',
        startX: data.startX,
        startY: data.startY,
        endX: data.endX,
        endY: data.endY,
        color: data.color,
        size: data.size,
        userId,
      });
    });

    socket.on('whiteboard:object:modify', (data: any) => {
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:object:modify', data);
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:update', { ...data, userId });
    });

    socket.on('whiteboard:object:delete', (data: any) => {
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:object:delete', data);
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:update', { ...data, userId, event: 'delete' });
    });

    // Existing RTC signaling retained
    socket.on('rtc:offer', (data: { targetSocketId: string; sdp: any }) => {
      io.to(data.targetSocketId).emit('rtc:offer', { sdp: data.sdp, socketId: socket.id });
    });

    socket.on('rtc:answer', (data: { targetSocketId: string; sdp: any }) => {
      io.to(data.targetSocketId).emit('rtc:answer', { sdp: data.sdp, socketId: socket.id });
    });

    socket.on('rtc:ice-candidate', (data: { targetSocketId: string; candidate: any }) => {
      io.to(data.targetSocketId).emit('rtc:ice-candidate', { candidate: data.candidate, socketId: socket.id });
    });
  });
}
