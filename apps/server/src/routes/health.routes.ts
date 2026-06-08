import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/apiResponse';
import os from 'os';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const uptime = process.uptime();
    const mem = process.memoryUsage();

    return sendSuccess(
      res,
      {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime)}s`,
        environment: process.env.NODE_ENV,
        database: {
          connected: dbState === 1,
          state: (['disconnected', 'connected', 'connecting', 'disconnecting'] as string[])[dbState] ?? 'unknown',
        },
        memory: {
          rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        },
        cpu: os.cpus().length,
      },
      'Health check successful',
    );
  } catch {
    return sendError(res, 'Health check failed', 500, 'HEALTH_CHECK_FAIL');
  }
});

export default router;
