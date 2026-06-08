import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboardObject {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'path' | 'text' | 'image' | 'group' | 'arrow';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  style: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
  };
  data: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

export interface IWhiteboardHistoryEntry {
  action: 'add' | 'modify' | 'delete' | 'undo' | 'redo';
  objectId: string;
  user: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IWhiteboardSettings {
  allowEdit: boolean;
  allowExport: boolean;
  allowAnonymousView: boolean;
}

export interface IWhiteboardDocument extends Document {
  title: string;
  owner: mongoose.Types.ObjectId;
  meeting?: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  objects: IWhiteboardObject[];
  version: number;
  thumbnail: string;
  isLocked: boolean;
  history: IWhiteboardHistoryEntry[];
  settings: IWhiteboardSettings;
}

const whiteboardObjectSchema = new Schema<IWhiteboardObject>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['rect', 'circle', 'line', 'path', 'text', 'image', 'group', 'arrow'],
      required: true,
    },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    dimensions: {
      width: { type: Number, required: true, default: 0 },
      height: { type: Number, required: true, default: 0 },
    },
    style: {
      fill: { type: String },
      stroke: { type: String },
      strokeWidth: { type: Number },
      opacity: { type: Number },
      fontSize: { type: Number },
      fontFamily: { type: String },
    },
    data: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false },
);

const historyEntrySchema = new Schema<IWhiteboardHistoryEntry>(
  {
    action: {
      type: String,
      enum: ['add', 'modify', 'delete', 'undo', 'redo'],
      required: true,
    },
    objectId: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const whiteboardSchema = new Schema<IWhiteboardDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    objects: { type: [whiteboardObjectSchema], default: [] },
    version: { type: Number, default: 1, min: 1 },
    thumbnail: { type: String, default: '' },
    isLocked: { type: Boolean, default: false },
    history: { type: [historyEntrySchema], default: [] },
    settings: {
      allowEdit: { type: Boolean, default: true },
      allowExport: { type: Boolean, default: true },
      allowAnonymousView: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

whiteboardSchema.index({ owner: 1 });
whiteboardSchema.index({ meeting: 1 });
whiteboardSchema.index({ collaborators: 1 });

export default mongoose.model<IWhiteboardDocument>('Whiteboard', whiteboardSchema);
