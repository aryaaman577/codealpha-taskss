import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification';
import { sendSuccess } from '../utils/apiResponse';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return sendSuccess(res, { notifications }, 'Notifications loaded');
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    return sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
