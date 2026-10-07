import api from './api.js';

export const createMeeting = async (meetingData) => {
  return await api.post('/meetings', meetingData);
};

export const createMeetingFromUpload = async (formData) => {
  return await api.post('/meetings/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const listMeetings = async (params = {}) => {
  return await api.get('/meetings', { params });
};

export const getMeetingById = async (meetingId) => {
  return await api.get(`/meetings/${meetingId}`);
};

export const updateMeeting = async (meetingId, updateData) => {
  return await api.patch(`/meetings/${meetingId}`, updateData);
};

export const deleteMeeting = async (meetingId) => {
  return await api.delete(`/meetings/${meetingId}`);
};

export const processMeeting = async (meetingId) => {
  return await api.post(`/meetings/${meetingId}/process`);
};

export const getProcessingStatus = async (meetingId) => {
  return await api.get(`/meetings/${meetingId}/processing`);
};

export const compareMeetings = async (meetingA, meetingB) => {
  return await api.get('/meetings/compare', {
    params: { meetingA, meetingB }
  });
};

export const exportMeeting = async (meetingId, format = 'json') => {
  return await api.get(`/meetings/${meetingId}/export`, {
    params: { format }
  });
};

export const askMyMeetings = async (payload) => {
  return await api.post('/meetings/ask', payload);
};

export default {
  createMeeting,
  createMeetingFromUpload,
  listMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  processMeeting,
  getProcessingStatus,
  compareMeetings,
  exportMeeting,
  askMyMeetings
};
