/**
 * generated_webrtc_fix/types.ts
 *
 * All shared TypeScript types for the WebRTC media implementation.
 * Review every ⚠️ CONFIRM comment — these must match your actual server payload shapes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Socket Adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thin adapter over your existing socket client.
 * Decouples this hook from socket.io specifics.
 *
 * For a standard socket.io client, pass the socket directly:
 *   const socket = io("/")  →  useWebRTCMeeting({ socket, roomId })
 *
 * socket.io v4 Socket satisfies this interface out of the box.
 */
export interface SocketAdapter {
  /** The socket's own ID, e.g. socket.id */
  id: string;

  /** Subscribe to an event */
  on(event: string, handler: (...args: any[]) => void): void;

  /** Unsubscribe from an event */
  off(event: string, handler: (...args: any[]) => void): void;

  /** Emit an event to the server */
  emit(event: string, data: unknown): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook options & return
// ─────────────────────────────────────────────────────────────────────────────

export interface UseWebRTCMeetingOptions {
  /** Your socket.io client instance (or any SocketAdapter). */
  socket: SocketAdapter;

  /**
   * The room/meeting ID — not used internally for signaling but useful
   * for debugging and for future server-emitted events that include roomId.
   */
  roomId: string;
}

export interface UseWebRTCMeetingReturn {
  // ── Streams ───────────────────────────────────────────────────────────────
  /** Local camera (or screen) preview stream. Set muted=true on the <video>. */
  localStream: MediaStream | null;

  /**
   * Map<remoteSocketId, MediaStream>
   * Key is the exact socket ID string used by participants list.
   * Use Array.from(remoteStreams.entries()) to iterate in JSX.
   */
  remoteStreams: Map<string, MediaStream>;

  // ── UI state ──────────────────────────────────────────────────────────────
  micEnabled: boolean;
  cameraEnabled: boolean;
  isScreenSharing: boolean;

  /**
   * Map<remoteSocketId, RTCPeerConnectionState>
   * Values: "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed"
   */
  connectionStates: Map<string, RTCPeerConnectionState>;

  /** Last 10 errors. Each error has code, message, optional socketId, timestamp. */
  errors: WebRTCError[];

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Capture camera + mic. Call this when the user enters the meeting. */
  joinMedia: () => Promise<void>;

  /** Stop all tracks, close all peer connections, remove socket listeners. */
  leaveMedia: () => void;

  /** Toggle audio track .enabled — does NOT remove the track from the connection. */
  toggleMic: () => void;

  /**
   * Toggle camera video track .enabled — does NOT remove the sender.
   * Safe to call while screen sharing (screen share is on a different track).
   */
  toggleCamera: () => void;

  /**
   * Start screen share via getDisplayMedia.
   * Replaces video sender track on ALL existing peer connections — no re-negotiation.
   */
  startScreenShare: () => Promise<void>;

  /**
   * Manually stop screen share and restore camera track.
   * Also called automatically when the user clicks the browser "Stop sharing" button.
   */
  stopScreenShare: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error type
// ─────────────────────────────────────────────────────────────────────────────

export interface WebRTCError {
  /**
   * Error codes:
   *   MEDIA_ACCESS_FAILED    - getUserMedia denied/failed
   *   SCREEN_SHARE_FAILED    - getDisplayMedia denied/failed
   *   OFFER_FAILED           - createOffer / setLocalDescription failed
   *   ANSWER_FAILED          - handleOffer / createAnswer failed
   *   SET_REMOTE_DESC_FAILED - setRemoteDescription (answer) failed
   *   CONNECTION_FAILED      - RTCPeerConnection.connectionState === "failed"
   *   NO_CAMERA_STREAM       - startScreenShare called before joinMedia
   */
  code: string;
  message: string;
  /** The remote socket ID this error relates to, if applicable. */
  socketId?: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Signaling message shapes
// ─────────────────────────────────────────────────────────────────────────────
//
// ⚠️ CONFIRM EACH OF THESE against your actual server emit() calls.
// The field names here are ASSUMPTIONS — your server may use different names.
// See INTEGRATION_GUIDE.md §4 for the full mapping table.
//

/**
 * Emitted by SERVER → to existing room members when a NEW user joins.
 *
 * ⚠️ CONFIRM: field name for the new user's socket ID.
 *             Might be: "socketId" | "userId" | "peerId" | "id"
 */
export interface SignalUserJoined {
  socketId: string; // ⚠️ CONFIRM
  displayName?: string;
}

/**
 * Emitted by SERVER → to all room members when a user disconnects.
 *
 * ⚠️ CONFIRM: same field name as SignalUserJoined
 */
export interface SignalUserLeft {
  socketId: string; // ⚠️ CONFIRM
}

/**
 * CLIENT → SERVER (webrtc-offer)
 * SERVER forwards → targetSocketId client
 *
 * ⚠️ CONFIRM: field names "targetSocketId" and "offer"
 *             Your server must read targetSocketId and forward to that specific socket only.
 */
export interface SignalOfferPayload {
  targetSocketId: string;
  sdp: RTCSessionDescriptionInit;
}

/**
 * SERVER → CLIENT (rtc:offer) — what the answerer receives
 *
 * Server forwards: { sdp, socketId: <sender's socket.id> }
 */
export interface SignalOfferReceived {
  socketId: string;
  sdp: RTCSessionDescriptionInit;
}

/** CLIENT → SERVER (rtc:answer) */
export interface SignalAnswerPayload {
  targetSocketId: string;
  sdp: RTCSessionDescriptionInit;
}

/** SERVER → CLIENT (rtc:answer) */
export interface SignalAnswerReceived {
  socketId: string;
  sdp: RTCSessionDescriptionInit;
}

/** CLIENT → SERVER (rtc:ice-candidate) */
export interface SignalIceCandidatePayload {
  targetSocketId: string;
  candidate: RTCIceCandidateInit;
}

/** SERVER → CLIENT (rtc:ice-candidate) */
export interface SignalIceCandidateReceived {
  socketId: string;
  candidate: RTCIceCandidateInit;
}

// ─────────────────────────────────────────────────────────────────────────────
// RemoteVideo component props
// ─────────────────────────────────────────────────────────────────────────────

export interface RemoteVideoProps {
  /** The remote MediaStream for this peer. */
  stream: MediaStream | null;

  /** The remote peer's socket ID. Used as a key and for debug logging. */
  socketId: string;

  /** Optional CSS class for the wrapper div. */
  className?: string;

  /** Optional inline styles for the wrapper div. */
  style?: React.CSSProperties;

  /**
   * Optional display name to show as an overlay label.
   * Pull this from your participants list by matching socketId.
   */
  displayName?: string;
}
