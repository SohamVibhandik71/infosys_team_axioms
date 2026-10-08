import { z } from 'zod';
import { updateDecision } from '../services/meetingService.js';
import { sendSuccess } from '../utils/response.js';

const updateDecisionSchema = z.object({
  decision: z.string().trim().min(1, 'Decision text cannot be empty')
});

export const handleUpdateDecision = async (req, res, next) => {
  try {
    const { decisionId } = req.params;
    const validatedData = updateDecisionSchema.parse(req.body);
    const updated = await updateDecision({
      decisionId,
      userId: req.user.id,
      decisionText: validatedData.decision
    });

    return sendSuccess(res, { decision: updated }, 'Decision updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export default {
  handleUpdateDecision
};
