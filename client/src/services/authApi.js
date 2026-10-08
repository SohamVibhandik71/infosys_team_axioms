import api from './api.js';

export const loginUser = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

export const registerUser = async (userData) => {
  return await api.post('/auth/register', userData);
};

export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

export const getMe = getCurrentUser;

export default {
  loginUser,
  registerUser,
  getCurrentUser,
  getMe
};
