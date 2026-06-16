# WebRTC Media Fix — Integration Guide

> **Status:** Generated files only. Nothing is wired yet. Nothing is fixed yet.
> This guide tells you exactly what to change, where, and why.

---

## 1. Generated Files

| File | Purpose |
|---|---|
| `generated_webrtc_fix/types.ts` | All TypeScript interfaces. Confirm ⚠️ fields match your server. |
| `generated_webrtc_fix/webrtcDebug.ts` | URL-gated logger. Add `?debugWebrtc=1` to any meeting URL. |
| `generated_webrtc_fix/RemoteVideo.tsx` | One video element per remote participant. Handles srcObject, autoplay, and blocked state. |
| `generated_webrtc_fix/useWebRTCMeeting.ts` | The full WebRTC hook. Manages peer connections, signaling, screen share, toggles, cleanup. |

---

## 2. Existing Files That Likely Need Integration

These are the typical files in a Next.js Socket.IO meeting app. Your paths may differ.

| File (your project) | What to do |
|---|---|
| `app/meeting/[roomId]/page.tsx` | Import and call the hook; render local + remote video |
| `lib/socket.ts` or `hooks/useSocket.ts` | Pass your existing socket instance to the hook |
| `components/MeetingControls.tsx` | Wire `toggleMic`, `toggleCamera`, `startScreenShare`, `stopScreenShare` |
| `server/index.ts` (or similar) | Verify server forwards signaling events correctly (see §5) |

---

## 3. How to Wire the Hook

### 3a. Import

```tsx
// At the top of your meeting page or a wrapper component
import { useWebRTCMeeting } from "@/generated_webrtc_fix/useWebRTCMeeting";
import { RemoteVideo }       from "@/generated_webrtc_fix/RemoteVideo";
```

### 3b. Call the hook

```tsx
// Inside your meeting page component:
const {
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
} = useWebRTCMeeting({
  socket,   // ← your existing socket.io client instance
  roomId,   // ← the current room/meeting ID string
});
```

### 3c. Call joinMedia at the right moment

```tsx
// ⚠️ CRITICAL: joinMedia MUST be called (and awaited) BEFORE the server
// emits "user-joined" to other participants.
//
// Pattern A: Call on page load, then notify server you are ready
useEffect(() => {
  joinMedia().then(() => {
    socket.emit("join-room", { roomId }); // ← tell server you're in
  });
  return () => leaveMedia();
}, []);

// Pattern B: If server join happens on page load, call joinMedia first
useEffect(() => {
  (async () => {
    await joinMedia();
    // now existing participants can send you offers
  })();
  return () => leaveMedia();
}, []);
```

> **Why this order matters:**
> If `joinMedia()` hasn't run when `user-joined` fires, the hook has no camera
> stream to add to the peer connection, and the offer SDP will contain no media.
> Remote peers will connect but see/hear nothing.

---

## 4. Socket Event Name Mapping

### ⚠️ EVERY item marked with ⚠️ must be verified against your server code.

The hook currently uses these event names and payload shapes:

```
CLIENT LISTENS FOR:
  "user-joined"           { socketId: string, ... }
  "webrtc-offer"          { fromSocketId: string, offer: RTCSessionDescriptionInit }
  "webrtc-answer"         { fromSocketId: string, answer: RTCSessionDescriptionInit }
  "webrtc-ice-candidate"  { fromSocketId: string, candidate: RTCIceCandidateInit }
  "user-left"             { socketId: string }

CLIENT EMITS:
  "webrtc-offer"          { targetSocketId: string, offer: RTCSessionDescriptionInit }
  "webrtc-answer"         { targetSocketId: string, answer: RTCSessionDescriptionInit }
  "webrtc-ice-candidate"  { targetSocketId: string, candidate: RTCIceCandidateInit }
```

### Common mismatches to check

