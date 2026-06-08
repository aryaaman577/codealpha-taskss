import { Router } from 'express';
import * as meetingController from '../controllers/meeting.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getUserMeetings);
router.get('/:roomId', meetingController.getMeeting);

export default router;
