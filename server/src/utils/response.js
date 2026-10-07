/**
 * Standardized API Response Utilities
 * Conforms to API.md specification
 */

export const sendSuccess = (res, data = {}, message = 'Operation completed successfully', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const sendError = (res, message = 'An error occurred', code = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
  const errorPayload = {
    code,
    message
  };

  if (details) {
    errorPayload.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorPayload
  });
};

export default {
  sendSuccess,
  sendError
};
