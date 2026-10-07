import express from 'express';
import {
  handleCreateMeeting,
  handleCreateMeetingFromUpload,
  handleListMeetings,
  handleGetMeeting,
  handleUpdateMeeting,
  handleDeleteMeeting,
  handleProcessMeeting,
  handleGetProcessingStatus,
  handleCompareMeetings,
  handleExportMeeting,
  handleAskMeetings
} from '../controllers/meetingController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All meeting routes require authentication
router.use(authenticate);

// Special / Cross-meeting routes (must be defined before /:meetingId parameter routes)
router.get('/compare', handleCompareMeetings);
router.post('/ask', handleAskMeetings);
router.post('/upload', upload.single('file'), handleCreateMeetingFromUpload);

// Primary CRUD
router.post('/', handleCreateMeeting);
router.get('/', handleListMeetings);
router.get('/:meetingId', handleGetMeeting);
router.patch('/:meetingId', handleUpdateMeeting);
router.delete('/:meetingId', handleDeleteMeeting);

// AI Processing & Export endpoints
router.post('/:meetingId/process', handleProcessMeeting);
router.post('/:meetingId/reprocess', handleProcessMeeting);
router.get('/:meetingId/processing', handleGetProcessingStatus);
router.get('/:meetingId/export', handleExportMeeting);

export default router;