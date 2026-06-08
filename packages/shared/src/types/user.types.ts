import { ObjectId } from 'mongoose';

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';
export type UserRole = 'user' | 'admin';

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

export interface IUser {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar: string;
  bio: string;
  status: UserStatus;
  customStatus: string;
  role: UserRole;
  settings: IUserSettings;
  stats: {
    totalMeetings: number;
    totalHours: number;
    messagesCount: number;
    filesShared: number;
  };
  connections: ObjectId[];
  blockedUsers: ObjectId[];
  refreshTokens: string[];
  emailVerified: boolean;
  emailVerifyToken?: string;
  emailVerifyExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastSeen: Date;
  lastActiveRoom?: string;
  createdAt: Date;
  updatedAt: Date;
}
