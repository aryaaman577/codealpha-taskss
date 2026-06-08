import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface Participant {
  user: {
    _id: string;
    displayName: string;
    avatar?: string;
  };
  role: 'host' | 'co-host' | 'participant';
  joinedAt: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
}

interface MeetingStore {
  activeMeeting: any | null;
  participants: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: { [socketId: string]: MediaStream };
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  isLoading: boolean;

  setParticipants: (p: Participant[]) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  addRemoteStream: (socketId: string, stream: MediaStream) => void;
  removeRemoteStream: (socketId: string) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  toggleHandRaised: () => void;
  fetchMeeting: (roomId: string) => Promise<any>;
  clearMeetingState: () => void;
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  activeMeeting: null,
  participants: [],
  localStream: null,
  screenStream: null,
  remoteStreams: {},
  audioEnabled: true,
  videoEnabled: true,
  screenSharing: false,
  handRaised: false,
  isLoading: false,

  setParticipants: (participants) => set({ participants }),
  setLocalStream: (localStream) => set({ localStream }),
  setScreenStream: (screenStream) => set({ screenStream }),
  addRemoteStream: (socketId, stream) =>
    set((state) => ({
      remoteStreams: { ...state.remoteStreams, [socketId]: stream },
    })),
  removeRemoteStream: (socketId) =>
    set((state) => {
      const copy = { ...state.remoteStreams };
      delete copy[socketId];
      return { remoteStreams: copy };
    }),

  setAudioEnabled: (audioEnabled) => {
    const stream = get().localStream;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });
    }
    set({ audioEnabled });
  },

  setVideoEnabled: (videoEnabled) => {
    const stream = get().localStream;
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = videoEnabled;
      });
    }
    set({ videoEnabled });
  },

  setScreenSharing: (screenSharing) => set({ screenSharing }),
  toggleHandRaised: () => set((state) => ({ handRaised: !state.handRaised })),

  fetchMeeting: async (roomId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/meetings/${roomId}`);
      const meeting = response.data.data.meeting;
      set({ activeMeeting: meeting, participants: meeting.participants || [], isLoading: false });
      return meeting;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  clearMeetingState: () => {
    const state = get();
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => track.stop());
    }
    if (state.screenStream) {
      state.screenStream.getTracks().forEach((track) => track.stop());
    }
    set({
      activeMeeting: null,
      participants: [],
      localStream: null,
      screenStream: null,
      remoteStreams: {},
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false,
      handRaised: false,
    });
  },
}));
