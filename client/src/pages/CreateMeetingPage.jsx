import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createMeeting, createMeetingFromUpload, processMeeting } from '../services/meetingApi.js';
import { FileUploadZone } from '../components/meetings/FileUploadZone.jsx';
import { LiveMeetingCaptureZone } from '../components/meetings/LiveMeetingCaptureZone.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { getErrorMessage } from '../utils/errorUtils.js';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  Mic
} from 'lucide-react';

const SAMPLE_NOTES_1 = `Sprint 42 Architecture & Planning Sync
Date: October 14, 2026
Attendees: Sarah Connor (Engineering Lead), Alex Vance (Fullstack Dev), Marcus Reed (Product Manager), Elena Rostova (DevOps)

Discussion:
1. Backend Migration & Database Schema:
Sarah announced that we are officially migrating the primary relational store to PostgreSQL with strict normalized schemas. Alex agreed to handle the database migration scripts and index optimization by Friday Oct 24th. However, Alex noted that the API routes must be updated before the frontend release can proceed.

2. Qualcomm Cloud AI Integration:
Marcus requested that we integrate the Qualcomm Cloud AI API endpoints for real-time meeting transcription and reasoning. Sarah will lead the Qualcomm API SDK wrapper implementation by Oct 28th. Marcus emphasized that evidence-first grounding is non-negotiable: if an owner is not mentioned, mark it as [UNASSIGNED].

3. Decisions Reached:
- Decision: Adopt PostgreSQL over NoSQL for full ACID guarantees and complex dependency querying. (Decided by: Sarah Connor, Impact: Backend, Database).
- Decision: Enforce 2-pass evidence verification for all AI-generated action items. (Decided by: Marcus Reed & Sarah Connor, Impact: AI Engine, Frontend).

4. Open Questions:
- Question: Do we have sufficient Cirrascale API rate limits for concurrent batch processing? Asked by Elena Rostova, assigned to Marcus Reed.
- Question: Will the client support offline caching for transcripts? Asked by Alex Vance.

5. Immediate Next Steps:
- Elena will configure the production staging environment by Oct 22nd.
- Review security compliance documentation. (No owner assigned).`;

const SAMPLE_NOTES_2 = `Product Launch & Go-To-Market Strategy
Date: November 2, 2026
Attendees: Marcus Reed (PM), Chloe Price (Marketing Lead), David Miller (Sales Director)

Notes:
We reviewed the Q4 release roadmap for MeetingOS. Chloe confirmed that the marketing landing page and video demo will be finished by Nov 15th. David asked whether enterprise SSO (SAML/Okta) will be ready for launch. Marcus confirmed that SSO is deferred to Q1 2027.

Decisions:
- Decision: Launch public beta on November 20th, 2026. (Decided by: Team Consensus, Impact: Marketing, Sales).
- Decision: Defer enterprise SSO to Q1 2027 to focus on zero-hallucination accuracy. (Decided by: Marcus Reed, Impact: Engineering, Security).

Action Items:
- Chloe will draft the press release and social media announcements by Nov 12th.
- David will schedule introductory calls with initial pilot customers by Nov 18th.
- Prepare pricing comparison tier breakdown. (Due by Nov 10th, owner not specified).

Questions:
- Will we support automated PDF export reports for executive stakeholders? (Asked by David Miller, assigned to Marcus).`;

