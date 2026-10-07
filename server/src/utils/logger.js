import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

export const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, error = null, meta = {}) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, {
      ...(error ? { errorMessage: error.message, stack: isProduction ? undefined : error.stack } : {}),
      ...meta
    });
  },
  debug: (message, meta = {}) => {
    if (!isProduction) {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, Object.keys(meta).length ? meta : '');
    }
  }
};

export default logger;
