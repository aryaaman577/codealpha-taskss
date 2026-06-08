import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markNotificationRead);
router.patch('/read-all', notificationController.markAllNotificationsRead);

export default router;
