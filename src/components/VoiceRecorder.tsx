import React, { useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square } from 'lucide-react';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstanceLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

interface VoiceRecorderProps {
  speechLang: string;
  onAppendTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  speechLang,
  onAppendTranscript,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [lastCaptured, setLastCaptured] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const onAppendRef = useRef(onAppendTranscript);
  onAppendRef.current = onAppendTranscript;

  const isSupported = getSpeechRecognitionCtor() !== null;

  useEffect(() => {
    if (!isRecording) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const formatElapsed = (total: number) => {
    const mins = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const secs = (total % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
    setInterimText('');
  };

  const startRecording = () => {
    if (disabled) return;
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setStatusNotice(
        'Web Speech dictation is unavailable in this browser. Type your solution notes directly below.'
      );
      return;
    }

    setStatusNotice(null);
    setElapsedSeconds(0);
    setInterimText('');

    const recognition = new Ctor();
    recognition.lang = speechLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res?.[0]?.transcript ?? '';
        if (res?.isFinal) {
          finalChunk += `${text} `;
        } else {
          interimChunk += text;
        }
      }

      setInterimText(interimChunk.trim());

      const cleanedFinal = finalChunk.trim();
      if (cleanedFinal) {
        setLastCaptured(cleanedFinal);
        onAppendRef.current(cleanedFinal);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setStatusNotice(
          'Microphone permission was declined. Enable microphone access or type your solution notes below.'
        );
      } else if (event.error !== 'no-speech') {
        setStatusNotice('Voice dictation paused. Resume anytime or continue typing.');
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setStatusNotice('Unable to start microphone capture. Continue typing below.');
      setIsRecording(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            Voice-to-Text Solution Recorder
          </p>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
            Dictate field measurements, root causes, and handover steps directly into your solution notes ({speechLang}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-xs font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B] px-2">
              {formatElapsed(elapsedSeconds)}
            </span>
          )}

          {!isRecording ? (
            <button
              type="button"
              disabled={disabled}
              onClick={startRecording}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Start Voice Dictation</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Dictation</span>
            </button>
          )}

          {lastCaptured && !isRecording && (
            <button
              type="button"
              onClick={() => setLastCaptured('')}
              aria-label="Clear last voice capture indicator"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isRecording && (
        <div
          aria-live="polite"
          className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-3.5 py-2.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
        >
          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">Live transcript: </span>
          <span>{interimText || 'Listening for speech… speak clearly into your microphone.'}</span>
        </div>
      )}

      {!isRecording && lastCaptured && (
        <p className="text-xs text-[#146C53] dark:text-[#2EB88B]">
          Appended to notes: “{lastCaptured}”
        </p>
      )}

      {!isSupported && !statusNotice && (
        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
          Speech recognition requires Chrome, Edge, or Safari; manual editing remains available offline.
        </p>
      )}

      {statusNotice && (
        <p role="status" className="text-xs text-[#9A5B13] dark:text-[#E5A95E]">
          {statusNotice}
        </p>
      )}
    </div>
  );
};
