import { z } from 'zod';

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Meeting title is required').max(255),
  meetingDate: z.string().optional(),
  meeting_date: z.string().optional(),
  notes: z.string().optional(),
  original_notes: z.string().optional(),
  originalNotes: z.string().optional(),
  attendees: z.any().optional()
}).transform((data) => ({
  title: data.title,
  meetingDate: data.meetingDate || data.meeting_date || new Date().toISOString().split('T')[0],
  notes: (data.notes || data.original_notes || data.originalNotes || '').trim(),
  attendees: data.attendees || []
})).refine((data) => data.notes.length > 0, {
  message: 'Meeting notes cannot be empty',
  path: ['notes']
});

export const createMeetingUploadSchema = z.object({
  title: z.string().trim().min(1, 'Meeting title is required').max(255),
  meetingDate: z.string().optional(),
  meeting_date: z.string().optional(),
  attendees: z.any().optional()
}).transform((data) => ({
  title: data.title,
  meetingDate: data.meetingDate || data.meeting_date || new Date().toISOString().split('T')[0],
  attendees: data.attendees || []
}));

export const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  meetingDate: z.string().optional(),
  meeting_date: z.string().optional(),
  summary: z.string().optional()
});

export const listMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.enum(['meeting_date', 'created_at', 'title']).default('meeting_date'),
  order: z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')
});

export default {
  createMeetingSchema,
  createMeetingUploadSchema,
  updateMeetingSchema,
  listMeetingsQuerySchema
};