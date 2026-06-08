import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Whiteboard from '../models/Whiteboard';
import Meeting from '../models/Meeting';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';

export const getOrCreateWhiteboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) throw new AppError('Meeting not found', 404);

    let whiteboard;
    if (meeting.whiteboard) {
      whiteboard = await Whiteboard.findById(meeting.whiteboard);
    }

    if (!whiteboard) {
      whiteboard = await Whiteboard.create({
        elements: [],
        meeting: meeting._id,
      });
      meeting.whiteboard = whiteboard._id;
      await meeting.save();
    }

    return sendSuccess(res, { whiteboard }, 'Whiteboard canvas loaded');
  } catch (err) {
    next(err);
  }
};

export const saveWhiteboardState = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { elements } = req.body;

    if (!Array.isArray(elements)) {
      throw new AppError('Canvas elements must be an array', 400);
    }

    const whiteboard = await Whiteboard.findByIdAndUpdate(
      id,
      { elements },
      { new: true }
    );

    if (!whiteboard) throw new AppError('Whiteboard not found', 404);
    return sendSuccess(res, { whiteboard }, 'Whiteboard canvas saved');
  } catch (err) {
    next(err);
  }
};
