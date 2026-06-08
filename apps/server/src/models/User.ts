import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    mentions: boolean;
    meetingReminders: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showLastSeen: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  meeting: {
    defaultCameraOn: boolean;
    defaultMicOn: boolean;
    defaultSpeaker: string;
  };
}

export interface IUserStats {
  totalMeetings: number;
  totalHours: number;
  messagesCount: number;
  filesShared: number;
}

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar: string;
  bio: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  customStatus: string;
  role: 'user' | 'admin';
  settings: IUserSettings;
  stats: IUserStats;
  connections: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  refreshTokens: string[];
  emailVerified: boolean;
  emailVerificationOtp?: string;
  emailVerificationOtpExpires?: Date;
  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;
  lastSeen: Date;
  lastActiveRoom?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const settingsSchema = new Schema<IUserSettings>(
  {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      meetingReminders: { type: Boolean, default: true },
    },
    privacy: {
      showOnlineStatus: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
    },
    appearance: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      compactMode: { type: Boolean, default: false },
    },
    meeting: {
      defaultCameraOn: { type: Boolean, default: false },
      defaultMicOn: { type: Boolean, default: false },
      defaultSpeaker: { type: String, default: 'default' },
    },
  },
  { _id: false },
);

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 200, default: '' },
    status: {
      type: String,
      enum: ['online', 'offline', 'idle', 'dnd'],
      default: 'offline',
    },
    customStatus: { type: String, maxlength: 100, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    settings: { type: settingsSchema, default: () => ({}) },
    stats: {
      totalMeetings: { type: Number, default: 0 },
      totalHours: { type: Number, default: 0 },
      messagesCount: { type: Number, default: 0 },
      filesShared: { type: Number, default: 0 },
    },
    connections: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    refreshTokens: { type: [String], select: false, default: [] },
    emailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String, select: false },
    emailVerificationOtpExpires: { type: Date, select: false },
    passwordResetOtp: { type: String, select: false },
    passwordResetOtpExpires: { type: Date, select: false },
    lastSeen: { type: Date, default: Date.now },
    lastActiveRoom: { type: String },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', userSchema);
