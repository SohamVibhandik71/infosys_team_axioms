import { z } from 'zod';
import { updateAction, deleteAction } from '../services/meetingService.js';
import { sendSuccess } from '../utils/response.js';

const updateActionSchema = z.object({
  task: z.string().trim().min(1).optional(),
  ownerName: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'blocked']).optional()
});

export const handleUpdateAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const validatedData = updateActionSchema.parse(req.body);
    const updated = await updateAction({
      actionId,
      userId: req.user.id,
      updateData: validatedData
    });

    return sendSuccess(res, { action: updated }, 'Action item updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    await deleteAction({
      actionId,
      userId: req.user.id
    });

    return sendSuccess(res, null, 'Action item deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export default {
  handleUpdateAction,
  handleDeleteAction
};
