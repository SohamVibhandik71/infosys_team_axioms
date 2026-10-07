import multer from 'multer';
import { env } from '../config/env.js';

// Memory storage to process files directly as buffers
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4',
  'audio/aac',
  'audio/flac',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska'
];

const allowedExtensions = [
  '.txt', '.pdf', '.docx', '.doc',
  '.mp3', '.wav', '.m4a', '.webm', '.ogg', '.mp4', '.aac', '.flac'
];

const fileFilter = (req, file, cb) => {
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(extension) ||
    file.mimetype.startsWith('audio/') ||
    file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type: ${file.mimetype}. Allowed formats: .txt, .pdf, .docx, .mp3, .wav, .m4a, .webm, .ogg, .mp4`);
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (env.MAX_FILE_SIZE_MB || 50) * 1024 * 1024
  }
});

export default upload;