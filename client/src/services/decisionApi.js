import api from './api.js';

export const updateDecision = async (decisionId, updateData) => {
  return await api.patch(`/decisions/${decisionId}`, updateData);
};

export default {
  updateDecision
};
