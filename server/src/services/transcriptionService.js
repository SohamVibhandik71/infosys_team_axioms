import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Transcribes audio/video recordings to text using Groq Cloud Whisper API (whisper-large-v3)
 * @param {Buffer} audioBuffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<string>} Transcribed text
 */
export const transcribeAudioWithGroq = async (audioBuffer, originalName = 'recording.mp3', mimeType = 'audio/mpeg') => {
  const apiKey = env.GROQ_API_KEY;
  const model = env.GROQ_WHISPER_MODEL || 'whisper-large-v3';

  if (!apiKey || apiKey === 'your_groq_api_key' || apiKey === '') {
    const error = new Error('GROQ_API_KEY is not configured on the server for audio transcription.');
    error.statusCode = 500;
    error.code = 'GROQ_API_KEY_MISSING';
    throw error;
  }

  logger.info(`Sending audio transcription request to Groq Whisper (${model}, file: ${originalName}, size: ${(audioBuffer.length / 1024).toFixed(1)} KB)`);

  const formData = new FormData();
  const fileBlob = new Blob([audioBuffer], { type: mimeType || 'audio/mpeg' });
  formData.append('file', fileBlob, originalName);
  formData.append('model', model);
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0.0');

  const endpoint = 'https://api.groq.com/openai/v1/audio/transcriptions';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error('Groq Whisper transcription API returned error:', { status: response.status, body: errBody });
      let message = `Groq Whisper API error (status ${response.status})`;
      try {
        const parsed = JSON.parse(errBody);
        if (parsed.error?.message) message = parsed.error.message;
      } catch (_) {}
      const error = new Error(message);
      error.statusCode = response.status >= 500 ? 502 : 400;
      error.code = 'AUDIO_TRANSCRIPTION_FAILED';
      throw error;
    }

    const data = await response.json();
    const transcribedText = data.text || '';

    if (!transcribedText || transcribedText.trim().length === 0) {
      throw new Error('Groq Whisper returned an empty transcription for the uploaded audio.');
    }

    logger.info(`Successfully transcribed audio file (${originalName}): ${transcribedText.length} characters`);
    return transcribedText;
  } catch (err) {
    if (err.code === 'AUDIO_TRANSCRIPTION_FAILED' || err.code === 'GROQ_API_KEY_MISSING') {
      throw err;
    }
    logger.error('Failed to transcribe audio recording:', err.message);
    const error = new Error(`Audio transcription failed: ${err.message}`);
    error.statusCode = 502;
    error.code = 'AUDIO_TRANSCRIPTION_FAILED';
    throw error;
  }
};

export default {
  transcribeAudioWithGroq
};
