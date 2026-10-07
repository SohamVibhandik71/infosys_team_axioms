import express from 'express';
import { handleResolveQuestion } from '../controllers/questionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.patch('/:questionId', handleResolveQuestion);

export default router;