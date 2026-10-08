import express from 'express';
import { handleUpdateAction, handleDeleteAction } from '../controllers/actionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.patch('/:actionId', handleUpdateAction);
router.delete('/:actionId', handleDeleteAction);

export default router;
