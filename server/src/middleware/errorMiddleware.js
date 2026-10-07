import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND', 404);
};

export const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}:`, err);

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, 'Validation failed for request data', 'VALIDATION_ERROR', 422, formattedErrors);
  }

  // Handle SyntaxError (e.g. malformed JSON in body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON payload in request body', 'INVALID_JSON', 400);
  }

  // Handle Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, `Uploaded file exceeds the maximum allowed size of ${env.MAX_FILE_SIZE_MB}MB`, 'FILE_TOO_LARGE', 413);
    }
    return sendError(res, `File upload error: ${err.message}`, 'UPLOAD_ERROR', 400);
  }

  // Custom Application Error
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  return sendError(res, message, errorCode, statusCode);
};

export default {
  notFoundHandler,
  errorHandler
};