import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { normalizeText } from '../utils/textUtils.js';
import { transcribeAudioWithGroq } from './transcriptionService.js';

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'mp4', 'aac', 'flac', 'opus'];

/**
 * Extracts plain text from an uploaded file buffer based on MIME type / extension
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @param {string} originalName 
 * @returns {Promise<string>}
 */
export const extractTextFromFile = async (buffer, mimeType = '', originalName = '') => {
  const extension = originalName.split('.').pop()?.toLowerCase() || '';

  let rawText = '';

  try {
    if (mimeType === 'text/plain' || extension === 'txt') {
      rawText = buffer.toString('utf-8');
    } else if (mimeType === 'application/pdf' || extension === 'pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const textResult = await parser.getText();
        rawText = textResult?.text || '';
      } finally {
        await parser.destroy();
      }
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extension === 'docx'
    ) {
      const docxResult = await mammoth.extractRawText({ buffer });
      rawText = docxResult.value || '';
    } else if (
      AUDIO_EXTENSIONS.includes(extension) ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('video/')
    ) {
      // Audio/Video recording - Transcribe with Groq Whisper API
      rawText = await transcribeAudioWithGroq(buffer, originalName, mimeType);
    } else {
      const error = new Error(`Unsupported file type: ${mimeType || extension}. Supported formats: TXT, PDF, DOCX, MP3, WAV, M4A, WEBM, MP4.`);
      error.statusCode = 400;
      error.code = 'UNSUPPORTED_FILE_TYPE';
      throw error;
    }
  } catch (err) {
    if (err.code === 'UNSUPPORTED_FILE_TYPE' || err.code === 'AUDIO_TRANSCRIPTION_FAILED' || err.code === 'GROQ_API_KEY_MISSING') throw err;
    const error = new Error(`Failed to extract text from document (${originalName}): ${err.message}`);
    error.statusCode = 422;
    error.code = 'TEXT_EXTRACTION_FAILED';
    throw error;
  }

  const normalized = normalizeText(rawText);

  if (!normalized || normalized.length === 0) {
    const error = new Error(`The uploaded file (${originalName}) contains no readable text or is empty.`);
    error.statusCode = 422;
    error.code = 'EMPTY_DOCUMENT_TEXT';
    throw error;
  }

  return normalized;
};

export default {
  extractTextFromFile
};