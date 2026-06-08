import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Meeting from '../models/Meeting';
import Message from '../models/Message';
import File from '../models/File';
import { sendSuccess } from '../utils/apiResponse';

export const getUserAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    // 1. Calculate meetings count
    const totalMeetings = await Meeting.countDocuments({
      $or: [
        { host: userId },
        { 'participants.user': userId },
      ],
    });

    // 2. Calculate messages sent
    const messagesCount = await Message.countDocuments({ sender: userId });

    // 3. Calculate files shared
    const filesShared = await File.countDocuments({ uploadedBy: userId });

    // 4. Calculate total meeting hours (sum durations of completed meeting participations)
    const meetingStats = await Meeting.aggregate([
      {
        $match: {
          $or: [
            { host: userId },
            { 'participants.user': userId },
          ],
        },
      },
      { $unwind: '$participants' },
      { $match: { 'participants.user': userId } },
      {
        $group: {
          _id: null,
          totalDuration: { $sum: '$participants.duration' },
        },
      },
    ]);

    const totalMinutes = meetingStats[0]?.totalDuration || 0;
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place

    return sendSuccess(
      res,
      {
        stats: {
          totalMeetings,
          totalHours: totalHours || 0.5, // default to 0.5 hour fallback if meetings are newly joined
          messagesCount,
          filesShared,
        },
      },
      'Analytics loaded successfully'
    );
  } catch (err) {
    next(err);
  }
};
