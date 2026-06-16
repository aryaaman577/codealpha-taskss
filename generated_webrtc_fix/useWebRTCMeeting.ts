/**
 * generated_webrtc_fix/useWebRTCMeeting.ts
 *
 * Production-quality WebRTC media hook for multi-party meetings.
 *
 * Architecture overview:
 *
 *   One RTCPeerConnection per remote socket ID.
 *   Signaling flow (the hook handles both roles):
 *
 *     OFFERER role (triggered by user-joined):
 *       user-joined received → create PC → add tracks → createOffer
 *       → setLocalDescription → emit webrtc-offer
 *
 *     ANSWERER role (triggered by webrtc-offer):
 *       webrtc-offer received → create PC → add tracks
 *       → setRemoteDescription → createAnswer
 *       → setLocalDescription → emit webrtc-answer
 *
 *   ICE candidates are queued until remote description is set,
 *   preventing the "addIceCandidate before setRemoteDescription" bug.
 *
 *   Screen share uses replaceTrack — no re-negotiation needed.
 *
 * ⚠️ Event names this hook listens for / emits:
 *   See INTEGRATION_GUIDE.md §4 for the full mapping table.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { webrtcDebug as debug, webrtcError } from "./webrtcDebug";
import type {
  UseWebRTCMeetingOptions,
  UseWebRTCMeetingReturn,
  WebRTCError,
  SignalUserJoined,
  SignalUserLeft,
  SignalOfferReceived,
  SignalAnswerReceived,
  SignalIceCandidateReceived,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// ICE server configuration
// ─────────────────────────────────────────────────────────────────────────────

const getIceServers = (): RTCIceServer[] => {
  const stunServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  if (typeof window === "undefined") return stunServers;

  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrls) {
    const urls = turnUrls.split(",").map(u => u.trim());
    return [
      ...stunServers,
      {
        urls,
        username: turnUsername,
        credential: turnCredential,
      }
    ];
  }

  return stunServers;
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useWebRTCMeeting({
  socket,
  roomId,
}: UseWebRTCMeetingOptions): UseWebRTCMeetingReturn {

  // ── Stable refs — mutations do NOT trigger re-renders ──────────────────────

  /** Local camera + mic stream (kept alive for the duration of the meeting) */
  const cameraStreamRef = useRef<MediaStream | null>(null);

  /** Screen share stream (replaced on each share, null when not sharing) */
  const screenStreamRef = useRef<MediaStream | null>(null);

  /** One peer connection per remote socket ID */
  const peerConnsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  /**
   * ICE candidates that arrived before remote description was set.
   * Flushed immediately after setRemoteDescription succeeds.
   */
  const iceCandidateQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  /**
   * Tracks which peer connections have had their remote description set.
   * Used to decide whether to apply or queue incoming ICE candidates.
   */
  const remoteDescSetRef = useRef<Set<string>>(new Set());

  // ── React state — drives UI re-renders ────────────────────────────────────

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStates, setConnectionStates] = useState<Map<string, RTCPeerConnectionState>>(new Map());
  const [errors, setErrors] = useState<WebRTCError[]>([]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const addError = useCallback((code: string, message: string, socketId?: string) => {
    webrtcError(code, { message, socketId });
    setErrors((prev) => [
      ...prev.slice(-9), // keep last 10 errors
      { code, message, socketId, timestamp: Date.now() },
    ]);
  }, []);

  const updateConnectionState = useCallback(
    (socketId: string, state: RTCPeerConnectionState) => {
      setConnectionStates((prev) => new Map(prev).set(socketId, state));
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // createPeerConnection
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Creates a new RTCPeerConnection for the given remote socket ID.
   * Attaches ALL event handlers immediately (before any tracks or SDP).
   *
   * ⚠️ ontrack MUST be attached before setRemoteDescription — this is guaranteed
   *    here because createPeerConnection is always called first.
   */
  const createPeerConnection = useCallback(
    (remoteSocketId: string): RTCPeerConnection => {
      debug("peer-connection-created", { remoteSocketId, roomId });

      const pc = new RTCPeerConnection({ iceServers: getIceServers() });

      // Store immediately so other handlers can find it
      peerConnsRef.current.set(remoteSocketId, pc);
      iceCandidateQueuesRef.current.set(remoteSocketId, []);

      // ── ontrack: remote media arrived ──────────────────────────────────────
      //
      // Critical: this fires once per track (audio, video separately).
      // streams[0] is the same MediaStream object for all tracks from the same
      // sender because they share an msid in the SDP.
      //
      pc.ontrack = ({ streams, track }) => {
        const remoteStream = streams[0];
        debug("ontrack-fired", {
          remoteSocketId,
          trackKind: track.kind,
          trackId: track.id,
          streamId: remoteStream?.id,
        });

        if (!remoteStream) {
          // Fallback: build stream manually if sender didn't attach one
          // (shouldn't happen with our implementation, but guard anyway)
          debug("ontrack-no-stream", { remoteSocketId });
          return;
        }

        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remoteSocketId, remoteStream);
          debug("remote-stream-stored", {
            remoteSocketId,
            streamId: remoteStream.id,
            trackCount: remoteStream.getTracks().length,
          });
          return next;
        });
      };

      // ── onicecandidate: send our ICE candidates to the remote peer ─────────
      pc.onicecandidate = ({ candidate }) => {
        if (!candidate) {
          debug("ice-gathering-complete", { remoteSocketId });
          return; // null candidate = end-of-candidates, don't send it
        }
        debug("ice-candidate-sent", {
          remoteSocketId,
          protocol: candidate.protocol,
          type: candidate.type,
        });
        socket.emit("rtc:ice-candidate", {
          targetSocketId: remoteSocketId,
          candidate: candidate.toJSON(),
        });
      };

      // ── connectionState: overall connection health ─────────────────────────
      pc.onconnectionstatechange = () => {
        debug("connection-state-change", {
          remoteSocketId,
          state: pc.connectionState,
        });
        updateConnectionState(remoteSocketId, pc.connectionState);

        if (pc.connectionState === "failed") {
          addError(
            "CONNECTION_FAILED",
            `RTCPeerConnection to ${remoteSocketId} failed`,
            remoteSocketId
          );
        }
      };

      // ── iceConnectionState: ICE negotiation progress ───────────────────────
      pc.oniceconnectionstatechange = () => {
        debug("ice-connection-state-change", {
          remoteSocketId,
          state: pc.iceConnectionState,
        });
        // Attempt ICE restart on failure (works for relayed connections)
        if (pc.iceConnectionState === "failed") {
          debug("ice-restart-attempt", { remoteSocketId });
          pc.restartIce();
        }
      };

      // ── signalingState: SDP negotiation phase ─────────────────────────────
      pc.onsignalingstatechange = () => {
        debug("signaling-state-change", {
          remoteSocketId,
          state: pc.signalingState,
        });
      };

      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, addError, updateConnectionState, roomId]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // addTracksToPeerConnection
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Adds all tracks from a stream to a peer connection.
   * Guards against duplicate addTrack calls (checked by track object identity).
   */
  const addTracksToPeerConnection = useCallback(
    (pc: RTCPeerConnection, stream: MediaStream, remoteSocketId: string) => {
      const existingSenders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const alreadyAdded = existingSenders.some((s) => s.track === track);
        if (!alreadyAdded) {
          pc.addTrack(track, stream);
          debug("local-track-added", {
            remoteSocketId,
            trackKind: track.kind,
            trackId: track.id,
            trackEnabled: track.enabled,
          });
        }
      });
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // flushIceCandidateQueue
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Applies all queued ICE candidates for a peer connection.
   * Must be called immediately after setRemoteDescription succeeds.
   */
  const flushIceCandidateQueue = useCallback(
    async (remoteSocketId: string, pc: RTCPeerConnection): Promise<void> => {
      const queue = iceCandidateQueuesRef.current.get(remoteSocketId) ?? [];
      debug("ice-candidate-queue-flush", {
        remoteSocketId,
        count: queue.length,
      });

      for (const candidateInit of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          debug("ice-candidate-added-from-queue", { remoteSocketId });
        } catch (e) {
          debug("ice-candidate-add-failed", {
            remoteSocketId,
            error: String(e),
          });
        }
      }

      iceCandidateQueuesRef.current.set(remoteSocketId, []);
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // joinMedia
  // ─────────────────────────────────────────────────────────────────────────────

  const joinMedia = useCallback(async (): Promise<void> => {
    debug("join-media-called", { roomId });

    // Prevent double-capture if called twice
    if (cameraStreamRef.current) {
      debug("join-media-already-active", {});
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      cameraStreamRef.current = stream;
      setLocalStream(stream);

      debug("local-tracks-captured", {
        tracks: stream.getTracks().map((t) => ({
          kind: t.kind,
          id: t.id,
          label: t.label,
          enabled: t.enabled,
        })),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      addError("MEDIA_ACCESS_FAILED", `getUserMedia failed: ${message}`);
      debug("get-user-media-failed", { error: message });
      throw e;
    }
  }, [addError, roomId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // leaveMedia
  // ─────────────────────────────────────────────────────────────────────────────

  const leaveMedia = useCallback((): void => {
    debug("leave-media-called", {});

    // Stop all camera tracks
    cameraStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
      debug("camera-track-stopped", { trackId: t.id, kind: t.kind });
    });
    cameraStreamRef.current = null;

    // Stop all screen tracks
    screenStreamRef.current?.getTracks().forEach((t) => {
      t.stop();
      debug("screen-track-stopped", { trackId: t.id });
    });
    screenStreamRef.current = null;

    // Close all peer connections
    peerConnsRef.current.forEach((pc, sid) => {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.close();
      debug("peer-connection-closed", { remoteSocketId: sid });
    });
    peerConnsRef.current.clear();
    iceCandidateQueuesRef.current.clear();
    remoteDescSetRef.current.clear();

    // Reset all React state
    setLocalStream(null);
    setRemoteStreams(new Map());
    setConnectionStates(new Map());
    setIsScreenSharing(false);
    setMicEnabled(true);
    setCameraEnabled(true);

    debug("cleanup-complete", {});
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // toggleMic
  // ─────────────────────────────────────────────────────────────────────────────

  const toggleMic = useCallback((): void => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    // Toggle enabled — this is immediate, requires no re-negotiation
    audioTrack.enabled = !audioTrack.enabled;
    setMicEnabled(audioTrack.enabled);
    debug("mic-toggled", { enabled: audioTrack.enabled, trackId: audioTrack.id });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // toggleCamera
  // ─────────────────────────────────────────────────────────────────────────────

  const toggleCamera = useCallback(async (): Promise<void> => {
    const stream = cameraStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];

    if (cameraEnabled) {
      // Turn OFF: stop the track so camera hardware light turns off
      if (videoTrack) {
        videoTrack.stop();
        stream.removeTrack(videoTrack);
        debug("camera-track-stopped-explicitly", { trackId: videoTrack.id });
      }
      setCameraEnabled(false);
      
      // Let active PCs know we have stopped sending video
      peerConnsRef.current.forEach((pc, sid) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(null).catch(() => {});
        }
      });

      debug("camera-toggled", { enabled: false, isScreenSharing });
    } else {
      // Turn ON: capture a new video track
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        if (newTrack) {
          stream.addTrack(newTrack);
          setCameraEnabled(true);

          // Hot-swap across all active peer connections unless screen sharing is active
          if (!isScreenSharing) {
            const replacePromises: Promise<void>[] = [];
            peerConnsRef.current.forEach((pc, sid) => {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) {
                const p = sender
                  .replaceTrack(newTrack)
                  .then(() => {
                    debug("camera-track-replaced-on-peer", { remoteSocketId: sid });
                  })
                  .catch((e: Error) => {
                    debug("camera-track-replace-failed-on-peer", {
                      remoteSocketId: sid,
                      error: e.message,
                    });
                  });
                replacePromises.push(p);
              }
            });
            await Promise.allSettled(replacePromises);
          }

          // Update local stream to trigger rendering updates
          setLocalStream(new MediaStream(stream.getTracks()));
          debug("camera-toggled", { enabled: true, trackId: newTrack.id, isScreenSharing });
        }
      } catch (e: any) {
        const message = e instanceof Error ? e.message : String(e);
        addError("MEDIA_ACCESS_FAILED", `Failed to start camera: ${message}`);
      }
    }
  }, [cameraEnabled, isScreenSharing, addError]);

  // ─────────────────────────────────────────────────────────────────────────────
  // startScreenShare
  // ─────────────────────────────────────────────────────────────────────────────

  const startScreenShare = useCallback(async (): Promise<void> => {
    if (isScreenSharing) return;

    const cameraStream = cameraStreamRef.current;
    if (!cameraStream) {
      addError("NO_CAMERA_STREAM", "Call joinMedia() before startScreenShare()");
      return;
    }

    // ── Capture screen ──────────────────────────────────────────────────────
    let screenStream: MediaStream;
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // most browsers ignore system audio on mobile anyway
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      addError("SCREEN_SHARE_FAILED", `getDisplayMedia failed: ${message}`);
      return;
    }

    const screenTrack = screenStream.getVideoTracks()[0];
    if (!screenTrack) {
      screenStream.getTracks().forEach((t) => t.stop());
      return;
    }

    screenStreamRef.current = screenStream;
    setIsScreenSharing(true);
    debug("screen-share-started", { trackId: screenTrack.id, label: screenTrack.label });

    // ── Replace video sender on every active peer connection ────────────────
    // replaceTrack does NOT require re-negotiation.
    const replacePromises: Promise<void>[] = [];

    peerConnsRef.current.forEach((pc, sid) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        const p = sender
          .replaceTrack(screenTrack)
          .then(() => {
            debug("screen-track-replaced", { remoteSocketId: sid });
          })
          .catch((e: Error) => {
            debug("screen-track-replace-failed", {
              remoteSocketId: sid,
              error: e.message,
            });
          });
        replacePromises.push(p);
      }
    });

    await Promise.allSettled(replacePromises);

    // ── Auto-restore camera when user clicks "Stop sharing" in browser ───────
    screenTrack.onended = () => {
      debug("screen-track-ended", { trackId: screenTrack.id });

      const currentCameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
      // Restore camera track on all peer connections ONLY if camera is currently enabled
      if (cameraEnabled && currentCameraTrack) {
        peerConnsRef.current.forEach((pc, sid) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender
              .replaceTrack(currentCameraTrack)
              .then(() => debug("camera-track-restored", { remoteSocketId: sid }))
              .catch((e: Error) =>
                debug("camera-track-restore-failed", {
                  remoteSocketId: sid,
                  error: e.message,
                })
              );
          }
        });
      } else {
        // If camera is disabled, replace the track with null (sends no video)
        peerConnsRef.current.forEach((pc, sid) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(null).catch(() => {});
          }
        });
      }

      // Stop the screen stream
      screenStream.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      debug("screen-share-stopped", {});
    };
  }, [isScreenSharing, cameraEnabled, addError]);

  // ─────────────────────────────────────────────────────────────────────────────
  // stopScreenShare (manual)
  // ─────────────────────────────────────────────────────────────────────────────

  const stopScreenShare = useCallback((): void => {
    const screenStream = screenStreamRef.current;
    if (!screenStream) return;

    screenStream.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    // Restore camera track
    const currentCameraTrack = cameraStreamRef.current?.getVideoTracks()[0];
    if (cameraEnabled && currentCameraTrack) {
      peerConnsRef.current.forEach((pc, sid) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender
            .replaceTrack(currentCameraTrack)
            .then(() => debug("camera-track-restored", { remoteSocketId: sid }))
            .catch((e: Error) =>
              debug("camera-track-restore-failed", {
                remoteSocketId: sid,
                error: e.message,
              })
            );
        }
      });
    } else {
      peerConnsRef.current.forEach((pc, sid) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(null).catch(() => {});
        }
      });
    }

    debug("screen-share-manually-stopped", {});
  }, [cameraEnabled]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Signaling handlers (socket events → WebRTC actions)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * "rtc:peer:joined" received
   *
   * This device is the OFFERER. Another participant just joined.
   * We initiate the peer connection and send an offer.
   */
  const handleUserJoined = useCallback(
    async (payload: SignalUserJoined): Promise<void> => {
      const remoteSocketId = payload.socketId;

      debug("user-joined-received", { remoteSocketId, roomId });

      const cameraStream = cameraStreamRef.current;
      if (!cameraStream) {
        debug("no-camera-stream-on-user-joined", { remoteSocketId });
        // ⚠️ Possible problem: user hasn't called joinMedia yet.
        // Ensure joinMedia() is awaited before user enters the room.
        return;
      }

      // Close any stale connection to this socket (e.g. reconnect scenario)
      if (peerConnsRef.current.has(remoteSocketId)) {
        peerConnsRef.current.get(remoteSocketId)?.close();
        peerConnsRef.current.delete(remoteSocketId);
        remoteDescSetRef.current.delete(remoteSocketId);
        debug("stale-peer-connection-closed", { remoteSocketId });
      }

      const pc = createPeerConnection(remoteSocketId);

      // ⚠️ MUST add tracks BEFORE createOffer — otherwise SDP won't include media
      addTracksToPeerConnection(pc, cameraStream, remoteSocketId);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        debug("offer-sent", {
          remoteSocketId,
          sdpType: offer.type,
        });

        socket.emit("rtc:offer", {
          targetSocketId: remoteSocketId,
          sdp: pc.localDescription,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        addError("OFFER_FAILED", `createOffer to ${remoteSocketId} failed: ${message}`, remoteSocketId);
      }
    },
    [socket, createPeerConnection, addTracksToPeerConnection, addError, roomId]
  );

  /**
   * "rtc:offer" received
   *
   * This device is the ANSWERER. Another participant sent us an offer.
   */
  const handleOffer = useCallback(
    async (payload: SignalOfferReceived): Promise<void> => {
      const fromSocketId = payload.socketId;
      const offer = payload.sdp;

      debug("offer-received", { fromSocketId, sdpType: offer.type });

      const cameraStream = cameraStreamRef.current;
      if (!cameraStream) {
        debug("no-camera-stream-on-offer", { fromSocketId });
        return;
      }

      // If there's already a connection to this socket, close it first
      // (handles rapid reconnect / duplicate offer scenarios)
      if (peerConnsRef.current.has(fromSocketId)) {
        peerConnsRef.current.get(fromSocketId)?.close();
        peerConnsRef.current.delete(fromSocketId);
        remoteDescSetRef.current.delete(fromSocketId);
        iceCandidateQueuesRef.current.set(fromSocketId, []);
        debug("stale-peer-connection-closed-before-answer", { fromSocketId });
      }

      const pc = createPeerConnection(fromSocketId);

      // ⚠️ MUST add tracks BEFORE setRemoteDescription so SDP negotiation
      // knows we can receive media and sends our tracks in the answer.
      addTracksToPeerConnection(pc, cameraStream, fromSocketId);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current.add(fromSocketId);

        // Flush any ICE candidates that arrived before the remote description
        await flushIceCandidateQueue(fromSocketId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        debug("answer-sent", { fromSocketId, sdpType: answer.type });

        socket.emit("rtc:answer", {
          targetSocketId: fromSocketId,
          sdp: pc.localDescription,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        addError("ANSWER_FAILED", `handleOffer from ${fromSocketId} failed: ${message}`, fromSocketId);
      }
    },
    [socket, createPeerConnection, addTracksToPeerConnection, flushIceCandidateQueue, addError]
  );

  /**
   * "rtc:answer" received
   *
   * We (the offerer) receive the answerer's SDP.
   */
  const handleAnswer = useCallback(
    async (payload: SignalAnswerReceived): Promise<void> => {
      const fromSocketId = payload.socketId;
      const answer = payload.sdp;

      debug("answer-received", { fromSocketId, sdpType: answer.type });

      const pc = peerConnsRef.current.get(fromSocketId);
      if (!pc) {
        debug("no-peer-connection-for-answer", { fromSocketId });
        return;
      }

      // Guard: ignore if we've already set a remote description
      if (pc.signalingState === "stable") {
        debug("answer-ignored-already-stable", { fromSocketId });
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current.add(fromSocketId);

        debug("remote-description-set", { fromSocketId });

        // Flush queued ICE candidates
        await flushIceCandidateQueue(fromSocketId, pc);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        addError("SET_REMOTE_DESC_FAILED", `setRemoteDescription answer from ${fromSocketId}: ${message}`, fromSocketId);
      }
    },
    [flushIceCandidateQueue, addError]
  );

  /**
   * "rtc:ice-candidate" received
   *
   * Apply or queue the incoming ICE candidate.
   */
  const handleIceCandidate = useCallback(
    async (payload: SignalIceCandidateReceived): Promise<void> => {
      const fromSocketId = payload.socketId;
      const candidate = payload.candidate;

      debug("ice-candidate-received", {
        fromSocketId,
        protocol: (candidate as RTCIceCandidate).protocol,
        type: (candidate as RTCIceCandidate).type,
      });

      const pc = peerConnsRef.current.get(fromSocketId);
      const remoteDescSet = remoteDescSetRef.current.has(fromSocketId);

      // If remote description isn't set yet, queue the candidate
      if (!pc || !remoteDescSet) {
        const queue = iceCandidateQueuesRef.current.get(fromSocketId) ?? [];
        queue.push(candidate);
        iceCandidateQueuesRef.current.set(fromSocketId, queue);
        debug("ice-candidate-queued", {
          fromSocketId,
          queueLength: queue.length,
          reason: !pc ? "no-pc" : "no-remote-desc",
        });
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        debug("ice-candidate-added", { fromSocketId });
      } catch (e) {
        // This can happen if the connection is already closed — safe to ignore
        debug("ice-candidate-add-failed", {
          fromSocketId,
          error: String(e),
          signalingState: pc.signalingState,
        });
      }
    },
    []
  );

  /**
   * "rtc:peer:left" received
   *
   * Clean up everything for the departing peer.
   */
  const handleUserLeft = useCallback((payload: SignalUserLeft): void => {
    const remoteSocketId = payload.socketId;

    debug("user-left-received", { remoteSocketId });

    const pc = peerConnsRef.current.get(remoteSocketId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.close();
      peerConnsRef.current.delete(remoteSocketId);
    }

    iceCandidateQueuesRef.current.delete(remoteSocketId);
    remoteDescSetRef.current.delete(remoteSocketId);

    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(remoteSocketId);
      return next;
    });

    setConnectionStates((prev) => {
      const next = new Map(prev);
      next.delete(remoteSocketId);
      return next;
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Register socket listeners
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    debug("socket-connected", { socketId: socket.id, roomId });

    socket.on("rtc:peer:joined", handleUserJoined);
    socket.on("rtc:offer", handleOffer);
    socket.on("rtc:answer", handleAnswer);
    socket.on("rtc:ice-candidate", handleIceCandidate);
    socket.on("rtc:peer:left", handleUserLeft);

    return () => {
      socket.off("rtc:peer:joined", handleUserJoined);
      socket.off("rtc:offer", handleOffer);
      socket.off("rtc:answer", handleAnswer);
      socket.off("rtc:ice-candidate", handleIceCandidate);
      socket.off("rtc:peer:left", handleUserLeft);
    };
  }, [
    socket,
    handleUserJoined,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleUserLeft,
    roomId,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Cleanup on component unmount
  // ─────────────────────────────────────────────────────────────────────────────

  // Use refs directly here to avoid stale closure / missing deps warnings
  const cameraRef = cameraStreamRef;
  const screenRef = screenStreamRef;
  const pcRef = peerConnsRef;

  useEffect(() => {
    return () => {
      // Stop all camera tracks
      cameraRef.current?.getTracks().forEach((t) => t.stop());
      // Stop all screen tracks
      screenRef.current?.getTracks().forEach((t) => t.stop());
      // Close all peer connections
      pcRef.current.forEach((pc) => {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
      });
      pcRef.current.clear();
      debug("cleanup-complete", { reason: "unmount" });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional: runs once on unmount

  // ─────────────────────────────────────────────────────────────────────────────
  // Return
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    localStream,
    remoteStreams,
    micEnabled,
    cameraEnabled,
    isScreenSharing,
    connectionStates,
    errors,
    joinMedia,
    leaveMedia,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
}
