import {
  createMeetingSchema,
  createMeetingUploadSchema,
  updateMeetingSchema,
  listMeetingsQuerySchema
} from '../validators/meetingValidator.js';
import {
  createMeeting,
  listMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  processMeetingPipeline,
  compareMeetings,
  exportMeetingReport,
  askMyMeetings
} from '../services/meetingService.js';
import { extractTextFromFile } from '../services/fileService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';

export const handleCreateMeeting = async (req, res, next) => {
  try {
    const validatedData = createMeetingSchema.parse(req.body);
    const meeting = await createMeeting({
      userId: req.user.id,
      title: validatedData.title,
      meetingDate: validatedData.meetingDate,
      notes: validatedData.notes
    });

    // Automatically trigger AI extraction & 2-pass verification pipeline
    let processedResult;
    try {
      processedResult = await processMeetingPipeline({
        meetingId: meeting.id,
        userId: req.user.id
      });
    } catch (procErr) {
      console.warn('Auto-processing error, returning initial meeting:', procErr.message);
      return sendSuccess(res, { meeting }, 'Meeting created successfully (processing pending)', 201);
    }

    return sendSuccess(res, { meeting: processedResult.meeting || meeting, ...processedResult }, 'Meeting created and grounded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const handleCreateMeetingFromUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file was uploaded. Please upload a .txt, .pdf, or .docx file.', 'FILE_MISSING', 400);
    }

    const validatedData = createMeetingUploadSchema.parse(req.body);

    // Extract text from document buffer
    const extractedNotes = await extractTextFromFile(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    const meeting = await createMeeting({
      userId: req.user.id,
      title: validatedData.title,
      meetingDate: validatedData.meetingDate,
      notes: extractedNotes,
      originalSource: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype || req.file.originalname.split('.').pop(),
        fileSize: req.file.size
      }
    });

    // Automatically trigger AI extraction & 2-pass verification pipeline
    let processedResult;
    try {
      processedResult = await processMeetingPipeline({
        meetingId: meeting.id,
        userId: req.user.id
      });
    } catch (procErr) {
      console.warn('Auto-processing error for uploaded file, returning initial meeting:', procErr.message);
      return sendSuccess(res, { meeting }, 'Meeting created from document upload successfully (processing pending)', 201);
    }

    return sendSuccess(res, { meeting: processedResult.meeting || meeting, ...processedResult }, 'Meeting created and grounded from document upload successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const handleListMeetings = async (req, res, next) => {
  try {
    const queryParams = listMeetingsQuerySchema.parse(req.query);
    const result = await listMeetings({
      userId: req.user.id,
      ...queryParams
    });

    return sendSuccess(res, result, 'Meetings retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleGetMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const result = await getMeetingById({
      meetingId,
      userId: req.user.id
    });

    return sendSuccess(res, result, 'Meeting details retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleUpdateMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const validatedData = updateMeetingSchema.parse(req.body);
    const updated = await updateMeeting({
      meetingId,
      userId: req.user.id,
      updateData: validatedData
    });

    return sendSuccess(res, { meeting: updated }, 'Meeting updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    await deleteMeeting({
      meetingId,
      userId: req.user.id
    });

    return sendSuccess(res, null, 'Meeting deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleProcessMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const processedMeeting = await processMeetingPipeline({
      meetingId,
      userId: req.user.id
    });

    return sendSuccess(res, processedMeeting, 'Meeting processed and verified successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleGetProcessingStatus = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const result = await getMeetingById({ meetingId, userId: req.user.id });

    return sendSuccess(res, {
      meetingId,
      status: result.meeting.analysis_status,
      hasSummary: !!result.meeting.summary,
      actionCount: result.actions.length,
      verificationStatus: result.verification?.verification_status || 'pending'
    }, 'Processing status retrieved', 200);
  } catch (error) {
    next(error);
  }
};

export const handleCompareMeetings = async (req, res, next) => {
  try {
    const compareSchema = z.object({
      meetingA: z.string(),
      meetingB: z.string()
    });

    const { meetingA, meetingB } = compareSchema.parse(req.query);

    const comparisonResult = await compareMeetings({
      meetingAId: meetingA,
      meetingBId: meetingB,
      userId: req.user.id
    });

    return sendSuccess(res, comparisonResult, 'Meeting comparison generated', 200);
  } catch (error) {
    next(error);
  }
};

export const handleExportMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const format = req.query.format === 'markdown' ? 'markdown' : 'json';

    const report = await exportMeetingReport({
      meetingId,
      userId: req.user.id,
      format
    });

    if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      return res.send(report.content);
    }

    return sendSuccess(res, report.content, 'Meeting report exported successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleAskMeetings = async (req, res, next) => {
  try {
    const askSchema = z.object({
      question: z.string().min(1, 'Question is required'),
      meetingIds: z.array(z.string()).optional().default([])
    });

    const { question, meetingIds } = askSchema.parse(req.body);

    const result = await askMyMeetings({
      userId: req.user.id,
      question,
      meetingIds
    });

    return sendSuccess(res, result, 'Answer generated from meeting intelligence', 200);
  } catch (error) {
    next(error);
  }
};

export default {
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
};