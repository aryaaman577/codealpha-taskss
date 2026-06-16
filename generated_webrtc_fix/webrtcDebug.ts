/**
 * generated_webrtc_fix/webrtcDebug.ts
 *
 * Debug logger for WebRTC events.
 * Active ONLY when the page URL contains:  ?debugWebrtc=1
 *
 * Usage:
 *   import { webrtcDebug as debug } from "./webrtcDebug";
 *   debug("offer-sent", { remoteSocketId: "abc", sdpType: "offer" });
 *
 * In browser console, you can also run:
 *   window.__webrtcDebugForce = true   — force-enable without URL param
 *   window.__webrtcDebugForce = false  — disable
 */

type DebugData = Record<string, unknown>;

// ── Styles for console.log ─────────────────────────────────────────────────

const STYLES: Record<string, string> = {
  // Socket / lifecycle
  "socket-connected":               "color:#22c55e;font-weight:bold",
  "join-media-called":              "color:#22c55e;font-weight:bold",
  "local-tracks-captured":         "color:#22c55e;font-weight:bold",
  "leave-media-called":             "color:#f97316;font-weight:bold",
  "cleanup-complete":               "color:#f97316;font-weight:bold",
  // Peer connection
  "peer-connection-created":        "color:#0ea5e9;font-weight:bold",
  "local-track-added":              "color:#0ea5e9",
  "connection-state-change":        "color:#0ea5e9;font-weight:bold",
  "ice-connection-state-change":    "color:#38bdf8",
  "signaling-state-change":         "color:#7dd3fc",
  // Offer / Answer
  "offer-sent":                     "color:#a855f7;font-weight:bold",
  "offer-received":                 "color:#a855f7;font-weight:bold",
  "answer-sent":                    "color:#d946ef;font-weight:bold",
  "answer-received":                "color:#d946ef;font-weight:bold",
  "remote-description-set":         "color:#e879f9",
  "no-peer-connection-for-answer":  "color:#ef4444;font-weight:bold",
  "no-camera-stream-on-user-joined":"color:#f59e0b;font-weight:bold",
  "no-camera-stream-on-offer":      "color:#f59e0b;font-weight:bold",
  // ICE
  "ice-candidate-sent":             "color:#64748b",
  "ice-candidate-received":         "color:#64748b",
  "ice-candidate-added":            "color:#64748b",
  "ice-candidate-queued":           "color:#f59e0b",
  "ice-candidate-queue-flush":      "color:#f59e0b",
  "ice-candidate-added-from-queue": "color:#64748b",
  "ice-candidate-add-failed":       "color:#ef4444;font-weight:bold",
  "ice-gathering-complete":         "color:#94a3b8",
  "ice-restart-attempt":            "color:#f59e0b;font-weight:bold",
  // ontrack / remote stream
  "ontrack-fired":                  "color:#10b981;font-weight:bold",
  "remote-stream-stored":           "color:#10b981;font-weight:bold",
  // RemoteVideo
  "remote-video-srcobject-assigned":"color:#10b981",
  "remote-video-play-success":      "color:#10b981",
  "remote-video-play-failed":       "color:#ef4444;font-weight:bold",
  // Screen share
  "screen-share-started":           "color:#f59e0b;font-weight:bold",
  "screen-track-replaced":          "color:#f59e0b",
  "screen-track-replace-failed":    "color:#ef4444;font-weight:bold",
  "screen-track-ended":             "color:#f97316",
  "screen-share-stopped":           "color:#f97316",
  "screen-share-manually-stopped":  "color:#f97316",
  "camera-track-restored":          "color:#22c55e",
  "camera-track-restore-failed":    "color:#ef4444;font-weight:bold",
  // Misc
  "get-user-media-failed":          "color:#ef4444;font-weight:bold",
  "user-joined-received":           "color:#6366f1;font-weight:bold",
  "user-left-received":             "color:#6366f1;font-weight:bold",
  "peer-connection-closed":         "color:#f97316",
  "camera-track-stopped":           "color:#f97316",
  "screen-track-stopped":           "color:#f97316",
  "offer-failed":                   "color:#ef4444;font-weight:bold",
  "answer-failed":                  "color:#ef4444;font-weight:bold",
};

const DEFAULT_STYLE = "color:#94a3b8";

// ── Internal: check if debug is enabled ────────────────────────────────────

function isDebugEnabled(): boolean {
  if (typeof window === "undefined") return false; // SSR guard

  // Allow runtime override in browser console
  const w = window as unknown as Record<string, unknown>;
  if (w.__webrtcDebugForce === true) return true;
  if (w.__webrtcDebugForce === false) return false;

  try {
    return new URLSearchParams(window.location.search).get("debugWebrtc") === "1";
  } catch {
    return false;
  }
}

// ── Internal: serialize data safely ────────────────────────────────────────

function safeStringify(data: DebugData): string {
  try {
    return JSON.stringify(
      data,
      (_key, value) => {
        // Truncate very long strings (e.g. full SDP) to avoid log spam
        if (typeof value === "string" && value.length > 120) {
          return value.slice(0, 120) + "…";
        }
        return value;
      },
      2
    );
  } catch {
    return String(data);
  }
}

// ── Exported debug function ────────────────────────────────────────────────

/**
 * webrtcDebug(event, data)
 *
 * Logs a structured WebRTC event to the browser console.
 * No-op unless ?debugWebrtc=1 is in the URL (or window.__webrtcDebugForce=true).
 *
 * @param event  - Snake-case event name, e.g. "offer-sent"
 * @param data   - Key/value data relevant to this event
 */
export function webrtcDebug(event: string, data: DebugData): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("webrtc-debug-log", { detail: { type: "debug", event, data } }));
  }

  if (!isDebugEnabled()) return;

  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const style = STYLES[event] ?? DEFAULT_STYLE;
  const label = `%c[WebRTC ${ts}] ${event.padEnd(36)}`;

  // Log structured object separately so it's expandable in DevTools
  const hasData = Object.keys(data).length > 0;
  if (hasData) {
    console.groupCollapsed(label, style, safeStringify(data));
    console.log(data); // expandable native object
    console.groupEnd();
  } else {
    console.log(label, style);
  }
}

// ── Convenience helpers ────────────────────────────────────────────────────

/** Log an error — always visible, not gated by debug flag. */
export function webrtcError(event: string, data: DebugData): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("webrtc-debug-log", { detail: { type: "error", event, data } }));
  }

  const ts = new Date().toISOString().slice(11, 23);
  console.error(`[WebRTC ${ts}] ❌ ${event}`, data);
}

/** Print all active debug event names (helps during integration) */
export function webrtcDebugListEvents(): void {
  console.log(
    "[WebRTC] Tracked events:\n" + Object.keys(STYLES).map(k => `  • ${k}`).join("\n")
  );
}

// Expose on window for convenience during development
if (typeof window !== "undefined") {
  const w = window as unknown as Record<string, unknown>;
  w.__webrtcDebugListEvents = webrtcDebugListEvents;
}
