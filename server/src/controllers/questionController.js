import { z } from 'zod';
import { resolveQuestion } from '../services/meetingService.js';
import { sendSuccess } from '../utils/response.js';

const resolveQuestionSchema = z.object({
  status: z.enum(['unresolved', 'resolved', 'answered']).default('resolved').transform(s => s === 'answered' ? 'resolved' : s),
  answer: z.string().optional()
});

export const handleResolveQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const validatedData = resolveQuestionSchema.parse(req.body);
    const updated = await resolveQuestion({
      questionId,
      userId: req.user.id,
      status: validatedData.status,
      answer: validatedData.answer
    });

    return sendSuccess(res, { question: updated }, 'Question status updated successfully', 200);
  } catch (error) {
    next(error);
  }
};

export default {
  handleResolveQuestion
};