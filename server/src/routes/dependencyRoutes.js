import express from 'express';
import { handleCreateDependency, handleDeleteDependency } from '../controllers/dependencyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', handleCreateDependency);
router.delete('/:dependencyId', handleDeleteDependency);

export default router;