| Hook assumes | Your server might use |
|---|---|
| `"user-joined"` | `"new-user"`, `"peer-joined"`, `"user-connected"`, `"new-peer"` |
| `"user-left"` | `"user-disconnected"`, `"peer-left"`, `"leave-room"` |
| `"webrtc-offer"` | `"offer"`, `"rtc-offer"`, `"sdp-offer"` |
| `"webrtc-answer"` | `"answer"`, `"rtc-answer"`, `"sdp-answer"` |
| `"webrtc-ice-candidate"` | `"ice-candidate"`, `"rtc-ice"`, `"candidate"` |
| payload: `{ socketId }` | `{ userId }`, `{ peerId }`, `{ id }`, `{ user: { id } }` |
| payload: `{ fromSocketId }` | `{ from }`, `{ senderId }`, `{ userId }` |
| payload: `{ targetSocketId }` | `{ to }`, `{ targetId }`, `{ toSocketId }` |
| payload: `{ offer }` / `{ answer }` | `{ sdp }`, `{ payload }`, `{ data }` |

### How to adapt if names differ

Option A — rename in the hook's `useEffect`:
```typescript
// In useWebRTCMeeting.ts, change:
socket.on("user-joined", handleUserJoined);
// to:
socket.on("new-user", handleUserJoined);  // ← your actual event name
```

Option B — rename in the handlers at the top of each handler:
```typescript
const handleOffer = useCallback(async (payload: any) => {
  // Map your payload shape to what the handler expects:
  const fromSocketId = payload.from ?? payload.fromSocketId ?? payload.userId;
  const offer        = payload.sdp  ?? payload.offer;
  // ... rest of handler
```

### Server-side requirements (CRITICAL)

Your server MUST:

1. **Emit `user-joined` to EXISTING room members** (not the joiner) when a new socket joins.
   ```js
   // server: socket.io example
   socket.on("join-room", ({ roomId }) => {
     // Tell existing members about the newcomer
     socket.to(roomId).emit("user-joined", { socketId: socket.id });
     socket.join(roomId);
   });
   ```

2. **Forward `webrtc-offer` / `webrtc-answer` / `webrtc-ice-candidate` to the specific target only** (not broadcast to the whole room).
   ```js
   socket.on("webrtc-offer", ({ targetSocketId, offer }) => {
     // Forward ONLY to targetSocketId, include sender's ID
     io.to(targetSocketId).emit("webrtc-offer", {
       fromSocketId: socket.id,
       offer,
     });
   });
   ```

3. **Emit `user-left`** when a socket disconnects.
   ```js
   socket.on("disconnect", () => {
     // Tell all room members
     socket.to(roomId).emit("user-left", { socketId: socket.id });
   });
   ```

> **This is the single most common reason media works locally but not between devices.**
> If your server broadcasts the offer to ALL room members instead of just `targetSocketId`,
> every participant will try to answer it, causing conflicts.

---

## 5. Rendering Local Video

```tsx
// Local video — MUST be muted to prevent audio echo
const localVideoRef = useRef<HTMLVideoElement>(null);

useEffect(() => {
  if (!localVideoRef.current) return;
  localVideoRef.current.srcObject = localStream;
}, [localStream]);

return (
  <video
    ref={localVideoRef}
    autoPlay
    playsInline
    muted   {/* ← REQUIRED: prevents feedback loop */}
    style={{ width: 200, height: 150, objectFit: "cover", transform: "scaleX(-1)" }}
  />
);
```

Note on screen share preview: `localStream` does NOT automatically switch to the
screen share stream. If you want to show a local preview of screen share, expose
`screenStreamRef` from the hook, or maintain separate state for it. Current
implementation intentionally keeps `localStream` pointing to the camera stream
so toggleCamera still works correctly.

---

## 6. Rendering Remote Videos

```tsx
// remoteStreams is Map<socketId, MediaStream>
// participants is your existing array of participant objects (unchanged)

{Array.from(remoteStreams.entries()).map(([socketId, stream]) => {
  // Match to participant for display name
  const participant = participants.find(p => p.socketId === socketId);
  //                                              ↑ ⚠️ CONFIRM field name

  return (
    <RemoteVideo
      key={socketId}
      socketId={socketId}
      stream={stream}
      displayName={participant?.displayName ?? participant?.name ?? socketId}
      style={{ width: 320, height: 240 }}
    />
  );
})}
```

> **Key:** The `socketId` key used in `remoteStreams` comes directly from the
> `user-joined` payload and the `fromSocketId` of offers/answers/ICE candidates.
> This MUST be the same ID that your participants list uses to identify peers —
> otherwise `remoteStreams.get(participant.socketId)` will always be undefined.

---

## 7. Control Button Wiring

