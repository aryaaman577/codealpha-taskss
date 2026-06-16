import React, { useEffect, useState, useRef } from 'react';

interface DebugOverlayProps {
  socket: any;
  roomId: string;
  hookLocalStream: MediaStream | null;
  hookRemoteStreams: Map<string, MediaStream>;
  micEnabled: boolean;
  cameraEnabled: boolean;
  isScreenSharing: boolean;
  connectionStates: Map<string, RTCPeerConnectionState>;
  webrtcErrors: any[];
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({
  socket,
  roomId,
  hookLocalStream,
  hookRemoteStreams,
  micEnabled,
  cameraEnabled,
  isScreenSharing,
  connectionStates,
  webrtcErrors,
}) => {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const logRef = useRef<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    const logEntry = `[${timestamp}] ${message}`;
    logRef.current = [...logRef.current, logEntry].slice(-150); // Keep last 150
    setDebugLog([...logRef.current]);
  };

  // Environment
  const [envInfo, setEnvInfo] = useState({
    url: '',
    nodeEnv: '',
    secureContext: false,
    mediaDevices: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setEnvInfo({
        url: window.location.href.split('?')[0],
        nodeEnv: process.env.NODE_ENV || 'production',
        secureContext: window.isSecureContext,
        mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      });
      addLog(`Env: url=${window.location.href.split('?')[0]}, secure=${window.isSecureContext}, mediaDevices=${!!navigator.mediaDevices}`);
    }
  }, [roomId]);

  // Socket
  const [socketInfo, setSocketInfo] = useState({
    connected: false,
    id: '',
    reconnects: 0,
  });

  useEffect(() => {
    if (!socket) return;
    setSocketInfo({
      connected: socket.connected,
      id: socket.id || 'none',
      reconnects: 0,
    });

    const handleConnect = () => {
      setSocketInfo(prev => ({ ...prev, connected: true, id: socket.id }));
      addLog(`Socket: connected as id=${socket.id}`);
    };
    const handleDisconnect = (reason: string) => {
      setSocketInfo(prev => ({ ...prev, connected: false }));
      addLog(`Socket: disconnected, reason=${reason}`);
    };
    const handleError = (err: any) => {
      addLog(`Socket error: ${JSON.stringify(err)}`);
    };
    const handleReconnectAttempt = () => {
      setSocketInfo(prev => ({ ...prev, reconnects: prev.reconnects + 1 }));
      addLog(`Socket: reconnect attempt #${socketInfo.reconnects + 1}`);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [socket]);

  // Custom event listener for low-level WebRTC/signaling logs
  useEffect(() => {
    const handleWebRTCLog = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; event: string; data: any }>;
      const { type, event, data } = customEvent.detail;
      const dataStr = data ? ` | data=${JSON.stringify(data)}` : '';
      addLog(`${type === 'error' ? '❌ ' : ''}${event}${dataStr}`);
    };
    window.addEventListener('webrtc-debug-log', handleWebRTCLog);
    return () => {
      window.removeEventListener('webrtc-debug-log', handleWebRTCLog);
    };
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <span style={{ fontWeight: 'bold' }}>
          {isOpen ? '▼ WebRTC Debug Dashboard' : '▶ WebRTC Debug Dashboard (Click to Expand)'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            logRef.current = [];
            setDebugLog([]);
          }}
          style={styles.clearBtn}
        >
          Clear Logs
        </button>
      </div>

      {isOpen && (
        <div style={styles.container}>
          {/* Stats Summary Section */}
          <div style={styles.statsBar}>
            <div style={styles.statBox}>
              <h4 style={styles.statTitle}>Environment</h4>
              <div>Secure Context: {envInfo.secureContext ? '✅' : '❌'}</div>
              <div>Media APIs: {envInfo.mediaDevices ? '✅' : '❌'}</div>
              <div>Node Env: <span style={{ color: '#fb923c' }}>{envInfo.nodeEnv}</span></div>
            </div>

            <div style={styles.statBox}>
              <h4 style={styles.statTitle}>Socket.io</h4>
              <div>Status: <span style={{ color: socketInfo.connected ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{socketInfo.connected ? 'Connected' : 'Disconnected'}</span></div>
              <div>Socket ID: <span style={{ fontSize: '10px', color: '#60a5fa' }}>{socketInfo.id}</span></div>
              <div>Reconnects: {socketInfo.reconnects}</div>
            </div>

            <div style={styles.statBox}>
              <h4 style={styles.statTitle}>Hardware Capture</h4>
              <div>Local Stream: {hookLocalStream ? '✅' : '❌'}</div>
              <div>Camera: {cameraEnabled ? 'ON' : 'OFF'} ({hookLocalStream?.getVideoTracks().length || 0} tracks)</div>
              <div>Mic: {micEnabled ? 'ON' : 'OFF'} ({hookLocalStream?.getAudioTracks().length || 0} tracks)</div>
              <div>Screen Share: {isScreenSharing ? 'SHARING' : 'NO'}</div>
            </div>

            <div style={styles.statBox}>
              <h4 style={styles.statTitle}>Peer Connections</h4>
              <div>Remote Peers count: {connectionStates.size}</div>
              <div style={{ maxHeight: '50px', overflowY: 'auto' }}>
                {Array.from(connectionStates.entries()).map(([id, state]) => (
                  <div key={id} style={{ fontSize: '10px' }}>
                    {id.slice(0, 6)}..: <span style={{ color: state === 'connected' ? '#4ade80' : '#fbbf24' }}>{state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Console Log Area */}
          <div style={styles.consoleContainer}>
            <div style={styles.consoleTitle}>Console Logs:</div>
            <div style={styles.logList}>
              {debugLog.map((log, index) => {
                let color = '#ccc';
                if (log.includes('❌') || log.includes('error') || log.includes('failed')) color = '#f87171';
                else if (log.includes('connected') || log.includes('success') || log.includes('ontrack')) color = '#4ade80';
                else if (log.includes('offer') || log.includes('answer')) color = '#c084fc';
                else if (log.includes('ice-candidate')) color = '#94a3b8';
                return (
                  <div key={index} style={{ ...styles.logLine, color }}>
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '11px',
    zIndex: 99999,
    borderTop: '2px solid #3b82f6',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  header: {
    padding: '8px 16px',
    backgroundColor: '#1e293b',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
  },
  clearBtn: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 8px',
    cursor: 'pointer',
    fontSize: '10px',
  },
  container: {
    height: '240px',
    display: 'flex',
    flexDirection: 'column',
  },
  statsBar: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '8px',
    gap: '8px',
    borderBottom: '1px solid #334155',
    backgroundColor: '#0f172a',
  },
  statBox: {
    flex: '1 1 200px',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '6px 8px',
    backgroundColor: '#1e293b',
    minHeight: '70px',
  },
  statTitle: {
    margin: '0 0 4px 0',
    fontSize: '11px',
    color: '#3b82f6',
    borderBottom: '1px solid #334155',
    paddingBottom: '2px',
  },
  consoleContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '8px',
    overflow: 'hidden',
  },
  consoleTitle: {
    color: '#94a3b8',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  logList: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#020617',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  logLine: {
    lineHeight: '1.4',
    wordBreak: 'break-all',
  },
};

export default DebugOverlay;