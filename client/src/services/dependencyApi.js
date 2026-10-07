import api from './api.js';

export const createDependency = async (dependencyData) => {
  return await api.post('/dependencies', dependencyData);
};

export const deleteDependency = async (dependencyId) => {
  return await api.delete(`/dependencies/${dependencyId}`);
};

export default {
  createDependency,
  deleteDependency
};