export const CreateMeetingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'capture' ? 'capture' : (searchParams.get('mode') === 'file' ? 'file' : 'text');

  const [inputMode, setInputMode] = useState(initialMode); // 'text' | 'file' | 'capture'
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendeesInput, setAttendeesInput] = useState('');
  const [originalNotes, setOriginalNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [capturedAudioBlob, setCapturedAudioBlob] = useState(null);
  const [isLiveRecording, setIsLiveRecording] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'capture' || urlMode === 'file' || urlMode === 'text') {
      setInputMode(urlMode);
    }
  }, [searchParams]);

  const pipelineSteps = [
    'Transcribing audio & normalizing text with Groq Whisper...',
    'Invoking Qualcomm Cloud AI structured reasoning (Llama-3.1-8B)...',
    'Verifying character offsets & checking hallucinations...',
    'Constructing task dependency DAG network...',
    'Finalizing grounded meeting workspace!'
  ];

  const handleLoadSample = (sampleNum) => {
    if (sampleNum === 1) {
      setTitle('Sprint 42 Architecture & Planning Sync');
      setAttendeesInput('Sarah Connor, Alex Vance, Marcus Reed, Elena Rostova');
      setOriginalNotes(SAMPLE_NOTES_1);
      setInputMode('text');
    } else {
      setTitle('Product Launch & Go-To-Market Strategy');
      setAttendeesInput('Marcus Reed, Chloe Price, David Miller');
      setOriginalNotes(SAMPLE_NOTES_2);
      setInputMode('text');
    }
  };

  const autoSetDefaultTitle = () => {
    if (!title.trim()) {
      const now = new Date();
      setTitle(`Live Meeting Session - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLiveRecording) {
      setError('Live recording is still active. Please click "Stop Capture" before running the AI pipeline.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a meeting title.');
      return;
    }

    if (inputMode === 'text' && !originalNotes.trim()) {
      setError('Please paste meeting notes or raw transcript.');
      return;
    }

    if (inputMode === 'file' && !uploadedFile) {
      setError('Please select a file (.mp3, .wav, .m4a, .pdf, .docx, .txt) to upload.');
      return;
    }

    if (inputMode === 'capture' && !capturedAudioBlob) {
      setError('No live meeting audio recorded yet. Please click "Start Live Capture" to record your meeting.');
      return;
    }

    const attendeesList = attendeesInput
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    setCurrentStep(0);

    // Step progression animation ticker
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < pipelineSteps.length - 2 ? prev + 1 : prev));
    }, 1100);

    try {
      let createdMeeting = null;

      if (inputMode === 'text') {
        const res = await createMeeting({
          title: title.trim(),
          notes: originalNotes.trim(),
          original_notes: originalNotes.trim(),
          meetingDate: meetingDate,
          meeting_date: meetingDate,
          attendees: attendeesList
        });
        createdMeeting = res?.data?.data?.meeting || res?.data?.meeting || res?.data?.data;
      } else if (inputMode === 'file') {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('meetingDate', meetingDate);
        formData.append('meeting_date', meetingDate);
        formData.append('attendees', JSON.stringify(attendeesList));
        formData.append('file', uploadedFile);

        const res = await createMeetingFromUpload(formData);
        createdMeeting = res?.data?.data?.meeting || res?.data?.meeting || res?.data?.data;
      } else if (inputMode === 'capture') {
        const recordedFile = new File(
          [capturedAudioBlob],
          `Live_Meeting_Capture_${Date.now()}.webm`,
          { type: capturedAudioBlob.type || 'audio/webm' }
        );

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('meetingDate', meetingDate);
        formData.append('meeting_date', meetingDate);
        formData.append('attendees', JSON.stringify(attendeesList));
        formData.append('file', recordedFile);

        const res = await createMeetingFromUpload(formData);
        createdMeeting = res?.data?.data?.meeting || res?.data?.meeting || res?.data?.data;
      }

      setCurrentStep(pipelineSteps.length - 1);
      clearInterval(interval);

      // Short delay to show completion state before navigating
      setTimeout(() => {
        if (createdMeeting?.id) {
          navigate(`/meetings/${createdMeeting.id}`);
        } else {
          navigate('/dashboard');
        }
      }, 700);

    } catch (err) {
      clearInterval(interval);
      setIsSubmitting(false);
      setError(getErrorMessage(err, 'Failed to process meeting. Please check the backend connection.'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neo-yellow border-2 border-black rounded-md font-black text-xs uppercase shadow-neo-xs">
          <Zap size={14} /> AI Processing Pipeline
        </div>
        <h1 className="text-3xl font-black text-black tracking-tight">
          Ingest & Ground Meeting Notes
        </h1>
        <p className="text-xs font-bold text-gray-600">
          Upload messy notes or transcripts. MeetingOS extracts structured intelligence with exact verbatim proof.
        </p>
      </div>

      {/* Quick Demo Samples Bar */}
      <div className="bg-amber-50 border-2 border-black rounded-xl p-4 shadow-neo-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-700 shrink-0" />
          <span className="text-xs font-black text-black">Try Quick Sample Data for Hackathon:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample(1)}
            className="px-3 py-1 bg-white hover:bg-neo-yellow border-2 border-black rounded-lg text-xs font-black shadow-neo-xs cursor-pointer active:translate-y-0.5"
          >
            Load Sample 1 (Engineering Sync)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample(2)}
            className="px-3 py-1 bg-white hover:bg-neo-yellow border-2 border-black rounded-lg text-xs font-black shadow-neo-xs cursor-pointer active:translate-y-0.5"
          >
            Load Sample 2 (Product Strategy)
          </button>
        </div>
      </div>

      {/* Processing Animation Modal / Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-neo-cream border-3 border-black shadow-neo-lg rounded-2xl p-8 space-y-6 animate-scaleUp text-center">
            
            <div className="w-16 h-16 bg-neo-yellow border-3 border-black rounded-2xl mx-auto flex items-center justify-center shadow-neo">
              <Spinner size="lg" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-black tracking-tight">
                Processing Meeting Intelligence
              </h3>
              <p className="text-xs font-bold text-gray-700">
                Grounding extraction with Qualcomm Cloud AI & verifying character offsets
              </p>
            </div>

            {/* Step Progression List */}
            <div className="space-y-2.5 text-left bg-white border-2 border-black rounded-xl p-4 shadow-neo-sm font-bold text-xs">
              {pipelineSteps.map((stepText, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-amber-100 text-black border border-black'
                        : isCompleted
                        ? 'text-emerald-800'
                        : 'text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <Spinner size="sm" className="shrink-0" />
                    ) : (
                      <Clock size={16} className="text-gray-300 shrink-0" />
                    )}
                    <span className={isCurrent ? 'font-black' : 'font-medium'}>
                      {stepText}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] font-bold text-gray-500">
              Evidence &gt; Confidence Guarantee active
            </div>
          </div>
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white border-3 border-black rounded-2xl p-6 sm:p-8 shadow-neo space-y-6">
        
        {error && (
          <div className="p-4 bg-rose-50 border-2 border-rose-600 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <span>{typeof error === 'string' ? error : (error?.message || 'Error creating meeting')}</span>
          </div>
        )}

        {/* Basic Metadata Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
              <FileText size={14} /> Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Architecture & Review"
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} /> Meeting Date
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 flex items-center gap-1.5">
            <Users size={14} /> Attendees (Comma separated)
          </label>
          <input
            type="text"
            value={attendeesInput}
            onChange={(e) => setAttendeesInput(e.target.value)}
            placeholder="e.g. Sarah Connor, Alex Vance, Marcus Reed"
            className="w-full px-4 py-2.5 bg-gray-50 border-2 border-black rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs"
          />
        </div>

        {/* Input Mode Selector */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-gray-100 border-2 border-black rounded-xl max-w-xl">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === 'text'
                  ? 'bg-neo-yellow border-2 border-black text-black shadow-neo-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FileText size={14} /> Paste Notes / Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === 'file'
                  ? 'bg-neo-yellow border-2 border-black text-black shadow-neo-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Upload size={14} /> Upload File (.MP3, .PDF)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('capture')}
              className={`flex-1 min-w-[140px] py-2 px-3 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === 'capture'
                  ? 'bg-purple-300 border-2 border-black text-black shadow-neo-xs'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <Radio size={14} className={isLiveRecording ? 'animate-pulse text-rose-600' : 'text-purple-700'} />
              <span>Live Meeting Capture</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </button>
          </div>

          {/* Conditional Note Area */}
          {inputMode === 'text' ? (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Meeting Transcript or Raw Notes *
              </label>
              <textarea
                required
                rows={10}
                value={originalNotes}
                onChange={(e) => setOriginalNotes(e.target.value)}
                placeholder="Paste verbatim transcript, raw meeting notes, speaker dialogues, or bullet points here..."
                className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-neo-xs leading-relaxed"
              />
            </div>
          ) : inputMode === 'file' ? (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Upload Meeting Recording (.MP3, .WAV, .M4A, .WEBM) or Document (.PDF, .DOCX, .TXT) *
              </label>
              <FileUploadZone
                selectedFile={uploadedFile}
                onFileSelect={(file) => setUploadedFile(file)}
                onClearFile={() => setUploadedFile(null)}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-black mb-1.5">
                Live Google Meet / Zoom Browser Capture (Tab Audio + Microphone) *
              </label>
              <LiveMeetingCaptureZone
                onAudioCaptured={(blob) => setCapturedAudioBlob(blob)}
                capturedBlob={capturedAudioBlob}
                onClear={() => setCapturedAudioBlob(null)}
                isRecording={isLiveRecording}
                onStartRecording={() => setIsLiveRecording(true)}
                onStopRecording={() => setIsLiveRecording(false)}
                autoSetTitle={autoSetDefaultTitle}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t-2 border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>2-Pass Evidence Verification Enabled</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3.5 bg-neo-yellow hover:bg-yellow-300 disabled:opacity-50 border-2 border-black rounded-xl font-black text-sm text-black shadow-neo hover:shadow-neo-lg transition-all flex items-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <Sparkles size={18} />
            Run AI Grounding Pipeline
            <ArrowRight size={16} />
          </button>
        </div>

      </form>

    </div>
  );
};

export default CreateMeetingPage;
