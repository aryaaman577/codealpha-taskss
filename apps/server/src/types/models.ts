// Central re-export of all model types for convenience
export type { IUserDocument, IUserSettings, IUserStats } from '../models/User';
export type {
  IMeetingDocument,
  IParticipant,
  IWaitingUser,
  IMeetingSettings,
} from '../models/Meeting';
export type {
  IMessageDocument,
  IReaction,
  IEditHistoryEntry,
  IReadReceipt,
  IAttachment,
  ICodeBlock,
} from '../models/Message';
export type {
  IDirectChatDocument,
  IUnreadCount,
  IDirectChatMetadata,
} from '../models/DirectChat';
export type {
  IGroupChatDocument,
  IGroupMember,
  IGroupChatSettings,
} from '../models/GroupChat';
export type {
  IFileDocument,
  IFileAccess,
  IFileMetadata,
  FileVisibility,
  FileScanStatus,
} from '../models/File';
export type {
  IWhiteboardDocument,
  IWhiteboardObject,
  IWhiteboardHistoryEntry,
  IWhiteboardSettings,
} from '../models/Whiteboard';
export type {
  INotificationDocument,
  INotificationMetadata,
  NotificationType,
  NotificationPriority,
} from '../models/Notification';
