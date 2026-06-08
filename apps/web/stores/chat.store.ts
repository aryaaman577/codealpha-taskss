import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface ChatMessage {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system' | 'code' | 'gif';
  sender: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  channelType: 'meeting' | 'direct' | 'group';
  meeting?: string;
  directChat?: string;
  groupChat?: string;
  attachment?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  };
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  name: string;
  type: 'direct' | 'group';
  participants: Array<{
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  }>;
}

interface ChatStore {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  activeMessages: ChatMessage[];
  typingUsers: string[];
  isLoading: boolean;
  fetchRooms: () => Promise<void>;
  createRoom: (data: { type: 'direct' | 'group'; participantIds: string[]; name?: string }) => Promise<void>;
  fetchMessages: (roomId: string, channelType: 'direct' | 'group' | 'meeting') => Promise<void>;
  setActiveRoom: (room: ChatRoom | null) => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (displayName: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  rooms: [],
  activeRoom: null,
  activeMessages: [],
  typingUsers: [],
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/chats');
      set({ rooms: response.data.data.chats || [], isLoading: false });
    } catch {
      set({ rooms: [], isLoading: false });
    }
  },

  createRoom: async (data) => {
    try {
      const response = await api.post('/chats', data);
      const newRoom = response.data.data.chat;
      set((state) => ({ rooms: [newRoom, ...state.rooms], activeRoom: newRoom }));
      get().fetchMessages(newRoom._id, newRoom.type);
    } catch (err) {
      console.error(err);
    }
  },

  fetchMessages: async (roomId, channelType) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/messages/${channelType}/${roomId}`);
      set({ activeMessages: response.data.data.messages || [], isLoading: false });
    } catch {
      set({ activeMessages: [], isLoading: false });
    }
  },

  setActiveRoom: (room) => {
    set({ activeRoom: room, activeMessages: [], typingUsers: [] });
    if (room) {
      get().fetchMessages(room._id, room.type);
    }
  },

  addMessage: (message) => {
    const active = get().activeRoom;
    // Check if message belongs to current room
    const isCurrentRoom =
      (active && active.type === 'direct' && message.directChat === active._id) ||
      (active && active.type === 'group' && message.groupChat === active._id) ||
      (message.channelType === 'meeting' && message.meeting === active?._id);

    if (isCurrentRoom) {
      set((state) => ({ activeMessages: [...state.activeMessages, message] }));
    }
  },

  setTyping: (displayName, isTyping) => {
    set((state) => {
      const typing = state.typingUsers.filter((u) => u !== displayName);
      if (isTyping) {
        typing.push(displayName);
      }
      return { typingUsers: typing };
    });
  },
}));
