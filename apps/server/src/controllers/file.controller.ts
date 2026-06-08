import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import File from '../models/File';
import Meeting from '../models/Meeting';
import { AppError } from '../utils/AppError';
import { sendSuccess } from '../utils/apiResponse';

export const uploadFileRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, size, mimeType, url, publicId, roomId } = req.body;

    if (!name || !size || !mimeType) {
      throw new AppError('File metadata is incomplete', 400);
    }

    const calculatedUrl = url || `https://syncspace.local/vault/${Date.now()}_${encodeURIComponent(name)}`;
    const calculatedPublicId = publicId || `file_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const calculatedExtension = name.split('.').pop()?.toLowerCase() || 'bin';

    const fileData: any = {
      originalName: name,
      size,
      mimeType,
      url: calculatedUrl,
      secureUrl: calculatedUrl,
      publicId: calculatedPublicId,
      extension: calculatedExtension,
      uploadedBy: req.user._id,
    };
    if (roomId) {
      fileData.meeting = (await Meeting.findOne({ roomId }))?._id;
    }
    const file = await File.create(fileData);

    if (roomId) {
      const meeting = await Meeting.findOne({ roomId });
      if (meeting) {
        await Meeting.findByIdAndUpdate(meeting._id, { $push: { files: file._id } });
      }
    }

    // Populate uploader
    const populated = await file.populate('uploadedBy', 'username displayName avatar');
    return sendSuccess(res, { file: populated }, 'File uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.query;
    const query: any = {};
    if (roomId) {
      const meeting = await Meeting.findOne({ roomId });
      if (meeting) {
        query._id = { $in: meeting.files };
      } else {
  
      }
    } else {
      // Return files uploaded by user or in user's joined rooms
      query.$or = [
        { uploadedBy: req.user._id },
      ];
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'username displayName avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { files }, 'Files loaded');
  } catch (err) {
    next(err);
  }
};

export const deleteFileRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);

    if (!file) throw new AppError('File not found', 404);
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      throw new AppError('You do not have permission to delete this file', 403);
    }

    await File.findByIdAndDelete(id);

    // No sharedIn handling needed as File model does not include sharedIn field

    return sendSuccess(res, null, 'File deleted successfully');
  } catch (err) {
    next(err);
  }
};
