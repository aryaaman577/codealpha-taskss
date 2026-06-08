import mongoose, { Schema, Document } from 'mongoose';

export type FileVisibility = 'private' | 'shared' | 'public';
export type FileScanStatus = 'pending' | 'clean' | 'blocked';

export interface IFileAccess {
  user: mongoose.Types.ObjectId;
  permission: 'view' | 'download';
  grantedAt: Date;
}

export interface IFileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  format?: string;
  colorSpace?: string;
}

export interface IFileDocument extends Document {
  originalName: string;
  publicId: string;
  url: string;
  secureUrl: string;
  mimeType: string;
  size: number;
  extension: string;
  uploadedBy: mongoose.Types.ObjectId;
  folder: string;
  meeting?: mongoose.Types.ObjectId;
  directChat?: mongoose.Types.ObjectId;
  groupChat?: mongoose.Types.ObjectId;
  tags: string[];
  visibility: FileVisibility;
  access: IFileAccess[];
  scanStatus: FileScanStatus;
  metadata: IFileMetadata;
}

const fileAccessSchema = new Schema<IFileAccess>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permission: { type: String, enum: ['view', 'download'], default: 'view' },
    grantedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const fileSchema = new Schema<IFileDocument>(
  {
    originalName: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    extension: { type: String, required: true, lowercase: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: String, default: 'general' },
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    directChat: { type: Schema.Types.ObjectId, ref: 'DirectChat' },
    groupChat: { type: Schema.Types.ObjectId, ref: 'GroupChat' },
    tags: [{ type: String, maxlength: 50 }],
    visibility: {
      type: String,
      enum: ['private', 'shared', 'public'],
      default: 'private',
    },
    access: { type: [fileAccessSchema], default: [] },
    scanStatus: {
      type: String,
      enum: ['pending', 'clean', 'blocked'],
      default: 'pending',
    },
    metadata: {
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
      pages: { type: Number },
      format: { type: String },
      colorSpace: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ meeting: 1 });
fileSchema.index({ directChat: 1 });
fileSchema.index({ groupChat: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ scanStatus: 1 });

export default mongoose.model<IFileDocument>('File', fileSchema);
