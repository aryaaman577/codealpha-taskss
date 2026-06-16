# Phase 1: Signal Mapping Analysis

## ACTUAL EVENT MAP
- room join event name: meeting:join
- user joined event name: rtc:peer:joined
- user left event name: rtc:peer:left
- offer event name: rtc:offer
- answer event name: rtc:answer
- ICE candidate event name: rtc:ice-candidate
- media status toggle event name: meeting:media-state-changed (client → server) and meeting:participant:media-state (server → client)
- screen share status event name: meeting:participant:screenshare

## ACTUAL PAYLOAD MAP
- local socket id reference: socket.id (on the client instance)
- remote socket id reference: 
    * For user-joined/user-left events: `socketId` field contains the peer's socket ID
    * For offer/answer/ICE events:
        - Received payload: `socketId` field contains the sender's socket ID
        - Sent payload: `targetSocketId` field contains the target peer's socket ID
- offer sender field key: `socketId` (in received `rtc:offer` event)
- offer target field key: `targetSocketId` (in sent `rtc:offer` event)
- answer sender field key: `socketId` (in received `rtc:answer` event)
- answer target field key: `targetSocketId` (in sent `rtc:answer` event)
- ICE candidate sender field key: `socketId` (in received `rtc:ice-candidate` event)
- ICE candidate target field key: `targetSocketId` (in sent `rtc:ice-candidate` event)
- SDP field key: `sdp`
- ICE candidate field key: `candidate`

## GENERATED HOOK EXPECTS (from types.ts and useWebRTCMeeting.ts)
- user-joined { socketId }
- user-left { socketId }
- webrtc-offer { fromSocketId, offer }  // received event
- webrtc-answer { fromSocketId, answer } // received event
- webrtc-ice-candidate { fromSocketId, candidate } // received event
- emits webrtc-offer { targetSocketId, offer }
- emits webrtc-answer { targetSocketId, answer }
- emits webrtc-ice-candidate { targetSocketId, candidate }

## STRUCTURAL MAPPING ADAPTERS REQUIRED
After comparing the actual server emissions (from `apps/server/src/services/socket.service.ts`) with the hook's expectations:

1. **Event Names**: Exact match - no changes needed.
   - Server emits: `rtc:peer:joined`, `rtc:offer`, `rtc:answer`, `rtc:ice-candidate`, `rtc:peer:left`
   - Hook listens for: same event names

2. **Payload Shapes**: 
   - **Incoming `rtc:peer:joined`**: Server sends `{ userId, socketId, displayName, avatar, audioMuted, videoMuted, screenSharing, handRaised }`
     Hook expects `SignalUserJoined`: `{ socketId: string, displayName?: string }`
     → Adapter: Extract `socketId` and `displayId` (hook ignores other fields, but meeting page uses them for UI)
   
   - **Incoming `rtc:peer:left`**: Server sends `{ userId, socketId }`
     Hook expects `SignalUserLeft`: `{ socketId: string }`
     → Adapter: Extract `socketId` (hook ignores userId, but meeting page uses it for cleanup)
   
   - **Incoming `rtc:offer`**: Server sends `{ sdp, socketId }` where `socketId` is the sender's ID
     Hook expects `SignalOfferReceived`: `{ socketId: string, sdp: RTCSessionDescriptionInit }`
     → Adapter: Identity mapping (field names match exactly)
   
   - **Incoming `rtc:answer`**: Same as offer → identity mapping
   
   - **Incoming `rtc:ice-candidate`**: Server sends `{ candidate, socketId }` where `socketId` is the sender's ID
     Hook expects `SignalIceCandidateReceived`: `{ socketId: string, candidate: RTCIceCandidateInit }`
     → Adapter: Identity mapping
   
   - **Outgoing `rtc:offer`**: Hook emits `{ targetSocketId: string, sdp: RTCSessionDescriptionInit }`
     Server expects: `{ targetSocketId: string, sdp: any }`
     → Adapter: Identity mapping
   
   - **Outgoing `rtc:answer`**: Same as offer → identity mapping
   
   - **Outgoing `rtc:ice-candidate`**: Same as offer → identity mapping

3. **Conclusion**: 
   - The hook's WebRTC signaling (`rtc:offer`, `rtc:answer`, `rtc:ice-candidate`) requires **no adapter** - field names and shapes match exactly.
   - The `rtc:peer:joined` and `rtc:peer:left` events require **field extraction adapters** in the meeting page's `setupNonWebRTCSignaling` function (which already exists and correctly maps the server's payload to the expected shape).
   - No changes are needed to the hook or server for WebRTC signaling alignment.

## VERIFICATION
- All WebRTC-related event names match between hook and server.
- All WebRTC-related payload field names match between hook and server.
- The server correctly forwards WebRTC signaling events to the target socket only (using `io.to(targetSocketId).emit(...)`), preventing broadcast conflicts.
- The meeting page already implements the necessary adapters for `rtc:peer:joined` and `rtc:peer:left` in `setupNonWebRTCSignaling`.

**Result**: The signaling flow is structurally aligned. No changes to WebRTC event mapping are required.