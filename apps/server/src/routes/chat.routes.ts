import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/chats', chatController.createChat);
router.get('/chats', chatController.getUserChats);
router.get('/messages/:channelType/:channelId', chatController.getChatMessages);

export default router;
