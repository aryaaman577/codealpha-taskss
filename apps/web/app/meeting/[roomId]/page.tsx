'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { useMeetingStore, Participant } from '@/stores/meeting.store';
import { socket } from '@/lib/socket';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  ScreenShare,
  Hand,
  MessageSquare,
  PenTool,
  PhoneOff,
  Users,
  Send,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface RemotePeer {
  socketId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  audioMuted: boolean;
  videoMuted: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  connectionState: RTCIceConnectionState;
}

interface RemoteVideoProps {
  stream: MediaStream;
  socketId: string;
  peer: RemotePeer;
  onAutoplayBlocked: () => void;
}

const RemoteVideo = ({ stream, socketId, peer, onAutoplayBlocked }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Autoplay blocked for remote stream:', socketId, error);
        if (error.name === 'NotAllowedError') {
          onAutoplayBlocked();
        }
      });
    }
  }, [stream, socketId, onAutoplayBlocked]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-cover"
    />
  );
};

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.roomId as string) || '';
  const { user } = useAuthStore();
  const {
    activeMeeting,
    participants,
    localStream,
    screenStream,
    remoteStreams,
    audioEnabled,
    videoEnabled,
    screenSharing,
    handRaised,
    fetchMeeting,
    setParticipants,
    setLocalStream,
    setScreenStream,
    addRemoteStream,
    removeRemoteStream,
    setAudioEnabled,
    setVideoEnabled,
    setScreenSharing,
    toggleHandRaised,
    clearMeetingState,
  } = useMeetingStore();

  const [joined, setJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'none' | 'chat' | 'whiteboard' | 'participants'>('none');
  const [chatMessage, setChatMessage] = useState('');
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [remotePeers, setRemotePeers] = useState<{ [socketId: string]: RemotePeer }>({});
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushSize, setBrushSize] = useState(4);

  // WebRTC Peer Connections reference
  const pcs = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  const iceQueues = useRef<{ [socketId: string]: any[] }>({});
  const socketToUserMap = useRef<{ [socketId: string]: string }>({});
  const localTracksAdded = useRef<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const cleanupSocketHandlersRef = useRef<(() => void) | null>(null);

  // 1. Fetch meeting info on load
  useEffect(() => {
    if (!roomId) {
      toast.error('Invalid room');
      router.push('/dashboard');
      return;
    }

    fetchMeeting(roomId).catch(() => {
      toast.error('Room not found or invalid');
      router.push('/dashboard');
    });

    return () => {
      // Prevent double-emits + listener leaks
      try {
        disconnectSocket();
      } finally {
        clearMeetingState();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Handle local video element binding
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, joined]);

  const disconnectWebRTC = () => {
    Object.keys(pcs.current).forEach((sid) => {
      try {
        pcs.current[sid].close();
      } catch {
        // ignore
      }
      delete pcs.current[sid];
      removeRemoteStream(sid);
    });
    Object.keys(iceQueues.current).forEach((sid) => {
      delete iceQueues.current[sid];
    });
    Object.keys(socketToUserMap.current).forEach((sid) => {
      delete socketToUserMap.current[sid];
    });
    setRemotePeers({});
    localTracksAdded.current = false;
  };

  const disconnectSocket = () => {
    cleanupSocketHandlersRef.current?.();
    cleanupSocketHandlersRef.current = null;

    // Leave meeting only once, but keep it safe if called before join completed
    if (roomId) {
      try {
        if (socket.connected) socket.emit('meeting:leave', { roomId });
      } catch {
        // ignore
      }
    }

    disconnectWebRTC();
    setJoined(false);
  };

  // 2. Start Call & Join WebRTC Mesh
  const startCall = async () => {
    setMediaError(null);

    if (!roomId) {
      toast.error('Invalid room');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (firstErr: any) {
        console.warn('Full media request failed, trying audio-only fallback...', firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setVideoEnabled(false);
        } catch (secondErr: any) {
          console.warn('Audio-only fallback failed, trying video-only fallback...', secondErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            setAudioEnabled(false);
          } catch (thirdErr: any) {
            throw firstErr;
          }
        }
      }

      setLocalStream(stream);
      setAudioEnabled(stream.getAudioTracks().length > 0);
      setVideoEnabled(stream.getVideoTracks().length > 0);
      setJoined(true);

      // Connect socket if not connected
      if (!socket.connected) socket.connect();

      // Configure WebRTC mesh signaling listeners once
      if (!cleanupSocketHandlersRef.current) {
        cleanupSocketHandlersRef.current = setupSignaling(stream);
      }

      // Join room with initial media state
      const initialAudioMuted = stream.getAudioTracks().length === 0 || !stream.getAudioTracks()[0].enabled;
      const initialVideoMuted = stream.getVideoTracks().length === 0 || !stream.getVideoTracks()[0].enabled;

      socket.emit('meeting:join', {
        roomId,
        audioMuted: initialAudioMuted,
        videoMuted: initialVideoMuted,
      });
      toast.success('Joined meeting room');
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera/Microphone permission was denied. Please allow access and try again.'
          : err?.name === 'NotFoundError'
            ? 'No camera or microphone found. Connect a device and try again.'
            : 'Failed to access camera or microphone. Please try again.';
      setMediaError(msg);
      toast.error('Could not access camera/microphone');
    }
  };

  const createOrGetPeerConnection = (socketId: string, stream: MediaStream): RTCPeerConnection => {
    const existing = pcs.current[socketId];
    if (existing) return existing;

    const iceServers: RTCIceServer[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ];

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl && turnUsername && turnCredential) {
      iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    const pc = new RTCPeerConnection({ iceServers });

    const activeVideoStream = (screenSharing && useMeetingStore.getState().screenStream)
      ? useMeetingStore.getState().screenStream
      : stream;

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = activeVideoStream?.getVideoTracks()[0];

    if (audioTrack) {
      try {
        pc.addTrack(audioTrack, stream);
      } catch (e) {}
    }
    if (videoTrack && activeVideoStream) {
      try {
        pc.addTrack(videoTrack, activeVideoStream);
      } catch (e) {}
    }

    // Stream tracks from remote peer
    pc.ontrack = (event) => {
      console.log('ontrack received for socket:', socketId, event);
      if (event.streams && event.streams[0]) {
        addRemoteStream(socketId, event.streams[0]);
      } else {
        const fallbackStream = new MediaStream();
        fallbackStream.addTrack(event.track);
        addRemoteStream(socketId, fallbackStream);
      }
    };

    // Emit ICE candidates to signaling server
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('rtc:ice-candidate', {
          targetSocketId: socketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state change for:', socketId, pc.iceConnectionState);
      setRemotePeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            connectionState: pc.iceConnectionState,
          },
        };
      });
    };

    pcs.current[socketId] = pc;
    return pc;
  };

  const cleanupPeer = (socketId: string) => {
    const pc = pcs.current[socketId];
    if (pc) {
      try {
        pc.close();
      } catch {
        // ignore
      }
      delete pcs.current[socketId];
    }
    delete iceQueues.current[socketId];
    delete socketToUserMap.current[socketId];
    removeRemoteStream(socketId);
  };

  const setupSignaling = (stream: MediaStream) => {
    const processIceQueue = async (socketId: string) => {
      const pc = pcs.current[socketId];
      if (!pc || !pc.remoteDescription) return;

      const queue = iceQueues.current[socketId] || [];
      iceQueues.current[socketId] = [];

      for (const candidateData of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateData));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
    };

    const onRoomActivePeers = (peers: any[]) => {
      console.log('Received active peers:', peers);
      const newPeers: { [socketId: string]: RemotePeer } = {};
      peers.forEach((peer) => {
        socketToUserMap.current[peer.socketId] = peer.userId;
        newPeers[peer.socketId] = {
          socketId: peer.socketId,
          userId: peer.userId,
          displayName: peer.displayName || 'Participant',
          avatar: peer.avatar,
          audioMuted: peer.audioMuted ?? false,
          videoMuted: peer.videoMuted ?? false,
          screenSharing: peer.screenSharing ?? false,
          handRaised: peer.handRaised ?? false,
          connectionState: 'new',
        };
      });
      setRemotePeers(newPeers);
    };

    const onPeerJoined = async (data: {
      userId: string;
      socketId: string;
      displayName?: string;
      avatar?: string;
      audioMuted?: boolean;
      videoMuted?: boolean;
      screenSharing?: boolean;
      handRaised?: boolean;
    }) => {
      console.log('Peer joined room:', data);
      if (!data?.socketId) return;
      if (data.userId) {
        socketToUserMap.current[data.socketId] = data.userId;
      }

      setRemotePeers((prev) => ({
        ...prev,
        [data.socketId]: {
          socketId: data.socketId,
          userId: data.userId,
          displayName: data.displayName || 'Participant',
          avatar: data.avatar,
          audioMuted: data.audioMuted ?? false,
          videoMuted: data.videoMuted ?? false,
          screenSharing: data.screenSharing ?? false,
          handRaised: data.handRaised ?? false,
          connectionState: 'new',
        },
      }));

      const pc = createOrGetPeerConnection(data.socketId, stream);

      // Existing peers initiate offer to new joining peer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('rtc:offer', { targetSocketId: data.socketId, sdp: pc.localDescription });
    };

    const onOffer = async (data: { sdp: any; socketId: string }) => {
      console.log('Received WebRTC offer from:', data.socketId);
      if (!data?.socketId) return;

      const pc = createOrGetPeerConnection(data.socketId, stream);

      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await processIceQueue(data.socketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('rtc:answer', { targetSocketId: data.socketId, sdp: answer });
    };

    const onAnswer = async (data: { sdp: any; socketId: string }) => {
      console.log('Received WebRTC answer from:', data.socketId);
      const pc = pcs.current[data.socketId];
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await processIceQueue(data.socketId);
    };

    const onIceCandidate = async (data: { candidate: any; socketId: string }) => {
      const pc = pcs.current[data.socketId];
      if (!pc) return;
      if (!data?.candidate) return;

      const candidate = new RTCIceCandidate(data.candidate);
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        if (!iceQueues.current[data.socketId]) {
          iceQueues.current[data.socketId] = [];
        }
        iceQueues.current[data.socketId].push(data.candidate);
      }
    };

    const onPeerLeft = (data: { userId: string; socketId?: string }) => {
      console.log('Peer left room:', data);
      const socketId = data?.socketId;
      if (socketId) {
        cleanupPeer(socketId);
        setRemotePeers((prev) => {
          const copy = { ...prev };
          delete copy[socketId];
          return copy;
        });
      } else if (data?.userId) {
        Object.entries(socketToUserMap.current).forEach(([sid, uid]) => {
          if (uid === data.userId) {
            cleanupPeer(sid);
            setRemotePeers((prev) => {
              const copy = { ...prev };
              delete copy[sid];
              return copy;
            });
          }
        });
      }
    };

    const onParticipantsUpdate = (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants);
    };

    const onChatMessageNew = (msg: any) => {
      setChatLogs((logs) => [...logs, msg]);
    };

    const onWhiteboardObjectAdd = (data: any) => {
      drawOnCanvas(data.startX, data.startY, data.endX, data.endY, data.color, data.size, false);
    };

    const onParticipantMediaState = (data: {
      socketId: string;
      audioMuted?: boolean;
      videoMuted?: boolean;
      screenSharing?: boolean;
      handRaised?: boolean;
    }) => {
      console.log('Participant media state changed:', data);
      setRemotePeers((prev) => {
        if (!prev[data.socketId]) return prev;
        return {
          ...prev,
          [data.socketId]: {
            ...prev[data.socketId],
            audioMuted: data.audioMuted !== undefined ? data.audioMuted : prev[data.socketId].audioMuted,
            videoMuted: data.videoMuted !== undefined ? data.videoMuted : prev[data.socketId].videoMuted,
            screenSharing: data.screenSharing !== undefined ? data.screenSharing : prev[data.socketId].screenSharing,
            handRaised: data.handRaised !== undefined ? data.handRaised : prev[data.socketId].handRaised,
          },
        };
      });
    };

    socket.on('meeting:room-active-peers', onRoomActivePeers);
    socket.on('rtc:peer:joined', onPeerJoined);
    socket.on('rtc:offer', onOffer);
    socket.on('rtc:answer', onAnswer);
    socket.on('rtc:ice-candidate', onIceCandidate);
    socket.on('rtc:peer:left', onPeerLeft);
    socket.on('meeting:participant:media-state', onParticipantMediaState);

    socket.on('meeting:participants:update', onParticipantsUpdate);
    socket.on('chat:message:new', onChatMessageNew);
    socket.on('whiteboard:object:add', onWhiteboardObjectAdd);

    return () => {
      socket.off('meeting:room-active-peers', onRoomActivePeers);
      socket.off('rtc:peer:joined', onPeerJoined);
      socket.off('rtc:offer', onOffer);
      socket.off('rtc:answer', onAnswer);
      socket.off('rtc:ice-candidate', onIceCandidate);
      socket.off('rtc:peer:left', onPeerLeft);
      socket.off('meeting:participant:media-state', onParticipantMediaState);

      socket.off('meeting:participants:update', onParticipantsUpdate);
      socket.off('chat:message:new', onChatMessageNew);
      socket.off('whiteboard:object:add', onWhiteboardObjectAdd);
    };
  };

  // 3. Audio / Video Actions
  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    socket.emit('meeting:participant:mute', { roomId, muted: !nextState });
    socket.emit('meeting:media-state-changed', { roomId, audioMuted: !nextState });
  };

  const toggleVideo = () => {
    const nextState = !videoEnabled;
    setVideoEnabled(nextState);
    socket.emit('meeting:participant:camera', { roomId, cameraOff: !nextState });
    socket.emit('meeting:media-state-changed', { roomId, videoMuted: !nextState });
  };

  const handleRaiseHand = () => {
    toggleHandRaised();
    socket.emit('meeting:hand:raise', { roomId, raised: !handRaised });
    socket.emit('meeting:media-state-changed', { roomId, handRaised: !handRaised });
  };

  const toggleScreenShare = async () => {
    if (!joined) return;

    if (screenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setScreenSharing(false);

      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          for (const [socketId, pc] of Object.entries(pcs.current)) {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(videoTrack).catch((err) => console.error(err));
            }
          }
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        } else {
          // No camera track to replace with; renegotiate to remove video track
          for (const [socketId, pc] of Object.entries(pcs.current)) {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track?.kind === 'video');
            if (sender) {
              pc.removeTrack(sender);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('rtc:offer', { targetSocketId: socketId, sdp: pc.localDescription });
            }
          }
        }
      }
      socket.emit('meeting:participant:screenshare', { roomId, sharing: false });
      socket.emit('meeting:media-state-changed', { roomId, screenSharing: false });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setScreenSharing(true);

        const screenTrack = stream.getVideoTracks()[0];
        if (screenTrack) {
          for (const [socketId, pc] of Object.entries(pcs.current)) {
            const senders = pc.getSenders();
            const sender = senders.find((s) => s.track?.kind === 'video');
            if (sender) {
              await sender.replaceTrack(screenTrack).catch((err) => console.error(err));
            } else {
              // Video track did not exist; add track dynamically and renegotiate
              pc.addTrack(screenTrack, stream);
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('rtc:offer', { targetSocketId: socketId, sdp: pc.localDescription });
            }
          }

          screenTrack.onended = async () => {
            stream.getTracks().forEach((track) => track.stop());
            setScreenStream(null);
            setScreenSharing(false);

            if (localStream) {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                for (const [socketId, pc] of Object.entries(pcs.current)) {
                  const senders = pc.getSenders();
                  const sender = senders.find((s) => s.track?.kind === 'video');
                  if (sender) {
                    await sender.replaceTrack(videoTrack).catch((err) => console.error(err));
                  }
                }
                if (localVideoRef.current) {
                  localVideoRef.current.srcObject = localStream;
                }
              } else {
                for (const [socketId, pc] of Object.entries(pcs.current)) {
                  const senders = pc.getSenders();
                  const sender = senders.find((s) => s.track?.kind === 'video');
                  if (sender) {
                    pc.removeTrack(sender);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('rtc:offer', { targetSocketId: socketId, sdp: pc.localDescription });
                  }
                }
              }
            }
            socket.emit('meeting:participant:screenshare', { roomId, sharing: false });
            socket.emit('meeting:media-state-changed', { roomId, screenSharing: false });
          };

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
        socket.emit('meeting:participant:screenshare', { roomId, sharing: true });
        socket.emit('meeting:media-state-changed', { roomId, screenSharing: true });
      } catch (err) {
        console.error('Screen share failed:', err);
        toast.error('Could not share screen');
      }
    }
  };

  // 4. Whiteboard Draw Actions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lastX = parseFloat(canvas.getAttribute('data-last-x') || '0');
    const lastY = parseFloat(canvas.getAttribute('data-last-y') || '0');

    drawOnCanvas(lastX, lastY, x, y, brushColor, brushSize, true);

    canvas.setAttribute('data-last-x', x.toString());
    canvas.setAttribute('data-last-y', y.toString());
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const drawOnCanvas = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string,
    size: number,
    emit: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (emit) {
      socket.emit('whiteboard:object:add', {
        whiteboardId: roomId,
        startX,
        startY,
        endX,
        endY,
        color,
        size,
      });
    }
  };

  // 5. Chat Actions
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    socket.emit('chat:message:send', {
      content: chatMessage.trim(),
      type: 'text',
      channelType: 'meeting',
      meetingId: activeMeeting?._id,
    });

    setChatMessage('');
  };

  const handleEnableAudio = () => {
    setAutoplayBlocked(false);
    const videos = document.querySelectorAll('video');
    videos.forEach((video) => {
      video.play().catch((err) => console.error('Failed to play video on user gesture:', err));
    });
  };

  return (
    <main className="min-h-screen bg-bg-base text-text-primary flex flex-col justify-between relative">
      {/* Autoplay Blocker Warning Banner */}
      {autoplayBlocked && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-accent-primary border border-accent-primary/40 px-5 py-3 rounded-2xl shadow-glow-sm flex items-center gap-4 max-w-sm backdrop-blur-lg">
          <span className="text-xs font-semibold text-white">Audio playback blocked by browser.</span>
          <button
            onClick={handleEnableAudio}
            className="bg-white hover:bg-white/95 text-accent-primary text-xs font-bold px-3 py-1.5 rounded-xl transition"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Top Header Room Banner */}
      <header className="h-16 border-b border-border-subtle bg-bg-surface/60 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div>
          <h2 className="text-sm font-semibold tracking-wider text-accent-cyan uppercase">SyncSpace Call</h2>
          <h1 className="text-base font-bold text-text-primary mt-0.5">{activeMeeting?.title || `Room ${roomId}`}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-secondary">
            Room Code: <span className="font-mono text-text-primary font-bold">{roomId}</span>
          </span>
        </div>
      </header>

      {/* Main Split Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Video streams grid */}
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center overflow-y-auto min-w-0">
          {!joined ? (
            <div className="text-center max-w-md p-8 rounded-3xl border border-border-default bg-bg-surface/50 backdrop-blur-md">
              <h2 className="text-xl font-bold font-display">Ready to join the meeting?</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Turn on your camera and microphone to start collaboration.
              </p>
              {mediaError && (
                <div className="mt-4 p-3.5 rounded-2xl bg-semantic-error/10 border border-semantic-error/30 text-semantic-error text-xs leading-relaxed">
                  {mediaError}
                </div>
              )}
              <button
                onClick={startCall}
                className="mt-6 w-full rounded-2xl bg-accent-primary hover:bg-accent-hover px-6 py-3.5 text-xs font-semibold text-white shadow-glow-sm transition"
              >
                Join meeting call
              </button>
            </div>
          ) : (
            <div className="w-full h-full max-w-5xl grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Local Stream Video Box */}
              <div className="relative rounded-[28px] overflow-hidden border border-border-default bg-bg-surface flex items-center justify-center shadow-card aspect-video">
                {videoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-20 w-20 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple font-bold text-2xl border border-accent-purple/35">
                      {user?.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-text-secondary">Camera is Off</span>
                  </div>
                )}
                
                {/* Labels and indicators */}
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-2">
                  <span>You ({user?.displayName})</span>
                  {handRaised && <span>✋</span>}
                  {screenSharing && <span className="text-accent-cyan font-semibold">💻 Sharing</span>}
                </div>
                
                {/* Status indicators */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  {!audioEnabled && (
                    <div className="h-8 w-8 rounded-full bg-semantic-error/80 flex items-center justify-center text-white backdrop-blur-sm shadow-md">
                      <MicOff size={14} />
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Streams Video Boxes */}
              {Object.values(remotePeers).map((peer) => {
                const stream = remoteStreams[peer.socketId];
                const isVideoOn = !peer.videoMuted && stream;
                return (
                  <div
                    key={peer.socketId}
                    className="relative rounded-[28px] overflow-hidden border border-border-default bg-bg-surface flex items-center justify-center shadow-card aspect-video"
                  >
                    {isVideoOn ? (
                      <RemoteVideo
                        stream={stream}
                        socketId={peer.socketId}
                        peer={peer}
                        onAutoplayBlocked={() => setAutoplayBlocked(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold text-2xl border border-accent-cyan/35">
                          {peer.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-text-secondary">Camera is Off</span>
                      </div>
                    )}

                    {/* Connection status overlay if not connected */}
                    {peer.connectionState !== 'connected' && peer.connectionState !== 'new' && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs text-text-secondary">
                        <span className="capitalize">Connection: {peer.connectionState}</span>
                      </div>
                    )}

                    {/* Labels and indicators */}
                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-2">
                      <span>{peer.displayName}</span>
                      {peer.handRaised && <span>✋</span>}
                      {peer.screenSharing && <span className="text-accent-cyan font-semibold">💻 Sharing</span>}
                    </div>

                    {/* Status indicators */}
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      {peer.audioMuted && (
                        <div className="h-8 w-8 rounded-full bg-semantic-error/80 flex items-center justify-center text-white backdrop-blur-sm shadow-md">
                          <MicOff size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Reusable Tab Drawer Panels */}
        {activeTab !== 'none' && (
          <aside className="fixed md:static top-16 right-0 bottom-20 w-80 md:w-96 border-l border-border-subtle bg-bg-surface/90 backdrop-blur-lg flex flex-col justify-between z-10 overflow-hidden">
            {/* Header tab control */}
            <div className="h-14 border-b border-border-subtle flex items-center justify-between px-4">
              <h3 className="text-sm font-bold font-display capitalize">
                {activeTab === 'chat' && 'Meeting chat'}
                {activeTab === 'whiteboard' && 'Shared whiteboard'}
                {activeTab === 'participants' && 'Active participants'}
              </h3>
              <button onClick={() => setActiveTab('none')} className="text-text-secondary hover:text-white p-1 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Tab content viewports */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Chat View */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {chatLogs.length === 0 ? (
                      <p className="text-center text-xs text-text-muted mt-12">No messages in room yet.</p>
                    ) : (
                      chatLogs.map((msg, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="h-7 w-7 rounded-full bg-accent-cyan/15 flex items-center justify-center text-[10px] font-bold text-accent-cyan border border-accent-cyan/25">
                            {msg.sender?.displayName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 bg-bg-base/50 border border-border-subtle rounded-2xl px-3 py-2">
                            <span className="text-[10px] font-semibold text-text-primary block">{msg.sender?.displayName}</span>
                            <p className="text-xs text-text-secondary mt-0.5">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendChat} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      placeholder="Send a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-1 rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-xs text-text-primary outline-none transition focus:border-accent-primary"
                    />
                    <button type="submit" className="rounded-xl bg-accent-primary p-2.5 text-white shadow-glow-sm">
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}

              {/* Whiteboard Drawing Canvas View */}
              {activeTab === 'whiteboard' && (
                <div className="h-full flex flex-col justify-between">
                  <div className="border border-border-default rounded-2xl overflow-hidden bg-bg-base flex-1 relative min-h-[300px]">
                    <canvas
                      ref={canvasRef}
                      width={350}
                      height={400}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="h-full w-full cursor-crosshair"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    {/* Brush Sizes */}
                    <div className="flex gap-1.5">
                      {[2, 4, 8].map((size) => (
                        <button
                          key={size}
                          onClick={() => setBrushSize(size)}
                          className={`h-6 w-6 rounded-lg text-[10px] font-bold border transition ${brushSize === size ? 'bg-accent-primary text-white border-accent-primary' : 'border-border-default text-text-secondary hover:bg-bg-elevated'}`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                    {/* Color Picks */}
                    <div className="flex gap-2">
                      {['#6366f1', '#06b6d4', '#a855f7', '#ef4444'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setBrushColor(color)}
                          className="h-5 w-5 rounded-full border border-border-subtle"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Participants View */}
              {activeTab === 'participants' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-base/30 border border-border-subtle">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-accent-primary flex items-center justify-center text-xs font-bold text-white">
                        {user?.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-text-primary">{user?.displayName} (You)</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {handRaised && '✋'}
                      {!audioEnabled && '🔇'}
                    </div>
                  </div>
                  {Object.values(remotePeers).map((peer) => (
                    <div key={peer.socketId} className="flex items-center justify-between p-2.5 rounded-xl bg-bg-base/30 border border-border-subtle">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-accent-cyan flex items-center justify-center text-xs font-bold text-white">
                          {peer.displayName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-text-primary">{peer.displayName}</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {peer.handRaised && '✋'}
                        {peer.audioMuted && '🔇'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Floating Controls Bar */}
      <footer className="h-20 border-t border-border-subtle bg-bg-surface/80 backdrop-blur-md flex items-center justify-center gap-4 px-6 z-20">
        <button
          onClick={toggleAudio}
          className={`p-3.5 rounded-full border transition duration-200 ${audioEnabled ? 'border-border-default hover:bg-bg-elevated text-text-primary' : 'border-semantic-error/40 bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20'}`}
          title={audioEnabled ? 'Mute Mic' : 'Unmute Mic'}
        >
          {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3.5 rounded-full border transition duration-200 ${videoEnabled ? 'border-border-default hover:bg-bg-elevated text-text-primary' : 'border-semantic-error/40 bg-semantic-error/10 text-semantic-error hover:bg-semantic-error/20'}`}
          title={videoEnabled ? 'Stop Video' : 'Start Video'}
        >
          {videoEnabled ? <VideoIcon size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-full border transition duration-200 ${screenSharing ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan' : 'border-border-default hover:bg-bg-elevated text-text-primary'}`}
          title={screenSharing ? 'Stop Sharing Screen' : 'Share Screen'}
        >
          <ScreenShare size={18} />
        </button>

        <button
          onClick={handleRaiseHand}
          className={`p-3.5 rounded-full border transition duration-200 ${handRaised ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'border-border-default hover:bg-bg-elevated text-text-primary'}`}
          title="Raise Hand"
        >
          <Hand size={18} />
        </button>

        <div className="h-6 w-[1px] bg-border-subtle mx-2" />

        <button
          onClick={() => setActiveTab(activeTab === 'whiteboard' ? 'none' : 'whiteboard')}
          className={`p-3.5 rounded-full border transition duration-200 ${activeTab === 'whiteboard' ? 'bg-accent-primary text-white border-accent-primary' : 'border-border-default hover:bg-bg-elevated text-text-primary'}`}
          title="Toggle Whiteboard"
        >
          <PenTool size={18} />
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'chat' ? 'none' : 'chat')}
          className={`p-3.5 rounded-full border transition duration-200 ${activeTab === 'chat' ? 'bg-accent-primary text-white border-accent-primary' : 'border-border-default hover:bg-bg-elevated text-text-primary'}`}
          title="Toggle Chat"
        >
          <MessageSquare size={18} />
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'participants' ? 'none' : 'participants')}
          className={`p-3.5 rounded-full border transition duration-200 ${activeTab === 'participants' ? 'bg-accent-primary text-white border-accent-primary' : 'border-border-default hover:bg-bg-elevated text-text-primary'}`}
          title="Toggle Participants"
        >
          <Users size={18} />
        </button>

        <button
          onClick={() => {
            disconnectSocket();
            clearMeetingState();
            router.push('/dashboard');
          }}
          className="p-3.5 rounded-full border border-semantic-error hover:bg-semantic-error text-semantic-error hover:text-white transition duration-200 ml-4"
          title="Leave Meeting"
        >
          <PhoneOff size={18} />
        </button>
      </footer>
    </main>
  );
}
