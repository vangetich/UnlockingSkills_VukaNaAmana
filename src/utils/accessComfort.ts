import { useCallback, useEffect, useRef, useState } from 'react';

export type AccessTextSize = 'default' | 'large' | 'xlarge';
export type ReadAloudRate = 0.9 | 1.0 | 1.2;
export type ReadAloudStatus = 'idle' | 'speaking' | 'paused';

export interface AccessComfortPreferences {
  textSize: AccessTextSize;
  highContrast: boolean;
  easyRead: boolean;
  reducedMotion: boolean;
  readAloudRate: ReadAloudRate;
}

export const ACCESS_COMFORT_STORAGE_KEY = 'vuka.accessComfort.v1';

export function detectOsReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function getDefaultAccessComfortPreferences(): AccessComfortPreferences {
  return {
    textSize: 'default',
    highContrast: false,
    easyRead: false,
    reducedMotion: detectOsReducedMotion(),
    readAloudRate: 1.0,
  };
}

export function loadAccessComfortPreferences(): AccessComfortPreferences {
  const defaults = getDefaultAccessComfortPreferences();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(ACCESS_COMFORT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AccessComfortPreferences>;
    const textSize: AccessTextSize =
      parsed.textSize === 'large' || parsed.textSize === 'xlarge' ? parsed.textSize : 'default';
    const readAloudRate: ReadAloudRate =
      parsed.readAloudRate === 0.9 || parsed.readAloudRate === 1.2 ? parsed.readAloudRate : 1.0;
    return {
      textSize,
      highContrast: Boolean(parsed.highContrast),
      easyRead: Boolean(parsed.easyRead),
      reducedMotion:
        typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : defaults.reducedMotion,
      readAloudRate,
    };
  } catch {
    return defaults;
  }
}

export function saveAccessComfortPreferences(prefs: AccessComfortPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACCESS_COMFORT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

export function hasCustomAccessComfort(prefs: AccessComfortPreferences): boolean {
  return (
    prefs.textSize !== 'default' ||
    prefs.highContrast ||
    prefs.easyRead ||
    prefs.reducedMotion ||
    prefs.readAloudRate !== 1.0
  );
}

export function applyAccessComfortToDocument(prefs: AccessComfortPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-text-scale', prefs.textSize);
  root.classList.toggle('vuka-high-contrast', prefs.highContrast);
  root.classList.toggle('vuka-easy-read', prefs.easyRead);
  root.classList.toggle('vuka-reduced-motion', prefs.reducedMotion);
}

/**
 * Extracts clean headings and key guidance blocks from #main-content
 * while skipping hidden, decorative, and purely iconographic nodes.
 */
function extractReadableScreenSegments(): Array<{ heading: string; text: string }> {
  if (typeof document === 'undefined') return [];
  const main =
    document.getElementById('main-content') ??
    document.querySelector('main') ??
    document.body;
  if (!main) return [];

  const nodes = Array.from(
    main.querySelectorAll('h1, h2, h3, [data-read-aloud="true"], p, li')
  );

  const segments: Array<{ heading: string; text: string }> = [];
  let currentHeading = 'Vuka na Amana';
  const seen = new Set<string>();

  for (const node of nodes) {
    const el = node as HTMLElement;
    if (el.closest('[aria-hidden="true"], [data-decorative="true"], script, style, svg, nav')) {
      continue;
    }
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') {
      continue;
    }

    const rawText = (el.innerText || el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!rawText || rawText.length < 4) continue;
    if (seen.has(rawText)) continue;
    seen.add(rawText);

    const tag = el.tagName.toLowerCase();
    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      currentHeading = rawText;
    }

    // Keep each spoken chunk concise so speechSynthesis never stalls on long paragraphs
    const sentences = rawText.match(/[^.!?]+[.!?]*/g) ?? [rawText];
    for (const sentence of sentences) {
      const cleaned = sentence.trim();
      if (cleaned.length >= 4) {
        segments.push({ heading: currentHeading, text: cleaned });
      }
    }

    if (segments.length >= 42) break;
  }

  return segments;
}

export interface ReadAloudController {
  isSupported: boolean;
  status: ReadAloudStatus;
  activeHeading: string;
  progressLabel: string;
  errorMessage: string | null;
  speak: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useReadAloud(
  speechLang: string,
  rate: ReadAloudRate
): ReadAloudController {
  const isSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  const [status, setStatus] = useState<ReadAloudStatus>('idle');
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [segmentIndex, setSegmentIndex] = useState<number>(0);
  const [totalSegments, setTotalSegments] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const segmentsRef = useRef<Array<{ heading: string; text: string }>>([]);
  const cancelledRef = useRef<boolean>(false);
  const rateRef = useRef<ReadAloudRate>(rate);
  const langRef = useRef<string>(speechLang);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    langRef.current = speechLang;
  }, [speechLang]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }
    }
    segmentsRef.current = [];
    setStatus('idle');
    setActiveHeading('');
    setSegmentIndex(0);
    setTotalSegments(0);
  }, [isSupported]);

  const speakSegmentAt = useCallback(
    (idx: number) => {
      if (!isSupported || cancelledRef.current) return;
      const list = segmentsRef.current;
      if (idx >= list.length) {
        setStatus('idle');
        setActiveHeading('');
        setSegmentIndex(0);
        setTotalSegments(0);
        return;
      }

      const item = list[idx];
      setSegmentIndex(idx + 1);
      setActiveHeading(item.heading);

      try {
        const utterance = new window.SpeechSynthesisUtterance(item.text);
        utterance.lang = langRef.current || 'en-US';
        utterance.rate = rateRef.current;
        utterance.pitch = 1.0;

        utterance.onend = () => {
          if (!cancelledRef.current) {
            speakSegmentAt(idx + 1);
          }
        };
        utterance.onerror = (event) => {
          if (cancelledRef.current || event.error === 'interrupted' || event.error === 'canceled') {
            return;
          }
          setErrorMessage('Read-aloud paused because this browser voice was interrupted.');
          setStatus('idle');
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        setErrorMessage('Read-aloud is unavailable in this browser session.');
        setStatus('idle');
      }
    },
    [isSupported]
  );

  const speak = useCallback(() => {
    if (!isSupported) {
      setErrorMessage('Read-aloud is not supported in this browser.');
      return;
    }
    setErrorMessage(null);
    cancelledRef.current = false;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }

    const segments = extractReadableScreenSegments();
    if (segments.length === 0) {
      setErrorMessage('No readable headings or text found on this view.');
      return;
    }

    segmentsRef.current = segments;
    setTotalSegments(segments.length);
    setStatus('speaking');
    speakSegmentAt(0);
  }, [isSupported, speakSegmentAt]);

  const pause = useCallback(() => {
    if (!isSupported || status !== 'speaking') return;
    try {
      window.speechSynthesis.pause();
      setStatus('paused');
    } catch {
      stop();
    }
  }, [isSupported, status, stop]);

  const resume = useCallback(() => {
    if (!isSupported || status !== 'paused') return;
    try {
      window.speechSynthesis.resume();
      setStatus('speaking');
    } catch {
      speak();
    }
  }, [isSupported, status, speak]);

  // Cancel cleanly on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [isSupported]);

  const progressLabel =
    totalSegments > 0 ? `${segmentIndex} / ${totalSegments}` : '';

  return {
    isSupported,
    status,
    activeHeading,
    progressLabel,
    errorMessage,
    speak,
    pause,
    resume,
    stop,
  };
}
