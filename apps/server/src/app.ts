import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { generalLimiter, authLimiter, fileLimiter, emailLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import meetingRoutes from './routes/meeting.routes';
import chatRoutes from './routes/chat.routes';
import fileRoutes from './routes/file.routes';
import whiteboardRoutes from './routes/whiteboard.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import { env } from './config/env';

const app = express();

const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:3000'];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting — order matters: specific paths before the general catch-all
app.use('/api/auth/otp', emailLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/files', fileLimiter);
app.use('/api', generalLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api', chatRoutes); // /chats and /messages
app.use('/api/files', fileRoutes);
app.use('/api/whiteboards', whiteboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global error handler — must be last
app.use(errorHandler);

export default app;