```tsx
<button onClick={toggleMic}>
  {micEnabled ? "Mute" : "Unmute"}
</button>

<button onClick={toggleCamera}>
  {cameraEnabled ? "Hide Camera" : "Show Camera"}
</button>

<button onClick={isScreenSharing ? stopScreenShare : startScreenShare}>
  {isScreenSharing ? "Stop Sharing" : "Share Screen"}
</button>

<button onClick={leaveMedia}>Leave</button>
```

---

## 8. Debug Mode

Add `?debugWebrtc=1` to any meeting URL in the browser:
```
https://yourdomain.com/meeting/room-abc?debugWebrtc=1
```

Or force-enable in the browser console at any time:
```js
window.__webrtcDebugForce = true
```

You will see colour-coded logs for every WebRTC event. The most important ones
to check during a two-device test:

```
[WebRTC] socket-connected           — hook is wired to socket
[WebRTC] join-media-called          — getUserMedia was requested
[WebRTC] local-tracks-captured      — camera + mic acquired
[WebRTC] user-joined-received       — server told us someone joined
[WebRTC] peer-connection-created    — RTCPeerConnection created
[WebRTC] local-track-added (x2)     — audio + video added to PC
[WebRTC] offer-sent                 — we sent the offer
[WebRTC] offer-received             — other side got the offer
[WebRTC] answer-sent                — other side replied
[WebRTC] answer-received            — we got the answer
[WebRTC] ice-candidate-sent         — ICE gathering in progress
[WebRTC] ice-candidate-received     — remote ICE candidates arriving
[WebRTC] ice-candidate-added        — candidates being applied
[WebRTC] connection-state-change    { state: "connected" }  ← SUCCESS
[WebRTC] ontrack-fired              — remote media stream arriving
[WebRTC] remote-stream-stored       — stored in remoteStreams map
[WebRTC] remote-video-play-success  — video element playing
```

---

## 9. Two-Device Manual Test Checklist

Run this after integration. Use two separate devices on separate networks (not same WiFi).

### Pre-test setup
- [ ] Open meeting URL on Device 1 (Laptop) with `?debugWebrtc=1`
- [ ] Open meeting URL on Device 2 (Phone) with `?debugWebrtc=1`
- [ ] Open browser DevTools on both devices

### Connection
- [ ] Both devices show each other in the participants list
- [ ] Console shows `connection-state-change { state: "connected" }` on both

### Audio/Video
- [ ] Laptop sees Phone camera *(check: `ontrack-fired` on Laptop)*
- [ ] Phone sees Laptop camera *(check: `ontrack-fired` on Phone)*
- [ ] Laptop hears Phone audio *(speak on Phone, hear on Laptop)*
- [ ] Phone hears Laptop audio *(speak on Laptop, hear on Phone)*

### Screen share
- [ ] Laptop starts screen share → Phone sees screen (not camera)
- [ ] Laptop stops screen share → Phone sees camera again
- [ ] Phone starts screen share → Laptop sees Phone screen
- [ ] Camera toggle still works after screen share

### Edge cases
- [ ] Refreshing one device causes it to reconnect *(other device removes old video, adds new)*
- [ ] No duplicate remote videos after reconnect
- [ ] Leaving the meeting stops all camera/mic tracks *(check browser camera indicator goes off)*
- [ ] Mute button silences audio without dropping video
- [ ] Camera off sends black video without dropping audio

---

## 10. Root Causes of the Original Issue

Based on the symptoms described, here are the most likely culprits:

| Symptom | Most Likely Cause |
|---|---|
| No video on either device | Tracks added AFTER `createOffer`, so SDP has no media |
| No audio on either device | Same as above, or audio track not captured (getUserMedia `audio: false`) |
| Screen share not visible | `replaceTrack` not called, or new PC created instead |
| Camera not restored after screen share | `onended` handler not set on screen track |
| Media works in same-network test but not across internet | No STUN server configured (`iceServers: []` or missing) |
| Offers/answers not reaching the right peer | Server broadcasting to room instead of targeting `targetSocketId` |
| ICE candidates failing | Applied before `setRemoteDescription`, not queued |
| Remote video element empty | `srcObject` set as JSX prop instead of via ref + useEffect |

---

## 11. What Is NOT Changed

- Auth system
- Landing page
- Dashboard
- Layout / CSS / theme
- Navbar
- Participants list / people list logic
- Room membership (join-room) logic
- Any existing file in your project
