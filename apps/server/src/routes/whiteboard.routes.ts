import { Router } from 'express';
import * as whiteboardController from '../controllers/whiteboard.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/:roomId', whiteboardController.getOrCreateWhiteboard);
router.patch('/:id', whiteboardController.saveWhiteboardState);

export default router;
