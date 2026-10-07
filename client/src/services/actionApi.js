import api from './api.js';

export const updateAction = async (actionId, updateData) => {
  return await api.patch(`/actions/${actionId}`, updateData);
};

export const deleteAction = async (actionId) => {
  return await api.delete(`/actions/${actionId}`);
};

export default {
  updateAction,
  deleteAction
};
