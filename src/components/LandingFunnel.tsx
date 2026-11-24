import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Globe,
  Mic,
  Moon,
  Square,
  Sun,
  WifiOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AgeStage, LocaleCode, ThemeMode } from '../types/kora';
import {
  LOCALE_OPTIONS,
  getStageLabel,
  type TranslationDictionary,
} from '../utils/i18n';
import { AGE_STAGE_PATHWAYS } from '../utils/talentEngine';
import { useSpeechInput } from '../hooks/useSpeechInput';
import {
  RippleConstellationMotif,
  TopographicAscentMotif,
  WovenBridgeArcsMotif,
} from './ResilienceMotifs';

interface FunnelSectionArrowProps {
  position: 'top' | 'middle' | 'bottom';
  upTargetId: string;
  upLabel: string;
  downTargetId: string;
  downLabel: string;
  stepTag: string;
}

const FunnelSectionArrow: React.FC<FunnelSectionArrowProps> = ({
  position,
  upTargetId,
  upLabel,
  downTargetId,
  downLabel,
  stepTag,
}) => {
  const isMiddle = position === 'middle';
  const [flowDirection, setFlowDirection] = useState<'down' | 'up'>(
    position === 'bottom' ? 'up' : 'down'
  );

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleDirection = () => {
    const nextDir = flowDirection === 'down' ? 'up' : 'down';
    setFlowDirection(nextDir);
    scrollToSection(nextDir === 'up' ? upTargetId : downTargetId);
  };

  return (
    <div
      data-testid={`landing-arrow-${position}`}
      className="relative z-10 mt-10 sm:mt-14 flex flex-col items-center"
    >
      <motion.span
        aria-hidden="true"
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className={`w-px h-6 sm:h-8 ${
          isMiddle
            ? 'bg-gradient-to-b from-transparent to-[#C4622D]/60 dark:to-[#E07B46]/60'
            : 'bg-gradient-to-b from-transparent to-[#146C53]/60 dark:to-[#2EB88B]/60'
        }`}
      />
      <div
        role="group"
        aria-label={`Section ${stepTag} bidirectional vertical navigation`}
        className={`inline-flex items-stretch rounded-full border bg-white/95 dark:bg-[#1A1C20]/95 backdrop-blur-xs shadow-xs overflow-hidden max-w-full ${
          isMiddle
            ? 'border-[#C4622D]/30 dark:border-[#E07B46]/35'
            : 'border-[#146C53]/30 dark:border-[#2EB88B]/35'
        }`}
      >
        {/* Left Side: Upward Movement */}
        <button
          type="button"
          onClick={() => {
            setFlowDirection('up');
            scrollToSection(upTargetId);
          }}
          aria-label={upLabel}
          data-testid={`landing-arrow-up-${position}`}
          className={`group min-h-[42px] pl-2.5 pr-3 sm:pl-3 sm:pr-4 py-1.5 inline-flex items-center gap-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#146C53] ${
            flowDirection === 'up'
              ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 text-[#146C53] dark:text-[#2EB88B]'
              : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#23262B]'
          }`}
        >
          <motion.span
            animate={flowDirection === 'up' ? { y: [0, -2.5, 0] } : { y: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:-translate-y-0.5 ${
              isMiddle
                ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46]'
                : 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </motion.span>
          <span className="hidden sm:inline whitespace-nowrap">{upLabel}</span>
          <span className="sm:hidden whitespace-nowrap">Up</span>
        </button>

        {/* Interactive Center Toggleable Up/Down Bidirectional Crossing Control */}
        <button
          type="button"
          onClick={handleToggleDirection}
          data-testid={`landing-arrow-toggle-${position}`}
          aria-pressed={flowDirection === 'up'}
          aria-label={`Toggle Up/Down crossing flow for section ${stepTag} (current: ${flowDirection.toUpperCase()})`}
          title="Toggle Up/Down Bidirectional Crossing Flow"
          className="px-2.5 sm:px-3.5 border-x border-[#E8E3DB] dark:border-[#2C3037] inline-flex items-center gap-1.5 bg-[#FAF8F5]/85 dark:bg-[#121315]/75 hover:bg-[#E7F3EE]/50 dark:hover:bg-[#142B24]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#146C53]"
        >
          <motion.span
            key={flowDirection}
            initial={{ rotate: flowDirection === 'up' ? 180 : 0, scale: 0.85 }}
            animate={{
              rotate: flowDirection === 'up' ? 180 : 0,
              scale: 1,
              y: flowDirection === 'down' ? [0, 1.5, 0] : [0, -1.5, 0],
            }}
            transition={{
              rotate: { type: 'spring', stiffness: 260, damping: 20 },
              y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isMiddle
                ? 'bg-[#C4622D]/15 text-[#C4622D] dark:text-[#E07B46]'
                : 'bg-[#146C53]/15 text-[#146C53] dark:text-[#2EB88B]'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
          </motion.span>
          <span
            className={`font-mono-tabular text-[11px] font-semibold ${
              isMiddle
                ? 'text-[#C4622D] dark:text-[#E07B46]'
                : 'text-[#146C53] dark:text-[#2EB88B]'
            }`}
          >
            {stepTag}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]">
            {flowDirection === 'down' ? 'Up/Down · ↓' : 'Up/Down · ↑'}
          </span>
        </button>

        {/* Right Side: Downward Movement */}
        <button
          type="button"
          onClick={() => {
            setFlowDirection('down');
            scrollToSection(downTargetId);
          }}
          aria-label={downLabel}
          data-testid={`landing-arrow-down-${position}`}
          className={`group min-h-[42px] pl-3 pr-2.5 sm:pl-4 sm:pr-3 py-1.5 inline-flex items-center gap-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#146C53] ${
            flowDirection === 'down'
              ? 'bg-[#F9ECE5]/60 dark:bg-[#2D1E17]/60 text-[#17191C] dark:text-[#F4F2EE]'
              : 'text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#23262B]'
          }`}
        >
          <span className="whitespace-nowrap truncate max-w-[160px] sm:max-w-none">{downLabel}</span>
          <motion.span
            animate={flowDirection === 'down' ? { y: [0, 2.5, 0] } : { y: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-y-0.5 ${
              isMiddle
                ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46]'
                : 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </motion.span>
        </button>
      </div>
    </div>
  );
};

interface LandingFunnelProps {
  initialProblem: string;
  initialStage: AgeStage;
  locale: LocaleCode;
  speechLang: string;
  theme: ThemeMode;
  isOnline: boolean;
  onChangeLocale: (locale: LocaleCode) => void;
  onToggleTheme: () => void;
  onBeginCrossing: (payload: { problemStatement: string; ageStage: AgeStage }) => void;
  onOpenHiringPartners: (payload: { problemStatement: string; ageStage: AgeStage }) => void;
  onEnterStudio: (payload: { problemStatement: string; ageStage: AgeStage }) => void;
  onPreviewCleared?: (payload: { problemStatement: string; ageStage: AgeStage }) => void;
  onOpenScaleDrawer: () => void;
  t: TranslationDictionary;
}

const AGE_STAGES: AgeStage[] = ['15-17', '18-29', '30-45', '46+'];

export const LandingFunnel: React.FC<LandingFunnelProps> = ({
  initialProblem,
  initialStage,
  locale,
  speechLang,
  theme,
  isOnline,
  onChangeLocale,
  onToggleTheme,
  onBeginCrossing,
  onOpenHiringPartners,
  onEnterStudio,
  onPreviewCleared,
  onOpenScaleDrawer,
  t,
}) => {
  const [selectedStage, setSelectedStage] = useState<AgeStage>(initialStage);
  const [problemStatement, setProblemStatement] = useState<string>(initialProblem);

  const { isListening, unsupportedMessage, toggleListening } = useSpeechInput(
    speechLang,
    (spoken) => {
      setProblemStatement((prev) => (prev.trim() ? `${prev.trim()} ${spoken}` : spoken));
    }
  );

  const activePathway = AGE_STAGE_PATHWAYS[selectedStage];
  const activeStageMeta = getStageLabel(selectedStage, t);

  const currentPayload = {
    problemStatement: problemStatement.trim(),
    ageStage: selectedStage,
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBeginCrossing(currentPayload);
  };

  const pillars = [
    {
      index: '01',
      sdg: t.pillar1Sdg,
      title: t.pillar1Title,
      body: t.pillar1Body,
    },
    {
      index: '02',
      sdg: t.pillar2Sdg,
      title: t.pillar2Title,
      body: t.pillar2Body,
    },
    {
      index: '03',
      sdg: t.pillar3Sdg,
      title: t.pillar3Title,
      body: t.pillar3Body,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] flex flex-col">
      {/* BEAT 1: Minimal Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/92 dark:bg-[#121315]/92 backdrop-blur-md border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-6xl mx-auto h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-6">
          {/* Brand Wordmark + Official Bridge Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Vuka na Amana — Crossing Over"
            data-testid="landing-brand-home-btn"
            className="flex items-center gap-2 sm:gap-3 min-w-0 shrink text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md py-1"
          >
            <img
              src="/bridge.jpeg"
              alt="Vuka na Amana Bridge Logo"
              className="h-8 max-w-[96px] sm:h-10 sm:max-w-[140px] w-auto object-contain rounded-md shrink-0"
            />
            <div className="leading-tight min-w-0">
              <span className="block font-display text-[13px] sm:text-lg font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] truncate">
                {t.brandName}
              </span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                Crossing Over
              </span>
            </div>
          </button>

          {/* Language Toggle (EN / SW / FR / AR) + Quiet Partner & Studio Links */}
          <div className="flex items-center gap-1 sm:gap-4 shrink-0">
            {/* Compact native select on <640px phones to prevent any horizontal clipping */}
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => onChangeLocale(e.target.value as LocaleCode)}
              className="sm:hidden min-h-[34px] px-1.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.shortCode}
                </option>
              ))}
            </select>

            {/* Full segmented EN / SW / FR / AR toggle on sm+ */}
            <div
              role="group"
              aria-label="Language switcher"
              className="hidden sm:inline-flex items-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-0.5"
            >
              {LOCALE_OPTIONS.map((opt) => {
                const active = locale === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => onChangeLocale(opt.code)}
                    aria-pressed={active}
                    title={opt.nativeLabel}
                    className={`min-h-[30px] px-2.5 rounded-md text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                        : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                    }`}
                  >
                    {opt.shortCode}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onOpenHiringPartners(currentPayload)}
              className="hidden md:inline-flex items-center text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] transition-colors whitespace-nowrap shrink-0"
            >
              {t.navHiringPartners}
            </button>

            <button
              type="button"
              onClick={() => onEnterStudio(currentPayload)}
              className="min-h-[34px] px-2 sm:px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">Studio</span>
              <span className="hidden sm:inline">{t.navEnterStudio}</span>
            </button>

            <button
              type="button"
              onClick={onOpenScaleDrawer}
              aria-label="Open Partner & Scale Mode"
              title="Partner & Scale Mode"
              data-testid="landing-open-partner-scale-drawer"
              className="inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:text-[#146C53] dark:hover:text-[#2EB88B] transition-colors shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
              className="hidden sm:inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] transition-colors shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Subtle, non-intrusive Offline PWA Enabled Mode indicator (shown only when disconnected) */}
        {!isOnline && (
          <div
            role="status"
            aria-live="polite"
            data-testid="offline-pwa-banner"
            className="border-t border-[#C4622D]/20 dark:border-[#E07B46]/25 bg-[#F9ECE5]/95 dark:bg-[#261B15]/95"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-1.5 flex items-center gap-2 text-[11px] sm:text-xs text-[#8D4119] dark:text-[#F0A47A]">
              <WifiOff className="w-3.5 h-3.5 shrink-0 text-[#C4622D] dark:text-[#E07B46]" />
              <p className="truncate sm:whitespace-normal">
                <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Offline PWA Enabled Mode
                </span>
                <span aria-hidden="true"> · </span>
                <span>
                  Progress is saved locally and will sync automatically once back online.
                </span>
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* BEAT 2: Hero Threshold with Topographic Ascent Motif */}
        <section
          id="landing-hero-section"
          aria-labelledby="landing-hero-headline"
          className="scroll-mt-16 relative overflow-hidden pt-12 pb-12 sm:pt-20 sm:pb-16"
        >
          <TopographicAscentMotif variant="landing" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-[#146C53] dark:text-[#2EB88B]">
              {t.heroEyebrow}
            </p>

            <h1
              id="landing-hero-headline"
              className="mt-4 font-display text-4xl sm:text-5xl md:text-[3.5rem] font-medium leading-[1.08] tracking-[-0.025em] text-[#17191C] dark:text-[#F4F2EE] max-w-3xl mx-auto"
            >
              {t.heroHeadline}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#575B62] dark:text-[#A3A7AE] leading-relaxed max-w-2xl mx-auto">
              {t.heroSubcopy}
            </p>

            {/* Interactive Age-Stage Selector */}
            <div className="mt-9 sm:mt-11">
              <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] mb-3">
                {t.stageSelectorLabel}
              </p>
              <div
                role="group"
                aria-label={t.stageSelectorLabel}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
              >
                {AGE_STAGES.map((stage) => {
                  const meta = getStageLabel(stage, t);
                  const active = selectedStage === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedStage(stage)}
                      className={`min-h-[42px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                        active
                          ? 'bg-[#E7F3EE] dark:bg-[#132922] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                          : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#C9C1B5] dark:hover:border-[#424752]'
                      }`}
                    >
                      {meta.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dignified Prompt Input Card */}
            <form
              onSubmit={handleHeroSubmit}
              className="mt-7 max-w-2xl mx-auto rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 text-start shadow-[0_12px_36px_rgba(23,25,28,0.04)] dark:shadow-none"
            >
              <label
                htmlFor="landing-problem-input"
                className="block font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
              >
                {t.problemInputLabel}
              </label>

              <textarea
                id="landing-problem-input"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder={t.problemInputPlaceholder}
                rows={3}
                maxLength={500}
                className="mt-3 w-full rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-3.5 text-sm sm:text-base text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] dark:placeholder:text-[#757A82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] resize-y"
              />

              {unsupportedMessage && (
                <p role="status" className="mt-2 text-xs text-[#9A5B13] dark:text-[#E5A95E]">
                  {unsupportedMessage}
                </p>
              )}

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleListening(t.voiceUnsupportedNote)}
                  aria-pressed={isListening}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                    isListening
                      ? 'bg-[#C4622D] border-[#C4622D] text-white'
                      : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F3EFE9] dark:hover:bg-[#23262B]'
                  }`}
                >
                  {isListening ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{t.voiceListeningLabel}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />
                      <span>{t.voiceStartLabel}</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>{t.beginCrossingCta}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {onPreviewCleared && (
                <div className="mt-3 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] text-center">
                  <button
                    type="button"
                    onClick={() => onPreviewCleared(currentPayload)}
                    data-testid="landing-hero-preview-cleared-btn"
                    className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Preview Where This Leads</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              )}
            </form>

            {/* Top Arrow Unit: Up to Hero Start / Down to 3-Pillar Crossing Strip */}
            <FunnelSectionArrow
              position="top"
              upTargetId="landing-hero-section"
              upLabel="Back to top"
              downTargetId="landing-pillars-section"
              downLabel="Explore the 3-pillar crossing"
              stepTag="01"
            />
          </div>
        </section>

        {/* BEAT 3: The 3-Pillar Crossing Strip with Woven-Bridge Arcs Motif */}
        <section
          id="landing-pillars-section"
          aria-labelledby="pillars-heading"
          className="scroll-mt-16 relative overflow-hidden border-t border-[#E8E3DB] dark:border-[#2C3037] py-16 sm:py-20"
        >
          <WovenBridgeArcsMotif variant="landing" />

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                {t.brandName} · {t.brandSubtitle}
              </p>
              <h2
                id="pillars-heading"
                className="mt-2.5 font-display text-2xl sm:text-4xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
              >
                {t.pillarSectionHeading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                {t.pillarSectionSubcopy}
              </p>
            </div>

            <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((pillar) => (
                <article
                  key={pillar.index}
                  className="rounded-2xl bg-white/95 dark:bg-[#1A1C20]/95 border border-[#E8E3DB] dark:border-[#2C3037] p-7 sm:p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 text-xs font-mono-tabular">
                      <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                        {pillar.index}
                      </span>
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {pillar.sdg}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {pillar.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                      {pillar.body}
                    </p>
                  </div>

                  <div className="mt-7 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    <span>Amana Verification Layer</span>
                    <span aria-hidden="true" className="text-[#146C53] dark:text-[#2EB88B]">
                      ●
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Middle Arrow Unit: Up to Hero / Down to Age-Versatility Preview */}
            <FunnelSectionArrow
              position="middle"
              upTargetId="landing-hero-section"
              upLabel="Back to problem input"
              downTargetId="landing-age-section"
              downLabel="Preview your age-stage pathway"
              stepTag="02"
            />
          </div>
        </section>

        {/* BEAT 4: Interactive Age-Versatility Preview & Final Handoff Band with Ripple Constellation Motif */}
        <section
          id="landing-age-section"
          aria-labelledby="age-versatility-heading"
          className="scroll-mt-16 relative overflow-hidden border-t border-[#E8E3DB] dark:border-[#2C3037] py-16 sm:py-20"
        >
          <RippleConstellationMotif variant="landing" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2
                id="age-versatility-heading"
                className="font-display text-2xl sm:text-4xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
              >
                {t.ageVersatilityHeading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                {t.ageVersatilitySubcopy}
              </p>
            </div>

            {/* Interactive Bracket Tabs */}
            <div
              role="tablist"
              aria-label="Preview pathway by age bracket"
              className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3"
            >
              {AGE_STAGES.map((stage) => {
                const meta = getStageLabel(stage, t);
                const active = selectedStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedStage(stage)}
                    className={`min-h-[56px] px-4 py-3 rounded-xl border text-start transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                      active
                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53] dark:border-[#2EB88B] shadow-xs'
                        : 'bg-white/75 dark:bg-[#1A1C20]/70 border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5] dark:hover:border-[#424752]'
                    }`}
                  >
                    <span
                      className={`block text-xs sm:text-sm font-semibold ${
                        active
                          ? 'text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#17191C] dark:text-[#F4F2EE]'
                      }`}
                    >
                      {meta.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#575B62] dark:text-[#A3A7AE] line-clamp-1">
                      {meta.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Smooth Animated Pathway Preview Panel */}
            <div className="mt-5">
              <div
                key={selectedStage}
                role="tabpanel"
                className="vuka-fade-in rounded-2xl bg-white/95 dark:bg-[#1A1C20]/95 border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-9"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                  <div>
                    <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      {activeStageMeta.title}
                    </p>
                    <h3 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {activePathway.headline}
                    </h3>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                    Track · {selectedStage}
                  </span>
                </div>

                <p className="mt-5 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed max-w-3xl">
                  {activePathway.summary}
                </p>

                <dl className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 pt-6 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                  <div>
                    <dt className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      Verification Pathway
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {activePathway.verificationMode}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      Paid Work Structure
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {activePathway.workFormat}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      Cross-Age Pod Role
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {activePathway.mentorshipRole}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      Typical First Milestone
                    </dt>
                    <dd className="mt-1 text-sm font-semibold font-mono-tabular text-[#146C53] dark:text-[#2EB88B]">
                      {activePathway.typicalFirstBrief}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Calm Closing Handoff Band */}
            <div className="mt-16 pt-12 border-t border-[#E8E3DB] dark:border-[#2C3037] text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                {t.closingHeading}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] max-w-xl mx-auto leading-relaxed">
                {t.closingBody}
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => onBeginCrossing(currentPayload)}
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  <span>{t.beginCrossingCta}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenHiringPartners(currentPayload)}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-sm font-medium text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap"
                >
                  {t.navHiringPartners}
                </button>
              </div>
            </div>

            {/* Bottom Arrow Unit: Up to 3-Pillar Strip / Down to Tagline Footer Anchor */}
            <FunnelSectionArrow
              position="bottom"
              upTargetId="landing-pillars-section"
              upLabel="Back to 3 pillars"
              downTargetId="landing-footer-anchor"
              downLabel="Our guiding promise"
              stepTag="03"
            />
          </div>
        </section>
      </main>

      {/* Editorial Tagline Footer Anchor at the very bottom of the landing page */}
      <footer
        id="landing-footer-anchor"
        data-testid="landing-footer-anchor"
        className="scroll-mt-16 border-t border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] py-10 sm:py-14 px-4 sm:px-6 text-center"
      >
        <div className="max-w-3xl mx-auto space-y-2.5">
          <p className="font-display text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
            Encourage the dream. Acknowledge the skill. Attain the work.
          </p>
          <p className="text-sm sm:text-base font-medium text-[#146C53] dark:text-[#2EB88B]">
            Turning sidelined talent into active impact.
          </p>
        </div>
      </footer>
    </div>
  );
};
