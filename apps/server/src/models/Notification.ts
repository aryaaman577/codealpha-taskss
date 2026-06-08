import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'meeting_invite'
  | 'message'
  | 'file_shared'
  | 'whiteboard_shared'
  | 'system'
  | 'security'
  | 'mention';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface INotificationMetadata {
  meetingId?: string;
  roomId?: string;
  chatId?: string;
  fileId?: string;
  whiteboardId?: string;
  userId?: string;
}

export interface INotificationDocument extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  metadata: INotificationMetadata;
  priority: NotificationPriority;
  expiresAt?: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'meeting_invite',
        'message',
        'file_shared',
        'whiteboard_shared',
        'system',
        'security',
        'mention',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    actionUrl: { type: String },
    metadata: {
      meetingId: { type: String },
      roomId: { type: String },
      chatId: { type: String },
      fileId: { type: String },
      whiteboardId: { type: String },
      userId: { type: String },
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal',
    },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export default mongoose.model<INotificationDocument>('Notification', notificationSchema);
