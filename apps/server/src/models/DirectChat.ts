import mongoose, { Schema, Document } from 'mongoose';

export interface IUnreadCount {
  userId: string;
  count: number;
}

export interface IDirectChatMetadata {
  totalMessages: number;
  totalFiles: number;
}

export interface IDirectChatDocument extends Document {
  participants: [mongoose.Types.ObjectId, mongoose.Types.ObjectId];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  unreadCounts: IUnreadCount[];
  mutedBy: mongoose.Types.ObjectId[];
  pinnedBy: mongoose.Types.ObjectId[];
  archivedBy: mongoose.Types.ObjectId[];
  blockedBy: mongoose.Types.ObjectId[];
  metadata: IDirectChatMetadata;
}

const unreadCountSchema = new Schema<IUnreadCount>(
  {
    userId: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const directChatSchema = new Schema<IDirectChatDocument>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (val: mongoose.Types.ObjectId[]) => val.length === 2,
        message: 'Direct chat must have exactly two participants.',
      },
      required: true,
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    unreadCounts: { type: [unreadCountSchema], default: [] },
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    metadata: {
      totalMessages: { type: Number, default: 0 },
      totalFiles: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

directChatSchema.index({ participants: 1 }, { unique: true });
directChatSchema.index({ updatedAt: -1 });

export default mongoose.model<IDirectChatDocument>('DirectChat', directChatSchema);
