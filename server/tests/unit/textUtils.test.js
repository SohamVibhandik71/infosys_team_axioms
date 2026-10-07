import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, truncateText } from '../../src/utils/textUtils.js';

describe('textUtils', () => {
  it('should normalize excessive whitespace and empty lines', () => {
    const raw = '  Meeting with Rahul. \r\n\r\n\r\n  He will finish the API.    \n\n\n  Deadline: Friday.  ';
    const normalized = normalizeText(raw);

    assert.equal(normalized, 'Meeting with Rahul.\n\nHe will finish the API.\n\nDeadline: Friday.');
  });

  it('should truncate text properly when length exceeds max', () => {
    const text = 'This is a long sentence that should be truncated cleanly for summaries.';
    const truncated = truncateText(text, 24);

    assert.equal(truncated, 'This is a long sentence...');
  });

  it('should handle empty or non-string inputs gracefully', () => {
    assert.equal(normalizeText(''), '');
    assert.equal(normalizeText(null), '');
    assert.equal(truncateText(''), '');
    assert.equal(truncateText(null), '');
  });
});
