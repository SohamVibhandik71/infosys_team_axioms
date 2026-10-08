import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Radio, 
  Square, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Monitor, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  Pause, 
  Headphones, 
  Sparkles, 
  Info,
  Volume1,
  Download,
  Bell
} from 'lucide-react';

export const LiveMeetingCaptureZone = ({
  onAudioCaptured,
  capturedBlob,
  onClear,
  onStartRecording,
  onStopRecording,
  isRecording,
  autoSetTitle
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [includeMic, setIncludeMic] = useState(true);
  const [audioUrl, setAudioUrl] = useState(null);
  const [captureError, setCaptureError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Live speaker passthrough monitoring state (DURING recording)
  const [speakerPassthroughMuted, setSpeakerPassthroughMuted] = useState(false);
  const [speakerPassthroughVolume, setSpeakerPassthroughVolume] = useState(100);

  // Custom audio player state (AFTER recording)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackVolume, setPlaybackVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const liveMonitorRef = useRef(null);
  
  // Persistent refs to prevent Chromium V8 garbage collection of active WebAudio nodes
  const activeStreamsRef = useRef({
    displayStream: null,
    micStream: null,
    audioCtx: null,
    displaySource: null,
    micSource: null,
    tabGain: null,
    micGain: null,
    speakerMonitorGain: null,
    silentGain: null,
    analyser: null,
    destination: null
  });

  // Sync captured blob to audio URL
  useEffect(() => {
    if (capturedBlob) {
      const url = URL.createObjectURL(capturedBlob);
      setAudioUrl(url);
      setPlaybackTime(0);
      setIsPlaying(false);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl(null);
      setPlaybackTime(0);
      setIsPlaying(false);
    }
  }, [capturedBlob]);

  // Clean up all media tracks and audio contexts on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      
      const { displayStream, micStream, audioCtx } = activeStreamsRef.current;
      if (displayStream) {
        displayStream.getTracks().forEach(t => t.stop());
      }
      if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      if (liveMonitorRef.current) {
        liveMonitorRef.current.srcObject = null;
      }
    };
  }, []);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Speaker Sound Test (Plays a clean chime to verify physical speaker audio)
  const handleTestSpeakerSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      // Play a pleasant 2-tone chime
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.error('Speaker test failed:', e);
    }
  };

  // Toggle or adjust live speaker passthrough volume while recording
  const handleSpeakerMonitorMuteToggle = () => {
    const nextMuted = !speakerPassthroughMuted;
    setSpeakerPassthroughMuted(nextMuted);
    if (liveMonitorRef.current) {
      liveMonitorRef.current.muted = nextMuted;
    }
    if (activeStreamsRef.current.speakerMonitorGain) {
      activeStreamsRef.current.speakerMonitorGain.gain.value = nextMuted ? 0 : (speakerPassthroughVolume / 100);
    }
  };

  const handleSpeakerMonitorVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSpeakerPassthroughVolume(val);
    if (liveMonitorRef.current) {
      liveMonitorRef.current.volume = val / 100;
    }
    if (activeStreamsRef.current.speakerMonitorGain && !speakerPassthroughMuted) {
      activeStreamsRef.current.speakerMonitorGain.gain.value = val / 100;
    }
  };

  // Start live meeting capture
  const handleStartCapture = async () => {
    setCaptureError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen/tab audio capture is not supported in this browser. Please use Google Chrome, Edge, or Brave.');
      }

      // 1. Prompt user to select meeting tab
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        selfBrowserSurface: 'exclude',
        systemAudio: 'include',
        surfaceSwitching: 'include'
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach(t => t.stop());
        throw new Error('No tab audio detected! When Chrome opens the share window, make sure you select a Chrome Tab (Google Meet, Zoom, YouTube, etc.) and check "Share tab audio" before clicking Share.');
      }

      const tabAudioTrack = audioTracks[0];
      tabAudioTrack.enabled = true;

      // 2. Play live monitor audio element to wake up Chrome's audio track pipeline
      if (liveMonitorRef.current) {
        liveMonitorRef.current.srcObject = displayStream;
        liveMonitorRef.current.volume = speakerPassthroughVolume / 100;
        liveMonitorRef.current.muted = speakerPassthroughMuted;
        liveMonitorRef.current.play().catch(err => {
          console.warn('Live monitor note:', err);
        });
      }

      // 3. Request user microphone if requested
      let micStream = null;
      if (includeMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStream.getAudioTracks().forEach(t => { t.enabled = true; });
        } catch (micErr) {
          console.warn('Microphone permission not granted, proceeding with tab audio only:', micErr);
          micStream = null;
        }
      }

      // 4. Setup AudioContext and WebAudio Graph
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // Destination stream for MediaRecorder
      const destination = audioCtx.createMediaStreamDestination();

      // Speaker Monitor Gain connected to audioCtx.destination
      const speakerMonitorGain = audioCtx.createGain();
      speakerMonitorGain.gain.value = speakerPassthroughMuted ? 0 : (speakerPassthroughVolume / 100);
      speakerMonitorGain.connect(audioCtx.destination);

      // Create isolated audio-only stream from tab track
      const tabAudioOnlyStream = new MediaStream([tabAudioTrack]);
      const displaySource = audioCtx.createMediaStreamSource(tabAudioOnlyStream);
      
      const tabGain = audioCtx.createGain();
      tabGain.gain.value = 1.0;
      
      displaySource.connect(tabGain);
      // Route tab audio into MediaRecorder destination stream
      tabGain.connect(destination);
      // Route tab audio into hardware speaker output
      tabGain.connect(speakerMonitorGain);

      // Analyser node for real-time visualizer
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      tabGain.connect(analyser);

      let recordStream = null;
      let micSource = null;
      let micGain = null;
      let silentGain = null;

      if (micStream && micStream.getAudioTracks().length > 0) {
        // Dual audio mixing mode (Tab + Microphone)
        micSource = audioCtx.createMediaStreamSource(micStream);
        micGain = audioCtx.createGain();
        micGain.gain.value = 1.0;
        
        // Route mic audio into recording stream
        micSource.connect(micGain);
        micGain.connect(destination);

        // Silent sink to ensure mic audio pump is also actively rendered
        silentGain = audioCtx.createGain();
        silentGain.gain.value = 0.0;
        micGain.connect(silentGain);
        silentGain.connect(audioCtx.destination);

        // Visualizer
        micGain.connect(analyser);

        recordStream = destination.stream;

        activeStreamsRef.current = {
          displayStream,
          micStream,
          audioCtx,
          displaySource,
          micSource,
          tabGain,
          micGain,
          speakerMonitorGain,
          silentGain,
          analyser,
          destination
        };
      } else {
        // Direct pure tab audio recording
        recordStream = new MediaStream([tabAudioTrack]);

        activeStreamsRef.current = {
          displayStream,
          micStream: null,
          audioCtx,
          displaySource,
          tabGain,
          speakerMonitorGain,
          analyser,
          destination
        };
      }

      // Update realtime audio visualizer
      const updateAudioMeter = () => {
        if (!activeStreamsRef.current.analyser) return;
        const dataArray = new Uint8Array(activeStreamsRef.current.analyser.frequencyBinCount);
        activeStreamsRef.current.analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 255) * 100)));
        animFrameRef.current = requestAnimationFrame(updateAudioMeter);
      };
      updateAudioMeter();

      // Stop capture when user closes tab share from browser banner
      tabAudioTrack.onended = () => {
        handleStopCapture();
      };

      // 5. Setup MediaRecorder with 100ms sync warmup
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else mimeType = '';
      }

      const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : undefined;
      const recorder = new MediaRecorder(recordStream, options);
      mediaRecorderRef.current = recorder;

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        onAudioCaptured(finalBlob);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setAudioLevel(0);
      };

      // Start recorder after 100ms warmup
      setTimeout(() => {
        if (recorder.state === 'inactive') {
          recorder.start(500); // 500ms chunks
        }
      }, 100);

      setRecordingTime(0);
      setFinalDuration(0);
      if (onStartRecording) onStartRecording();
      if (autoSetTitle) autoSetTitle();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          setFinalDuration(next);
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Live meeting capture error:', err);
      if (err.name !== 'NotAllowedError') {
        setCaptureError(err.message || 'Failed to start live capture.');
      }
    }
  };

  // Stop recording and cleanup active tracks
  const handleStopCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    const { displayStream, micStream, audioCtx } = activeStreamsRef.current;
    if (displayStream) {
      displayStream.getTracks().forEach(t => t.stop());
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
    if (liveMonitorRef.current) {
      liveMonitorRef.current.srcObject = null;
    }

    clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setAudioLevel(0);
    if (onStopRecording) onStopRecording();
  };

  const handleReset = () => {
    handleStopCapture();
    onClear();
    setRecordingTime(0);
    setFinalDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setCaptureError(null);
  };

  // Custom Audio Player controls (AFTER recording)
  const togglePlay = async () => {
    if (!audioPlayerRef.current) return;
    try {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.volume = isMuted ? 0 : (playbackVolume / 100);
        audioPlayerRef.current.muted = isMuted;
        await audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback failed:', err);
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioPlayerRef.current) return;
    setPlaybackTime(audioPlayerRef.current.currentTime);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setPlaybackTime(newTime);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = newTime;
    }
  };

  const handlePlaybackVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setPlaybackVolume(val);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.volume = val / 100;
      if (val > 0 && isMuted) {
        audioPlayerRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = 0;
    }
  };

  const toggleMute = () => {
    if (!audioPlayerRef.current) return;
    const nextMuted = !isMuted;
    audioPlayerRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const activeDuration = finalDuration > 0 ? finalDuration : (recordingTime > 0 ? recordingTime : 1);

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Live Audio Monitor element: Wakes up Chrome's audio track pipeline and ensures live speaker audio */}
      <audio
        ref={liveMonitorRef}
        autoPlay
        playsInline
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, pointerEvents: 'none' }}
      />

      {/* Error Alert */}
      {captureError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2 animate-fadeIn shadow-neo-xs">
          <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black">Capture Error:</p>
            <p>{captureError}</p>
          </div>
        </div>
      )}

      {/* State 1: Active Live Recording */}
      {isRecording ? (
        <div className="bg-red-50 border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo text-center space-y-6 animate-pulse-subtle">
          
          {/* Header & Status Indicator */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 text-white border-2 border-black rounded-full font-black text-xs uppercase tracking-wider shadow-neo-xs animate-pulse">
              <Radio size={16} className="animate-spin" />
              LIVE MEETING AUDIO CAPTURE ACTIVE
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight">
              MeetingOS is listening in the background
            </h3>
            <p className="text-xs font-bold text-gray-700 max-w-md">
              Switch back to your Google Meet / Zoom tab. You will hear meeting audio through your speakers normally.
            </p>
          </div>

          {/* Large Digital Timer */}
          <div className="inline-block bg-white border-3 border-black rounded-2xl px-8 py-4 shadow-neo">
            <span className="font-mono text-4xl sm:text-5xl font-black text-rose-600 tracking-wider">
              {formatTime(recordingTime)}
            </span>
          </div>

          {/* Realtime Audio Activity Visualizer */}
          <div className="max-w-xs mx-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-600">
              <span className="flex items-center gap-1">
                <Volume2 size={13} className="text-rose-600" /> Audio Signal Level:
              </span>
              <span className="font-mono font-bold text-black">{audioLevel > 3 ? `${audioLevel}% (Sound Active)` : 'Listening...'}</span>
            </div>
            <div className="w-full h-3.5 bg-white border-2 border-black rounded-full overflow-hidden shadow-neo-xs p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-75"
                style={{ width: `${Math.max(4, audioLevel)}%` }}
              />
            </div>
          </div>

          {/* Stream Information & Speaker Passthrough Control */}
          <div className="bg-white border-2 border-black rounded-xl p-4 max-w-md mx-auto shadow-neo-xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-100 border border-black rounded-md">
                  <Volume2 size={16} className="text-purple-700" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-black">Live Speaker Monitor</h4>
                  <p className="text-[10px] font-bold text-gray-500">Audio passthrough to your physical speakers/headphones</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSpeakerMonitorMuteToggle}
                className={`px-2.5 py-1 border-2 border-black rounded-lg text-xs font-black transition-all cursor-pointer ${speakerPassthroughMuted ? 'bg-rose-200 text-rose-950 shadow-neo-xs' : 'bg-emerald-200 text-emerald-950 shadow-neo-xs'}`}
                title={speakerPassthroughMuted ? 'Unmute Live Speakers' : 'Mute Live Speakers'}
              >
                {speakerPassthroughMuted ? 'MUTED' : 'ACTIVE 🔊'}
              </button>
            </div>

            {!speakerPassthroughMuted && (
              <div className="flex items-center gap-2 pt-1">
                <Volume1 size={14} className="text-gray-600 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={speakerPassthroughVolume}
                  onChange={handleSpeakerMonitorVolumeChange}
                  className="w-full h-2 bg-gray-200 border border-black rounded-md appearance-none cursor-pointer accent-black"
                />
                <span className="font-mono text-[10px] font-bold text-gray-700 shrink-0 w-8 text-right">
                  {speakerPassthroughVolume}%
                </span>
              </div>
            )}
          </div>

          {/* Stream Information Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black rounded-lg text-xs font-bold text-black shadow-neo-xs">
              <Monitor size={14} className="text-blue-600" />
              <span>Tab Audio: <strong>Active & Playing</strong></span>
            </span>
            {includeMic && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-black rounded-lg text-xs font-bold text-black shadow-neo-xs">
                <Mic size={14} className="text-emerald-600" />
                <span>Microphone: <strong>Mixed In</strong></span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleStopCapture}
              className="px-6 py-3.5 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center gap-2 cursor-pointer active:translate-y-0.5"
            >
              <Square size={16} className="fill-black" />
              Stop Capture & Ground Intelligence
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3.5 bg-white hover:bg-rose-100 border-2 border-black rounded-xl font-bold text-xs text-rose-800 shadow-neo-xs transition-all cursor-pointer"
            >
              Discard
            </button>
          </div>

        </div>
      ) : capturedBlob ? (
        /* State 2: Audio Recorded & Ready for Ingestion */
        <div className="bg-emerald-50 border-3 border-black rounded-2xl p-6 shadow-neo space-y-4 animate-fadeIn">
          
          <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-black/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-300 border-2 border-black rounded-xl flex items-center justify-center shadow-neo-xs">
                <CheckCircle2 size={22} className="text-black" />
              </div>
              <div>
                <h4 className="text-sm font-black text-black">Live Meeting Audio Captured!</h4>
                <p className="text-[11px] font-bold text-emerald-800">
                  Ready for Groq Whisper transcription & Qualcomm AI analysis ({formatTime(activeDuration)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSpeakerSound}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-black rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-neo-xs cursor-pointer"
                title="Play test chime through speakers"
              >
                <Bell size={12} /> Test Speakers
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-black rounded-lg text-xs font-bold text-black flex items-center gap-1 shadow-neo-xs cursor-pointer"
              >
                <RotateCcw size={12} /> Re-record
              </button>
            </div>
          </div>

          {/* Unified High-Performance Audio Player with Volume Slider */}
          <div className="bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm space-y-4">
            
            {/* Native HTML5 Audio element providing robust hardware-accelerated playback */}
            {audioUrl && (
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  if (audioPlayerRef.current) {
                    const dur = audioPlayerRef.current.duration;
                    if (dur && isFinite(dur) && dur > 0) {
                      setFinalDuration(dur);
                    }
                  }
                }}
                preload="auto"
                className="hidden"
              />
            )}

            <div className="flex items-center justify-between text-[11px] font-black uppercase text-gray-700">
              <span className="flex items-center gap-1.5">
                <Headphones size={14} className="text-emerald-700" />
                Session Audio Playback
              </span>
              <div className="flex items-center gap-3">
                {audioUrl && (
                  <a
                    href={audioUrl}
                    download={`MeetingOS_Live_Capture_${Date.now()}.webm`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    <Download size={12} /> Download File
                  </a>
                )}
                <span className="font-mono text-gray-500">
                  {(capturedBlob.size / (1024 * 1024)).toFixed(2)} MB • {formatTime(activeDuration)}
                </span>
              </div>
            </div>

            {/* Playback Controls Row */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 bg-neo-yellow hover:bg-yellow-300 border-2 border-black rounded-xl flex items-center justify-center shadow-neo-xs shrink-0 cursor-pointer active:translate-y-0.5 transition-all"
                title={isPlaying ? 'Pause' : 'Play Audio'}
                aria-label={isPlaying ? 'Pause' : 'Play Audio'}
              >
                {isPlaying ? <Pause size={22} className="fill-black" /> : <Play size={22} className="fill-black ml-0.5" />}
              </button>

              {/* Progress Slider */}
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min="0"
                  max={activeDuration}
                  step="0.1"
                  value={playbackTime}
                  onChange={handleSeek}
                  className="w-full h-3 bg-gray-200 border-2 border-black rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-gray-600">
                  <span>{formatTime(playbackTime)}</span>
                  <span>{formatTime(activeDuration)}</span>
                </div>
              </div>

              {/* Volume Controls */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-2 border-2 border-black rounded-lg shadow-neo-xs cursor-pointer transition-colors ${isMuted ? 'bg-rose-100 text-rose-900' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : playbackVolume}
                  onChange={handlePlaybackVolumeChange}
                  className="w-16 sm:w-20 h-2 bg-gray-200 border border-black rounded-md appearance-none cursor-pointer accent-black"
                  title={`Volume: ${playbackVolume}%`}
                />
                <span className="font-mono text-[10px] font-bold text-gray-600 w-7 text-right">
                  {isMuted ? '0%' : `${playbackVolume}%`}
                </span>
              </div>
            </div>

          </div>

          <div className="p-3 bg-white border-2 border-black rounded-xl text-xs font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-600 shrink-0" />
            <span>Click <strong>"Run AI Grounding Pipeline"</strong> below to generate your verified workspace.</span>
          </div>

        </div>
      ) : (
        /* State 3: Ready to Start Capture */
        <div className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 border-2 border-black rounded-md font-black text-xs uppercase shadow-neo-xs">
                <Radio size={14} className="text-purple-700" /> Browser-Native Tab Capture
              </div>
              <h3 className="text-2xl font-black text-black tracking-tight">
                Record Google Meet, Zoom, or Teams
              </h3>
              <p className="text-xs font-semibold text-gray-700 max-w-lg leading-relaxed">
                Captures audio directly from your online meeting tab without inviting bots. Dual audio mixing records both the other meeting participants and your microphone while letting you hear the meeting in real-time through your speakers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleTestSpeakerSound}
                className="px-4 py-3 bg-white hover:bg-purple-100 border-2 border-black rounded-xl font-bold text-xs text-purple-900 shadow-neo-xs flex items-center gap-1.5 cursor-pointer"
                title="Test that your speakers are working"
              >
                <Bell size={14} /> Test Speakers
              </button>

              <button
                type="button"
                onClick={handleStartCapture}
                className="px-6 py-4 bg-neo-yellow hover:bg-yellow-300 border-3 border-black rounded-2xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
              >
                <Mic size={20} className="stroke-[2.5]" />
                Start Live Capture
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="pt-4 border-t-2 border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeMic}
                onChange={(e) => setIncludeMic(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-black accent-black cursor-pointer"
              />
              <span className="text-xs font-bold text-black">
                Include my microphone (Record both other participants + my own voice)
              </span>
            </label>

            <div className="text-[11px] font-bold text-gray-500 font-mono">
              Powered by Web Audio + Groq Whisper
            </div>
          </div>

          {/* Quick 3-Step Instruction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-gray-50 border-2 border-black rounded-xl space-y-1 shadow-neo-xs">
              <div className="text-xs font-black text-black flex items-center gap-1.5">
                <span className="w-5 h-5 bg-neo-yellow border border-black rounded-full flex items-center justify-center text-[10px]">1</span>
                <span>Click Start Live Capture</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                The browser will prompt you to choose which window or tab to share.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border-2 border-black rounded-xl space-y-1 shadow-neo-xs">
              <div className="text-xs font-black text-black flex items-center gap-1.5">
                <span className="w-5 h-5 bg-neo-yellow border border-black rounded-full flex items-center justify-center text-[10px]">2</span>
                <span>Select Meeting Tab</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Select your Google Meet tab and ensure <strong>"Share tab audio"</strong> is checked.
              </p>
            </div>

            <div className="p-3.5 bg-purple-50 border-2 border-black rounded-xl space-y-1 shadow-neo-xs">
              <div className="text-xs font-black text-black flex items-center gap-1.5">
                <span className="w-5 h-5 bg-neo-yellow border border-black rounded-full flex items-center justify-center text-[10px]">3</span>
                <span>Speak & Stop When Done</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Conduct your meeting normally. MeetingOS records in the background and plays tab audio through your speakers.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default LiveMeetingCaptureZone;
