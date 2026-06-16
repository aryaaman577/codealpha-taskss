/**
 * generated_webrtc_fix/RemoteVideo.tsx
 *
 * Renders a single remote participant's video stream.
 *
 * Key design decisions:
 *   - srcObject is set via a React ref + useEffect (NOT as a JSX prop).
 *     Setting srcObject via JSX causes rendering bugs on Safari and Firefox.
 *   - NOT muted by default — remote audio must play.
 *   - autoPlay + playsInline for mobile compatibility.
 *   - Exposes autoplayBlocked state and a click-to-unblock overlay.
 *   - Handles the case where stream is null (peer disconnected).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { webrtcDebug as debug } from "./webrtcDebug";
import type { RemoteVideoProps } from "./types";

export function RemoteVideo({
  stream,
  socketId,
  className,
  style,
  displayName,
}: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [trackCount, setTrackCount] = useState(0);

  // Track the number of tracks in the stream to force re-render when tracks are added/removed
  useEffect(() => {
    if (!stream) {
      setTrackCount(0);
      return;
    }

    const handleTrackChange = () => {
      setTrackCount(stream.getTracks().length);
    };

    stream.addEventListener("addtrack", handleTrackChange);
    stream.addEventListener("removetrack", handleTrackChange);

    setTrackCount(stream.getTracks().length);

    return () => {
      stream.removeEventListener("addtrack", handleTrackChange);
      stream.removeEventListener("removetrack", handleTrackChange);
    };
  }, [stream]);

  // ── Assign srcObject whenever stream changes ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!stream) {
      // Peer disconnected — clear the video element
      video.srcObject = null;
      setAutoplayBlocked(false);
      setPlayError(null);
      return;
    }

    debug("remote-video-srcobject-assigned", {
      socketId,
      streamId: stream.id,
      trackCount: stream.getTracks().length,
      tracks: stream.getTracks().map((t) => `${t.kind}:${t.enabled}`),
    });

    video.srcObject = stream;

    // Explicitly call play() — autoPlay attribute alone is unreliable on mobile.
    video
      .play()
      .then(() => {
        debug("remote-video-play-success", { socketId });
        setAutoplayBlocked(false);
        setPlayError(null);
      })
      .catch((err: Error) => {
        const isAutoplayError = err.name === "NotAllowedError";
        debug("remote-video-play-failed", {
          socketId,
          errorName: err.name,
          message: err.message,
          isAutoplayError,
        });

        if (isAutoplayError) {
          // Browser blocked autoplay — show click-to-play overlay
          setAutoplayBlocked(true);
        } else {
          setPlayError(err.message);
        }
      });

    // Cleanup: pause and clear srcObject when stream changes
    return () => {
      video.pause();
      // Do NOT set video.srcObject = null here — the next effect run will do it
    };
  }, [stream, socketId, trackCount]);

  // ── Click-to-unblock handler ──────────────────────────────────────────────
  const handleUnblockClick = () => {
    const video = videoRef.current;
    if (!video || !autoplayBlocked) return;

    video
      .play()
      .then(() => {
        setAutoplayBlocked(false);
      })
      .catch((err: Error) => {
        setPlayError(err.message);
        setAutoplayBlocked(false);
      });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#111",
        ...style,
      }}
      className={className}
    >
      {/* ── Remote video element ── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        // ⚠️ NOT muted — remote audio should play
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        // Useful for debugging in DevTools
        data-socket-id={socketId}
        data-display-name={displayName}
      />

      {/* ── Optional display name overlay ── */}
      {displayName && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            background: "rgba(0,0,0,0.55)",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            pointerEvents: "none",
          }}
        >
          {displayName}
        </div>
      )}

      {/* ── Autoplay blocked overlay ── */}
      {autoplayBlocked && (
        <div
          onClick={handleUnblockClick}
          role="button"
          aria-label="Click to play video"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            gap: 8,
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: 28 }}>▶</span>
          <span>Click to play</span>
          {displayName && (
            <span style={{ fontSize: 12, opacity: 0.7 }}>{displayName}</span>
          )}
        </div>
      )}

      {/* ── Play error indicator ── */}
      {playError && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            background: "rgba(239,68,68,0.85)",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            maxWidth: "80%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={playError}
        >
          ⚠ {playError}
        </div>
      )}

      {/* ── No stream placeholder ── */}
      {!stream && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#555",
            fontSize: 13,
          }}
        >
          {displayName ? `${displayName} — waiting for video…` : "Waiting for video…"}
        </div>
      )}
    </div>
  );
}
