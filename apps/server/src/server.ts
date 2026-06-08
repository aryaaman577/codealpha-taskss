import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { configureSocket } from './services/socket.service';
import { env } from './config/env';

const PORT = env.PORT || 5000;
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.set('io', io);
configureSocket(io);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 SyncSpace server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  console.log('🔌 SIGINT received: closing server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('🔌 SIGTERM received: closing server...');
  server.close(() => process.exit(0));
});
