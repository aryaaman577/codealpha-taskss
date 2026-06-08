import mongoose, { Schema, Document } from 'mongoose';

export interface IParticipant {
  user: mongoose.Types.ObjectId;
  role: 'host' | 'co-host' | 'participant';
  joinedAt: Date;
  leftAt?: Date;
  duration: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
}

export interface IWaitingUser {
  user: mongoose.Types.ObjectId;
  joinedWaitAt: Date;
  socketId: string;
}

export interface IMeetingSettings {
  password?: string;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  screenShareEnabled: boolean;
  recordingEnabled: boolean;
  whiteboardEnabled: boolean;
  muteOnJoin: boolean;
  videoOffOnJoin: boolean;
  allowFileShare: boolean;
  allowRaiseHand: boolean;
  allowReactions: boolean;
  lockMeeting: boolean;
}

export interface IMeetingDocument extends Document {
  roomId: string;
  title: string;
  description: string;
  host: mongoose.Types.ObjectId;
  type: 'instant' | 'scheduled';
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  schedule: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    timezone: string;
    recurring: {
      frequency: 'daily' | 'weekly' | 'monthly' | null;
      until?: Date;
    };
  };
  participants: IParticipant[];
  maxParticipants: number;
  settings: IMeetingSettings;
  waitingRoom: IWaitingUser[];
  recording: {
    enabled: boolean;
    startedAt?: Date;
    endedAt?: Date;
    url?: string;
    size?: number;
    cloudinaryId?: string;
  };
  whiteboard?: mongoose.Types.ObjectId;
  files: mongoose.Types.ObjectId[];
  inviteLink?: string;
  passcode?: string;
  chatHistory: boolean;
  tags: string[];
}

const participantSchema = new Schema<IParticipant>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['host', 'co-host', 'participant'], default: 'participant' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    duration: { type: Number, default: 0 },
    audioEnabled: { type: Boolean, default: true },
    videoEnabled: { type: Boolean, default: true },
    screenSharing: { type: Boolean, default: false },
    handRaised: { type: Boolean, default: false },
  },
  { _id: false },
);

const waitingUserSchema = new Schema<IWaitingUser>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedWaitAt: { type: Date, default: Date.now },
    socketId: { type: String, required: true },
  },
  { _id: false },
);

const meetingSchema = new Schema<IMeetingDocument>(
  {
    roomId: { type: String, required: true, unique: true, match: /^[a-zA-Z0-9]{8}$/ },
    title: { type: String, required: true, minlength: 3, maxlength: 100 },
    description: { type: String, maxlength: 500, default: '' },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['instant', 'scheduled'], default: 'instant' },
    status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
    schedule: {
      startTime: { type: Date },
      endTime: { type: Date },
      duration: { type: Number },
      timezone: { type: String, default: 'UTC' },
      recurring: {
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
        until: { type: Date },
      },
    },
    participants: { type: [participantSchema], default: [] },
    maxParticipants: { type: Number, default: 100, min: 2, max: 500 },
    settings: {
      password: { type: String, select: false },
      waitingRoomEnabled: { type: Boolean, default: false },
      chatEnabled: { type: Boolean, default: true },
      screenShareEnabled: { type: Boolean, default: true },
      recordingEnabled: { type: Boolean, default: false },
      whiteboardEnabled: { type: Boolean, default: true },
      muteOnJoin: { type: Boolean, default: false },
      videoOffOnJoin: { type: Boolean, default: false },
      allowFileShare: { type: Boolean, default: true },
      allowRaiseHand: { type: Boolean, default: true },
      allowReactions: { type: Boolean, default: true },
      lockMeeting: { type: Boolean, default: false },
    },
    waitingRoom: { type: [waitingUserSchema], default: [] },
    recording: {
      enabled: { type: Boolean, default: false },
      startedAt: { type: Date },
      endedAt: { type: Date },
      url: { type: String },
      size: { type: Number },
      cloudinaryId: { type: String },
    },
    whiteboard: { type: Schema.Types.ObjectId, ref: 'Whiteboard' },
    files: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    inviteLink: { type: String },
    passcode: { type: String, maxlength: 6 },
    chatHistory: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

meetingSchema.index({ roomId: 1 });
meetingSchema.index({ host: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ createdAt: -1 });
meetingSchema.index({ 'schedule.startTime': 1 });

export default mongoose.model<IMeetingDocument>('Meeting', meetingSchema);
