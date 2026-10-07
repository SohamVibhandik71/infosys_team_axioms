import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromFile } from '../../src/services/fileService.js';

describe('fileService', () => {
  it('should extract text from plain text buffer', async () => {
    const buffer = Buffer.from('Sprint 42 Architecture Discussion\nElena will lead the migration.');
    const result = await extractTextFromFile(buffer, 'text/plain', 'notes.txt');

    assert.equal(result, 'Sprint 42 Architecture Discussion\nElena will lead the migration.');
  });

  it('should throw unsupported file type error for unsupported formats', async () => {
    const buffer = Buffer.from('fake image content');
    await assert.rejects(
      async () => {
        await extractTextFromFile(buffer, 'image/png', 'diagram.png');
      },
      (err) => {
        assert.equal(err.code, 'UNSUPPORTED_FILE_TYPE');
        return true;
      }
    );
  });

  it('should throw empty document error if text is empty after normalization', async () => {
    const buffer = Buffer.from('    \n\n   ');
    await assert.rejects(
      async () => {
        await extractTextFromFile(buffer, 'text/plain', 'empty.txt');
      },
      (err) => {
        assert.equal(err.code, 'EMPTY_DOCUMENT_TEXT');
        return true;
      }
    );
  });
});
