/**
 * Formats any API or JS error into a readable string
 * Prevents "Objects are not valid as a React child" errors
 */
export const getErrorMessage = (err, defaultMsg = 'An unexpected error occurred.') => {
  if (!err) return defaultMsg;
  if (typeof err === 'string') return err;

  // Server structured error: { code, message, details }
  if (err.response?.data?.error) {
    const errorObj = err.response.data.error;
    if (typeof errorObj === 'string') return errorObj;

    let msg = errorObj.message || (errorObj.code ? `Error: ${errorObj.code}` : defaultMsg);
    if (Array.isArray(errorObj.details) && errorObj.details.length > 0) {
      const detailStr = errorObj.details.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(', ');
      msg += ` (${detailStr})`;
    }
    return msg;
  }

  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  if (err.error && typeof err.error === 'object' && err.error.message) {
    return err.error.message;
  }

  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return defaultMsg;
};

export default getErrorMessage;
