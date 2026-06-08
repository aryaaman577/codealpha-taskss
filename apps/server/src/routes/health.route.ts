import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/apiResponse';
import os from 'os';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    const data = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime)} seconds`,
      environment: process.env.NODE_ENV,
      database: {
        connected: dbStatus === 1,
        status: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus],
      },
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
      },
      cpu: os.cpus().length,
    };

    return sendSuccess(res, data, 'Health check successful');
  } catch (err) {
    return sendError(res, 'Health check failed', 500, 'HEALTH_CHECK_FAIL');
  }
});

export default router;
