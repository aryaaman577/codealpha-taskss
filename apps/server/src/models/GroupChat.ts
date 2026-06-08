import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupMember {
  user: mongoose.Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
  unreadCount: number;
  mutedUntil?: Date;
}

export interface IGroupChatSettings {
  whoCanMessage: 'everyone' | 'admins';
  whoCanInvite: 'everyone' | 'admins';
  allowFileSharing: boolean;
  allowReactions: boolean;
}

export interface IGroupChatDocument extends Document {
  name: string;
  description: string;
  avatar: string;
  owner: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: IGroupMember[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  settings: IGroupChatSettings;
  inviteCode: string;
  pinnedMessages: mongoose.Types.ObjectId[];
  mutedBy: mongoose.Types.ObjectId[];
  archivedBy: mongoose.Types.ObjectId[];
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0, min: 0 },
    mutedUntil: { type: Date },
  },
  { _id: false },
);

const groupChatSchema = new Schema<IGroupChatDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, default: '', maxlength: 500 },
    avatar: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: { type: [groupMemberSchema], default: [] },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
    settings: {
      whoCanMessage: { type: String, enum: ['everyone', 'admins'], default: 'everyone' },
      whoCanInvite: { type: String, enum: ['everyone', 'admins'], default: 'everyone' },
      allowFileSharing: { type: Boolean, default: true },
      allowReactions: { type: Boolean, default: true },
    },
    inviteCode: { type: String, unique: true, sparse: true },
    pinnedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  },
);

groupChatSchema.index({ owner: 1 });
groupChatSchema.index({ 'members.user': 1 });
groupChatSchema.index({ inviteCode: 1 }, { sparse: true });
groupChatSchema.index({ updatedAt: -1 });

export default mongoose.model<IGroupChatDocument>('GroupChat', groupChatSchema);
