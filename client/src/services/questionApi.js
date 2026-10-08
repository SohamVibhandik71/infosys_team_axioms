import api from './api.js';

export const resolveQuestion = async (questionId, payload = {}) => {
  return await api.patch(`/questions/${questionId}`, payload);
};

export default {
  resolveQuestion
};
