import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, File, X, CheckCircle, AlertCircle, Mic, Music, Video, FileText } from 'lucide-react';

const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.aac', '.flac', '.opus'];
const VIDEO_EXTS = ['.mp4', '.mov', '.mkv'];

export const FileUploadZone = ({
  onFileSelect,
  selectedFile,
  onClearFile,
  accept = '.txt,.pdf,.docx,.doc,.mp3,.wav,.m4a,.webm,.ogg,.mp4,.aac,.flac',
  maxSizeMB = 50
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Generate object URL for audio playback if an audio file is selected
  useEffect(() => {
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isAudio = AUDIO_EXTS.some(ext => fileName.endsWith(ext)) || selectedFile.type?.startsWith('audio/');
      if (isAudio) {
        const url = URL.createObjectURL(selectedFile);
        setAudioUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setAudioUrl(null);
  }, [selectedFile]);

  const validateFile = (file) => {
    setError(null);
    const validExtensions = [
      '.txt', '.pdf', '.docx', '.doc',
      '.mp3', '.wav', '.m4a', '.webm', '.ogg', '.mp4', '.aac', '.flac'
    ];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => fileName.endsWith(ext)) ||
      file.type?.startsWith('audio/') ||
      file.type?.startsWith('video/') ||
      file.type === 'text/plain' ||
      file.type === 'application/pdf';

    if (!isValidExt) {
      setError(`Invalid file type. Supported formats: .TXT, .PDF, .DOCX, .MP3, .WAV, .M4A, .WEBM, .MP4.`);
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${maxSizeMB}MB.`);
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileCategory = (file) => {
    const name = file.name.toLowerCase();
    if (AUDIO_EXTS.some(ext => name.endsWith(ext)) || file.type?.startsWith('audio/')) {
      return { type: 'audio', label: 'Audio Recording (Groq Whisper STT)', icon: Mic, bg: 'bg-amber-200' };
    }
    if (VIDEO_EXTS.some(ext => name.endsWith(ext)) || file.type?.startsWith('video/')) {
      return { type: 'video', label: 'Video Recording (Groq Whisper STT)', icon: Video, bg: 'bg-purple-200' };
    }
    if (name.endsWith('.pdf')) {
      return { type: 'pdf', label: 'PDF Document', icon: FileText, bg: 'bg-rose-200' };
    }
    return { type: 'document', label: 'Text Document', icon: File, bg: 'bg-emerald-200' };
  };

  const fileCategory = selectedFile ? getFileCategory(selectedFile) : null;
  const CategoryIcon = fileCategory?.icon || File;

  return (
    <div className="space-y-3">
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-black bg-neo-yellow/30 scale-[1.01]'
              : 'border-black/60 bg-white hover:border-black hover:bg-amber-50/40 shadow-neo-sm'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept={accept}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-neo-yellow border-2 border-black rounded-2xl flex items-center justify-center shadow-neo-xs">
              <UploadCloud size={28} className="text-black" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-black">
                Click to browse or drag & drop meeting document or recording
              </p>
              <p className="text-xs font-bold text-gray-500">
                Supports Audio (<strong className="text-black">.MP3, .WAV, .M4A, .WEBM</strong>) & Documents (<strong className="text-black">.TXT, .PDF, .DOCX</strong>) up to {maxSizeMB}MB
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 border border-black rounded shadow-neo-xs">
                  <Mic size={11} /> Groq Whisper-Large-v3
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-black rounded shadow-neo-xs">
                  <CheckCircle size={11} /> Auto Speech-to-Text
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-neo space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 ${fileCategory.bg} border-2 border-black rounded-xl flex items-center justify-center font-bold shrink-0 shadow-neo-xs`}>
                <CategoryIcon size={22} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black text-black truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.2 border border-black/30 rounded">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-700">
                    {fileCategory.label}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClearFile}
              className="p-2 rounded-xl border-2 border-black bg-white hover:bg-rose-200 transition-colors shadow-neo-xs cursor-pointer"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>

          {/* Audio Player Preview */}
          {audioUrl && (
            <div className="p-3 bg-amber-50/70 border-2 border-black rounded-xl space-y-1.5 shadow-neo-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-black">
                <span className="flex items-center gap-1.5">
                  <Music size={13} className="text-amber-800" />
                  Recording Audio Preview
                </span>
                <span className="text-[10px] font-mono text-gray-500 uppercase">
                  Ready for Whisper STT
                </span>
              </div>
              <audio controls src={audioUrl} className="w-full h-8" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} className="shrink-0 text-rose-600" />
          <span>{typeof error === 'string' ? error : (error?.message || 'Invalid file')}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
