import mongoose, { Schema, Document } from 'mongoose';

export interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IEditHistoryEntry {
  content: string;
  editedAt: Date;
}

export interface IReadReceipt {
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IAttachment {
  url: string;
  publicId: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface ICodeBlock {
  language: string;
  content: string;
}

export interface IMessageDocument extends Document {
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system' | 'code' | 'gif';
  sender: mongoose.Types.ObjectId;
  channelType: 'meeting' | 'direct' | 'group';
  meeting?: mongoose.Types.ObjectId;
  directChat?: mongoose.Types.ObjectId;
  groupChat?: mongoose.Types.ObjectId;
  attachment?: IAttachment;
  codeBlock?: ICodeBlock;
  reactions: IReaction[];
  replyTo?: mongoose.Types.ObjectId;
  edited: boolean;
  editedAt?: Date;
  editHistory: IEditHistoryEntry[];
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  readBy: IReadReceipt[];
  mentions: mongoose.Types.ObjectId[];
  pinned: boolean;
  pinnedBy?: mongoose.Types.ObjectId;
  pinnedAt?: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    emoji: { type: String, required: true, maxlength: 10 },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false },
);

const editHistorySchema = new Schema<IEditHistoryEntry>(
  {
    content: { type: String, required: true },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const readBySchema = new Schema<IReadReceipt>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessageDocument>(
  {
    content: { type: String, required: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'audio', 'video', 'system', 'code', 'gif'],
      default: 'text',
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channelType: {
      type: String,
      enum: ['meeting', 'direct', 'group'],
      required: true,
    },
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    directChat: { type: Schema.Types.ObjectId, ref: 'DirectChat' },
    groupChat: { type: Schema.Types.ObjectId, ref: 'GroupChat' },
    attachment: {
      url: { type: String },
      publicId: { type: String },
      name: { type: String },
      size: { type: Number },
      mimeType: { type: String },
      thumbnailUrl: { type: String },
      duration: { type: Number },
      width: { type: Number },
      height: { type: Number },
    },
    codeBlock: {
      language: { type: String },
      content: { type: String },
    },
    reactions: { type: [reactionSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date },
    editHistory: { type: [editHistorySchema], default: [] },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    readBy: { type: [readBySchema], default: [] },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pinned: { type: Boolean, default: false },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    pinnedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({ sender: 1 });
messageSchema.index({ meeting: 1 });
messageSchema.index({ directChat: 1 });
messageSchema.index({ groupChat: 1 });
messageSchema.index({ channelType: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ deleted: 1 });

export default mongoose.model<IMessageDocument>('Message', messageSchema);
