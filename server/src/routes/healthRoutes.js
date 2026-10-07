import express from 'express';
import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';

const router = express.Router();

router.get('/health', async (req, res, next) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await query('SELECT 1 as connected');
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'meetingos-backend',
    database: dbStatus
  }, 'MeetingOS API is active');
});

export default router;