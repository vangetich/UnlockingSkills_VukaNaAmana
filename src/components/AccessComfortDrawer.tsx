import React, { useEffect, useRef } from 'react';
import {
  BookOpen,
  Contrast,
  Eye,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Type,
  Volume2,
  X,
} from 'lucide-react';
import type {
  AccessComfortPreferences,
  AccessTextSize,
  ReadAloudController,
  ReadAloudRate,
} from '../utils/accessComfort';
import { hasCustomAccessComfort } from '../utils/accessComfort';

interface AccessComfortDrawerProps {
  isOpen: boolean;
  preferences: AccessComfortPreferences;
  readAloud: ReadAloudController;
  localeLabel: string;
  onUpdate: (next: AccessComfortPreferences) => void;
  onReset: () => void;
  onClose: () => void;
}

const TEXT_SIZE_OPTIONS: Array<{
  id: AccessTextSize;
  label: string;
  sublabel: string;
}> = [
  { id: 'default', label: 'Default', sublabel: '100%' },
  { id: 'large', label: 'Large', sublabel: '125%' },
  { id: 'xlarge', label: 'Extra Large', sublabel: '150%' },
];

const READ_ALOUD_RATES: Array<{ value: ReadAloudRate; label: string }> = [
  { value: 0.9, label: '0.9×' },
  { value: 1.0, label: '1.0×' },
  { value: 1.2, label: '1.2×' },
];

