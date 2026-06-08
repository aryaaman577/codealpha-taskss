import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import Meeting from '../models/Meeting';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';
import { createMeetingSchema } from '../validators/meeting.validator';
import { AuthRequest } from '../middleware/auth.middleware';

const generateRoomId = () => crypto.randomBytes(4).toString('hex');

const buildMeetingPayload = (data: z.infer<typeof createMeetingSchema>, userId: string) => {
  const schedule = {
    startTime: data.schedule?.startTime ? new Date(data.schedule.startTime) : undefined,
    endTime: data.schedule?.endTime ? new Date(data.schedule.endTime) : undefined,
    duration: undefined,
    timezone: data.schedule?.timezone || 'UTC',
    recurring: {
      frequency: data.schedule?.recurring?.frequency || null,
      until: data.schedule?.recurring?.until ? new Date(data.schedule.recurring.until) : undefined,
    },
  };

  return {
    title: data.title,
    description: data.description || '',
    type: data.type,
    status: 'scheduled' as const,
    schedule,
    maxParticipants: data.maxParticipants || 25,
    settings: {
      waitingRoomEnabled: data.settings?.waitingRoomEnabled ?? false,
      muteOnJoin: data.settings?.muteOnJoin ?? false,
      videoOffOnJoin: data.settings?.videoOffOnJoin ?? false,
      chatEnabled: data.settings?.allowChat ?? true,
      screenShareEnabled: data.settings?.allowScreenShare ?? true,
      whiteboardEnabled: data.settings?.allowWhiteboard ?? true,
      recordingEnabled: false,
      allowFileShare: data.settings?.allowFileShare ?? true,
      allowRaiseHand: true,
      allowReactions: true,
      lockMeeting: data.settings?.lockMeeting ?? false,
    },
    passcode: data.passcode,
    chatHistory: data.chatHistory ?? true,
    tags: data.tags || [],
    participants: [
      {
        user: userId,
        role: 'host',
        joinedAt: new Date(),
        duration: 0,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: false,
        handRaised: false,
      },
    ],
    waitingRoom: [],
    recording: { enabled: false },
  };
};

export const createMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMeetingSchema.parse(req.body);
    let roomId = generateRoomId();
    let collisionCount = 0;
    while (await Meeting.exists({ roomId })) {
      roomId = generateRoomId();
      collisionCount += 1;
      if (collisionCount > 5) {
        throw new AppError('Unable to generate a unique meeting room', 500);
      }
    }

    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/meeting/${roomId}`;
    const meetingData = buildMeetingPayload(data, req.user._id);

    const meeting = await Meeting.create({
      roomId,
      host: req.user._id,
      inviteLink,
      ...meetingData,
    });

    return sendSuccess(res, { meeting }, 'Meeting created', 201);
  } catch (err) {
    if (err instanceof Error && 'issues' in err) {
      return next(new AppError('Invalid meeting payload', 400));
    }
    next(err);
  }
};

export const getMeeting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId })
      .populate('host', 'username displayName avatar')
      .populate('participants.user', 'username displayName avatar');
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return sendSuccess(res, { meeting }, 'Meeting loaded');
  } catch (err) {
    next(err);
  }
};

export const getUserMeetings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    return sendSuccess(res, { meetings }, 'User meetings loaded');
  } catch (err) {
    next(err);
  }
};
