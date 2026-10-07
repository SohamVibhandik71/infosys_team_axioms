import express from 'express';
import { handleUpdateDecision } from '../controllers/decisionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.patch('/:decisionId', handleUpdateDecision);

export default router;