export const AccessComfortDrawer: React.FC<AccessComfortDrawerProps> = ({
  isOpen,
  preferences,
  readAloud,
  localeLabel,
  onUpdate,
  onReset,
  onClose,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 20);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCustomized = hasCustomAccessComfort(preferences);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-comfort-drawer-title"
      data-testid="access-comfort-drawer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/40 flex justify-end"
    >
      <div className="w-full max-w-md h-full bg-[#FAF8F5] dark:bg-[#141619] border-s border-[#E2DCD2] dark:border-[#2C3037] shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E2DCD2] dark:border-[#2C3037] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>WCAG 2.2 AA/AAA · W3C COGA</span>
            </div>
            <h2
              id="access-comfort-drawer-title"
              className="mt-1 font-display text-xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Access &amp; Comfort
            </h2>
            <p className="mt-0.5 text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
              Personalize text scale, contrast, calm focus, motion, and read-aloud. Saved on this device.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close Access & Comfort Settings"
            data-testid="access-comfort-close-btn"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[#E2DCD2] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body — Strictly 3 Calm Visual Groups */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* GROUP 1: Visual Clarity (Text Size + High-Contrast AAA) */}
          <section
            aria-labelledby="access-group-visual"
            className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E2DCD2] dark:border-[#2C3037] p-4 space-y-4"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#525866] dark:text-[#A3A7AE]">
              <Eye className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
              <h3 id="access-group-visual">1. Visual Clarity</h3>
            </div>

            {/* Control 1: Text Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  <Type className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />
                  <span>Text Size</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                  {preferences.textSize === 'large'
                    ? '125%'
                    : preferences.textSize === 'xlarge'
                      ? '150%'
                      : '100%'}
                </span>
              </div>
              <div
                role="group"
                aria-label="Text size scale"
                className="grid grid-cols-3 gap-2"
              >
                {TEXT_SIZE_OPTIONS.map((option) => {
                  const active = preferences.textSize === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      data-testid={`access-text-size-${option.id}`}
                      onClick={() => onUpdate({ ...preferences, textSize: option.id })}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                        active
                          ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E2DCD2] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
                      }`}
                    >
                      <span className="text-xs font-semibold leading-tight">{option.label}</span>
                      <span
                        className={`text-[10px] font-mono-tabular mt-0.5 ${
                          active
                            ? 'text-white/90 dark:text-[#121315]/85'
                            : 'text-[#525866] dark:text-[#A3A7AE]'
                        }`}
                      >
                        {option.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#ECE7DF] dark:border-[#2C3037]" />

            {/* Control 2: High-Contrast Mode (WCAG AAA 7:1+) */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  <Contrast className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <span>High-Contrast Mode (AAA)</span>
                </p>
                <p className="mt-1 text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
                  Boosts contrast to 7:1+, deepens ink and borders, and hides background line motifs.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.highContrast}
                aria-label="Toggle High-Contrast Mode (WCAG AAA 7:1+)"
                data-testid="access-toggle-high-contrast"
                onClick={() =>
                  onUpdate({ ...preferences, highContrast: !preferences.highContrast })
                }
                className={`min-h-[44px] min-w-[68px] px-3 rounded-xl border text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  preferences.highContrast
                    ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                    : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#D8D1C5] dark:border-[#343A44] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]'
                }`}
              >
                {preferences.highContrast ? 'On' : 'Off'}
              </button>
            </div>
          </section>

          {/* GROUP 2: Reading & Motion Comfort (Easy-Read COGA + Reduced Motion) */}
          <section
            aria-labelledby="access-group-reading"
            className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E2DCD2] dark:border-[#2C3037] p-4 space-y-4"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#525866] dark:text-[#A3A7AE]">
              <BookOpen className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
              <h3 id="access-group-reading">2. Reading &amp; Motion Comfort</h3>
            </div>

            {/* Control 3: Easy-Read / Calm Focus Mode (W3C COGA) */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  <BookOpen className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <span>Easy-Read / Calm Focus</span>
                </p>
                <p className="mt-1 text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
                  Opens line and letter spacing, switches headings to clean sans-serif, and removes decorative elements.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.easyRead}
                aria-label="Toggle Easy-Read Calm Focus Mode"
                data-testid="access-toggle-easy-read"
                onClick={() => onUpdate({ ...preferences, easyRead: !preferences.easyRead })}
                className={`min-h-[44px] min-w-[68px] px-3 rounded-xl border text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  preferences.easyRead
                    ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                    : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#D8D1C5] dark:border-[#343A44] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]'
                }`}
              >
                {preferences.easyRead ? 'On' : 'Off'}
              </button>
            </div>

            <div className="border-t border-[#ECE7DF] dark:border-[#2C3037]" />

            {/* Control 4: Reduced Motion */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  <Sparkles className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0" />
                  <span>Reduced Motion</span>
                </p>
                <p className="mt-1 text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
                  Turns off transitions, animations, and background sway across every view.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={preferences.reducedMotion}
                aria-label="Toggle Reduced Motion"
                data-testid="access-toggle-reduced-motion"
                onClick={() =>
                  onUpdate({ ...preferences, reducedMotion: !preferences.reducedMotion })
                }
                className={`min-h-[44px] min-w-[68px] px-3 rounded-xl border text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  preferences.reducedMotion
                    ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                    : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#D8D1C5] dark:border-[#343A44] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]'
                }`}
              >
                {preferences.reducedMotion ? 'On' : 'Off'}
              </button>
            </div>
          </section>

          {/* GROUP 3: Listen to Screen (Web Speech API Read-Aloud) */}
          <section
            aria-labelledby="access-group-audio"
            className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E2DCD2] dark:border-[#2C3037] p-4 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#525866] dark:text-[#A3A7AE]">
                <Volume2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                <h3 id="access-group-audio">3. Listen to Screen</h3>
              </div>
              <span className="text-[11px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                {localeLabel}
              </span>
            </div>

            <p className="text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
              Reads the active page headings and guidance aloud using your browser&apos;s built-in voice.
            </p>

            {readAloud.isSupported ? (
              <div className="space-y-3">
                {/* Control 5: Listen / Pause / Stop mini-bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {readAloud.status === 'idle' ? (
                    <button
                      type="button"
                      onClick={readAloud.speak}
                      data-testid="access-read-aloud-play"
                      className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B74] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Play className="w-4 h-4 shrink-0" />
                      <span>Listen to Screen</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={readAloud.status === 'speaking' ? readAloud.pause : readAloud.resume}
                        data-testid="access-read-aloud-toggle"
                        className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        {readAloud.status === 'speaking' ? (
                          <>
                            <Pause className="w-4 h-4 shrink-0" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 shrink-0" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={readAloud.stop}
                        data-testid="access-read-aloud-stop"
                        className="min-h-[44px] px-3.5 rounded-xl border border-[#C4622D]/45 dark:border-[#E07B46]/50 bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#9A4315] dark:text-[#F59E6C] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 shrink-0" />
                        <span>Stop</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Speed Control */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-medium text-[#525866] dark:text-[#A3A7AE]">
                    Reading Speed
                  </span>
                  <div role="group" aria-label="Read-aloud speed" className="inline-flex gap-1.5">
                    {READ_ALOUD_RATES.map((rateOpt) => {
                      const active = preferences.readAloudRate === rateOpt.value;
                      return (
                        <button
                          key={rateOpt.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            onUpdate({ ...preferences, readAloudRate: rateOpt.value })
                          }
                          className={`min-h-[36px] min-w-[44px] px-2.5 rounded-lg border text-xs font-mono-tabular font-semibold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E2DCD2] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]'
                          }`}
                        >
                          {rateOpt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {readAloud.status !== 'idle' && readAloud.activeHeading && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-[#146C53]/25 dark:border-[#2EB88B]/30 bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      <strong className="text-[#146C53] dark:text-[#2EB88B]">
                        {readAloud.status === 'speaking' ? 'Reading:' : 'Paused:'}
                      </strong>{' '}
                      {readAloud.activeHeading}
                    </span>
                    {readAloud.progressLabel && (
                      <span className="font-mono-tabular text-[11px] text-[#525866] dark:text-[#A3A7AE] shrink-0">
                        {readAloud.progressLabel}
                      </span>
                    )}
                  </div>
                )}

                {readAloud.errorMessage && (
                  <p role="alert" className="text-xs text-[#9A4315] dark:text-[#F59E6C]">
                    {readAloud.errorMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E2DCD2] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2.5 text-xs text-[#525866] dark:text-[#A3A7AE]">
                Built-in screen read-aloud is unavailable in this browser. Your device&apos;s native screen reader remains fully supported via WCAG 2.2 landmarks.
              </div>
            )}
          </section>
        </div>

        {/* Footer — Control 6: Reset to Default */}
        <div className="px-5 py-4 bg-white dark:bg-[#1A1C20] border-t border-[#E2DCD2] dark:border-[#2C3037] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            disabled={!isCustomized && readAloud.status === 'idle'}
            data-testid="access-reset-default-btn"
            className="min-h-[44px] px-4 rounded-xl border border-[#D8D1C5] dark:border-[#343A44] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B74] text-white dark:text-[#121315] text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReadAloudMiniBarProps {
  readAloud: ReadAloudController;
  onOpenSettings: () => void;
}

/**
 * Quiet in-flow strip rendered at the top of the page ONLY while Read-Aloud is active
 * (speaking or paused), so mobile content is never obscured by a floating widget.
 */
export const ReadAloudMiniBar: React.FC<ReadAloudMiniBarProps> = ({
  readAloud,
  onOpenSettings,
}) => {
  if (readAloud.status === 'idle') return null;

  return (
    <div
      role="region"
      aria-label="Read-aloud playback controls"
      data-testid="read-aloud-mini-bar"
      className="w-full border-b border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE] dark:bg-[#142B24] text-[#17191C] dark:text-[#F4F2EE]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Volume2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
          <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
            {readAloud.status === 'speaking' ? 'Reading Aloud' : 'Read-Aloud Paused'}
          </span>
          {readAloud.activeHeading && (
            <span className="truncate text-[#43484E] dark:text-[#D5D9DF]">
              · {readAloud.activeHeading}
            </span>
          )}
          {readAloud.progressLabel && (
            <span className="font-mono-tabular text-[11px] text-[#525866] dark:text-[#A3A7AE] shrink-0">
              ({readAloud.progressLabel})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={readAloud.status === 'speaking' ? readAloud.pause : readAloud.resume}
            className="min-h-[36px] px-3 rounded-lg bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {readAloud.status === 'speaking' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={readAloud.stop}
            className="min-h-[36px] px-3 rounded-lg border border-[#C4622D]/40 bg-white dark:bg-[#1A1C20] text-[#9A4315] dark:text-[#F59E6C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Square className="w-3 h-3" />
            <span>Stop</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Access & Comfort Settings"
            className="min-h-[36px] px-2.5 rounded-lg border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] text-xs font-medium cursor-pointer"
          >
            Access
          </button>
        </div>
      </div>
    </div>
  );
};
