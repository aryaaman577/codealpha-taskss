import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', analyticsController.getUserAnalytics);

export default router;
