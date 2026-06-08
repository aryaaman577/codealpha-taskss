import { Router } from 'express';
import * as fileController from '../controllers/file.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', fileController.uploadFileRecord);
router.get('/', fileController.getFiles);
router.delete('/:id', fileController.deleteFileRecord);

export default router;
