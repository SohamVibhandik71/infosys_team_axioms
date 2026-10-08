import { z } from 'zod';
import { createDependency, deleteDependency } from '../services/meetingService.js';
import { sendSuccess } from '../utils/response.js';

const createDependencySchema = z.object({
  meetingId: z.string().min(1),
  sourceActionId: z.string().min(1),
  targetActionId: z.string().min(1),
  relationship: z.string().default('blocks')
});

export const handleCreateDependency = async (req, res, next) => {
  try {
    const validatedData = createDependencySchema.parse(req.body);
    const dependency = await createDependency({
      meetingId: validatedData.meetingId,
      userId: req.user.id,
      sourceActionId: validatedData.sourceActionId,
      targetActionId: validatedData.targetActionId,
      relationship: validatedData.relationship
    });

    return sendSuccess(res, { dependency }, 'Dependency created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const handleDeleteDependency = async (req, res, next) => {
  try {
    const { dependencyId } = req.params;
    await deleteDependency({
      dependencyId,
      userId: req.user.id
    });

    return sendSuccess(res, null, 'Dependency deleted successfully', 200);
  } catch (error) {
    next(error);
  }
};

export default {
  handleCreateDependency,
  handleDeleteDependency
};