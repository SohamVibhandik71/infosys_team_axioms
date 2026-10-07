/**
 * Text preprocessing & normalization utilities
 */

/**
 * Normalizes raw meeting text by removing excessive whitespace and trailing spaces
 * while preserving paragraph structure and meaningful formatting.
 * @param {string} text 
 * @returns {string}
 */
export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    // Normalize Windows/Mac line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes and non-printable control characters (except newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace multiple consecutive blank lines with maximum two newlines
    .replace(/\n{3,}/g, '\n\n')
    // Replace multiple horizontal spaces/tabs with single space
    .replace(/[ \t]{2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
};

/**
 * Truncates text safely to a maximum character length with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export const truncateText = (text, maxLength = 200) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Safely parses human-written dates, ISO dates, and relative expressions
 * @param {string|Date|null} dateVal
 * @returns {Date|null}
 */
export const parseFlexibleDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal !== 'string') return null;

  const cleaned = dateVal.trim();
  if (!cleaned || cleaned.toLowerCase() === 'null' || cleaned.toLowerCase() === 'none' || cleaned.toLowerCase() === 'n/a') return null;

  // 1. Direct parse
  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // 2. Remove day of week
  const withoutDay = cleaned.replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[,\s]+/i, '').trim();
  d = new Date(withoutDay);
  if (!isNaN(d.getTime())) return d;

  // 3. Remove ordinals like 1st, 2nd, 3rd, 24th
  const withoutOrdinals = withoutDay.replace(/(\d+)(st|nd|rd|th)/gi, '$1').trim();
  d = new Date(withoutOrdinals);
  if (!isNaN(d.getTime())) return d;

  // 4. Try adding current year if month is detected
  const monthMatch = withoutOrdinals.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i);
  if (monthMatch) {
    const currentYear = new Date().getFullYear();
    d = new Date(`${withoutOrdinals} ${currentYear}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

/**
 * Converts any date expression safely to ISO string, returning null on failure
 * @param {string|Date|null} dateVal
 * @returns {string|null}
 */
export const safeIsoString = (dateVal) => {
  const d = parseFlexibleDate(dateVal);
  return d ? d.toISOString() : null;
};

export default {
  normalizeText,
  truncateText,
  parseFlexibleDate,
  safeIsoString
};

