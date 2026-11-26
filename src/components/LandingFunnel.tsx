import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Globe,
  HelpCircle,
  Keyboard,
  Mic,
  Moon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AgeStage, LocaleCode, ThemeMode } from '../types/kora';
import {
  LOCALE_OPTIONS,
  getStageLabel,
  type TranslationDictionary,
} from '../utils/i18n';
import { AGE_STAGE_PATHWAYS, AGE_GROUP_PROBLEM_IDEAS } from '../utils/talentEngine';
import { useSpeechInput } from '../hooks/useSpeechInput';
import {
  RippleConstellationMotif,
  TopographicAscentMotif,
  WovenBridgeArcsMotif,
} from './ResilienceMotifs';

interface FunnelSectionArrowProps {
  position: 'top' | 'middle' | 'solve' | 'bottom';
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
  onDraftChange?: (payload: { problemStatement: string; ageStage: AgeStage }) => void;
  onOpenCommandPalette?: () => void;
  onOpenAccessComfort?: () => void;
  hasCustomAccessComfort?: boolean;
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
  onDraftChange,
  onOpenCommandPalette,
  onOpenAccessComfort,
  hasCustomAccessComfort = false,
  onOpenScaleDrawer,
  t,
}) => {
  const [selectedStage, setSelectedStage] = useState<AgeStage>(initialStage);
  const [problemStatement, setProblemStatement] = useState<string>(initialProblem);
  const [isHelperPinned, setIsHelperPinned] = useState<boolean>(false);
  const [isHelperHovered, setIsHelperHovered] = useState<boolean>(false);
  const showProblemHelper = isHelperPinned || isHelperHovered;
  const problemHelperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showProblemHelper) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (
        problemHelperRef.current &&
        !problemHelperRef.current.contains(event.target as Node)
      ) {
        setIsHelperPinned(false);
        setIsHelperHovered(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsHelperPinned(false);
        setIsHelperHovered(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showProblemHelper]);

  const handleSelectStage = (stage: AgeStage) => {
    setSelectedStage(stage);
    onDraftChange?.({ problemStatement: problemStatement.trim(), ageStage: stage });
  };

  const handleChangeProblem = (nextText: string) => {
    setProblemStatement(nextText);
    onDraftChange?.({ problemStatement: nextText.trim(), ageStage: selectedStage });
  };

  const { isListening, unsupportedMessage, toggleListening } = useSpeechInput(
    speechLang,
    (spoken) => {
      setProblemStatement((prev) => {
        const nextVal = prev.trim() ? `${prev.trim()} ${spoken}` : spoken;
        onDraftChange?.({ problemStatement: nextVal.trim(), ageStage: selectedStage });
        return nextVal;
      });
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
        <div className="max-w-7xl mx-auto min-h-[60px] px-3 sm:px-5 lg:px-6 py-2 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Wordmark + Official Bridge Logo (never truncated) */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Vuka na Amana — Crossing Over"
            data-testid="landing-brand-home-btn"
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md py-1 cursor-pointer"
          >
            <img
              src="/bridge.jpeg"
              alt="Vuka na Amana Bridge Logo"
              className="h-6 max-w-[68px] sm:h-7 sm:max-w-[84px] w-auto object-contain rounded-md shrink-0"
            />
            <div className="leading-tight shrink-0">
              <span className="block font-display text-[15px] sm:text-[18px] lg:text-[20px] font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] whitespace-nowrap">
                {t.brandName}
              </span>
              <span className="hidden sm:block text-[9.5px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                Crossing Over
              </span>
            </div>
          </button>

          {/* Language Toggle (EN / SW / FR / AR) + Quiet Partner, Studio & Utility Controls */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-0">
            {/* Compact native select on <lg screens to keep Vuka na Amana spacious and uncrowded */}
            <select
              aria-label="Language"
              value={locale}
              onChange={(e) => onChangeLocale(e.target.value as LocaleCode)}
              className="lg:hidden min-h-[36px] px-1.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] shrink-0"
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.shortCode}
                </option>
              ))}
            </select>

            {/* Full segmented EN / SW / FR / AR toggle on lg+ */}
            <div
              role="group"
              aria-label="Language switcher"
              className="hidden lg:inline-flex items-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-0.5 shrink-0"
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
                    className={`min-h-[30px] px-2 rounded-md text-[11px] font-semibold tracking-wide transition-colors whitespace-nowrap cursor-pointer ${
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

            {onOpenAccessComfort && (
              <button
                type="button"
                onClick={onOpenAccessComfort}
                aria-label="Access & Comfort Settings"
                title="Access & Comfort Settings (WCAG 2.2)"
                data-testid="landing-open-access-comfort-btn"
                className={`inline-flex min-h-[36px] min-w-[36px] sm:min-h-[38px] px-2 sm:px-2.5 items-center justify-center gap-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  hasCustomAccessComfort
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                    : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 2xl:inline text-xs font-medium">Access</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenHiringPartners(currentPayload)}
              className="hidden md:inline-flex items-center min-h-[36px] px-2 text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.navHiringPartners}
            </button>

            <button
              type="button"
              onClick={() => onEnterStudio(currentPayload)}
              className="min-h-[36px] px-2.5 sm:px-3 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="sm:hidden">Studio</span>
              <span className="hidden sm:inline">{t.navEnterStudio}</span>
            </button>

            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                aria-label="Search stages, guides, glossary (press / or Cmd+K)"
                title="Search stages, guides, glossary (/ or ⌘K)"
                data-testid="landing-open-command-palette-btn"
                className="inline-flex min-h-[36px] min-w-[36px] sm:min-h-[38px] px-2 xl:px-3 xl:min-w-[190px] items-center justify-center xl:justify-between gap-2 rounded-full border border-[#D8D1C5] dark:border-[#343A44] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] focus-visible:outline-none focus-visible:border-[#146C53] dark:focus-visible:border-[#2EB88B] transition-colors shrink-0 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <Search className="w-3.5 h-3.5 text-[#17191C] dark:text-[#F4F2EE] shrink-0" />
                  <span className="hidden xl:inline text-xs font-normal text-[#525866] dark:text-[#A3A7AE] truncate">
                    Search app…
                  </span>
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 shrink-0">
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    /
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-[#E2DCD2] dark:border-[#2F343D] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    ⌘K
                  </kbd>
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenScaleDrawer}
              aria-label="Open Partner & Scale Mode"
              title="Partner & Scale Mode"
              data-testid="landing-open-partner-scale-drawer"
              className="hidden sm:inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:text-[#146C53] dark:hover:text-[#2EB88B] transition-colors shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="hidden sm:inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] transition-colors shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
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
                      onClick={() => handleSelectStage(stage)}
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
              <div className="flex items-start justify-between gap-2">
                <label
                  htmlFor="landing-problem-input"
                  className="block font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {t.problemInputLabel}
                </label>

                {/* '?' Helper Tooltip explaining Pod Sprint matching impact */}
                <div
                  ref={problemHelperRef}
                  className="relative shrink-0"
                  onMouseEnter={() => setIsHelperHovered(true)}
                  onMouseLeave={() => setIsHelperHovered(false)}
                >
                  <button
                    type="button"
                    data-testid="problem-input-helper-btn"
                    aria-label="Why describing specific real-world problems improves Pod Sprint matching"
                    aria-expanded={showProblemHelper}
                    aria-controls="problem-matching-helper-tooltip"
                    onClick={() => setIsHelperPinned((prev) => !prev)}
                    onFocus={() => setIsHelperHovered(true)}
                    onBlur={() => setIsHelperHovered(false)}
                    className={`min-h-[36px] min-w-[36px] rounded-lg border inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer ${
                      showProblemHelper
                        ? 'bg-[#E7F3EE] dark:bg-[#132922] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] hover:border-[#146C53]/50 dark:hover:border-[#2EB88B]/50'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {showProblemHelper && (
                    <div
                      id="problem-matching-helper-tooltip"
                      role="tooltip"
                      data-testid="problem-input-helper-tooltip"
                      className="absolute end-0 top-full mt-2 z-30 w-72 sm:w-80 max-w-[calc(100vw-3rem)] rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 shadow-[0_12px_32px_rgba(23,25,28,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] text-start"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          Why specific problems improve your match
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHelperPinned(false);
                            setIsHelperHovered(false);
                          }}
                          aria-label="Close helper tooltip"
                          className="p-0.5 rounded text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                        Describing concrete, real-world problems you know how to solve—rather than broad job titles—helps our matching engine connect your proven skills directly to scoped Pod Sprints, domain mentors, and paid partner briefs.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <textarea
                id="landing-problem-input"
                aria-describedby={showProblemHelper ? 'problem-matching-helper-tooltip' : undefined}
                value={problemStatement}
                onChange={(e) => handleChangeProblem(e.target.value)}
                placeholder={t.problemInputPlaceholder}
                rows={3}
                maxLength={500}
                className="mt-3 w-full rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-3.5 text-sm sm:text-base text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] dark:placeholder:text-[#757A82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] resize-y"
              />

              {unsupportedMessage && (
                <p role="status" aria-live="polite" className="mt-2 text-xs text-[#9A5B13] dark:text-[#E5A95E]">
                  {unsupportedMessage}
                </p>
              )}

              {/* Dynamic Age-Stage Clickable Problem Example Chips (GSMA Non-Voice Inclusion Parity) */}
              <div
                data-testid="landing-quick-pick-parity"
                className="mt-3.5 pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Keyboard className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" aria-hidden="true" />
                    <span>
                      Starter ideas for <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">{activeStageMeta.title}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Click to pre-populate</span>
                  </span>
                </div>

                <div
                  data-testid="age-stage-problem-examples"
                  role="group"
                  aria-label={`Problem examples for ${activeStageMeta.title}`}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {(AGE_GROUP_PROBLEM_IDEAS[selectedStage] || AGE_GROUP_PROBLEM_IDEAS['18-29']).map((starter) => {
                    const isSelected = problemStatement.trim() === starter.trim();
                    return (
                      <button
                        key={starter}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          handleChangeProblem(starter);
                          document.getElementById('landing-problem-input')?.focus();
                        }}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] cursor-pointer ${
                          isSelected
                            ? 'bg-[#E7F3EE] dark:bg-[#132922] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B]'
                            : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                        <span>{starter}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleListening(t.voiceUnsupportedNote)}
                    aria-pressed={isListening}
                    className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
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
                    type="button"
                    onClick={() => document.getElementById('landing-problem-input')?.focus()}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                    <span>Type Instead</span>
                  </button>
                </div>

                <button
                  type="submit"
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{t.beginCrossingCta}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <span>Protected by 2FA OTP or No-Phone Dedicated PIN</span>
                </span>
                {onPreviewCleared && (
                  <button
                    type="button"
                    onClick={() => onPreviewCleared(currentPayload)}
                    data-testid="landing-hero-preview-cleared-btn"
                    className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Preview Where This Leads</span>
                    <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
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

            {/* Middle Arrow Unit: Up to Hero / Down to Solve & Pod Sprints */}
            <FunnelSectionArrow
              position="middle"
              upTargetId="landing-hero-section"
              upLabel="Back to problem input"
              downTargetId="landing-solve-section"
              downLabel="How Solve & Pod Sprints work"
              stepTag="02"
            />
          </div>
        </section>

        {/* BEAT 3.5: The Solve Phase & Pod Sprints Architecture */}
        <section
          id="landing-solve-section"
          data-testid="landing-solve-section"
          aria-labelledby="landing-solve-heading"
          className="scroll-mt-16 relative overflow-hidden border-t border-[#E8E3DB] dark:border-[#2C3037] py-16 sm:py-20 bg-white/55 dark:bg-[#16181C]/60"
        >
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C4622D] dark:text-[#E07B46]">
                  Stage 3 · The Solve Phase
                </p>
                <h2
                  id="landing-solve-heading"
                  className="mt-2.5 font-display text-2xl sm:text-4xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
                >
                  How Pod Sprints turn verified skill into paid community impact
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Once your skills are verified, the Solve phase matches you into a <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">Pod Sprint</strong>—a focused 1-to-2-week collaborative problem-solving unit addressing real operational briefs from clinics, co-ops, NGOs, and remote engineering teams.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onBeginCrossing(currentPayload)}
                data-testid="landing-solve-cta-btn"
                className="self-start lg:self-end min-h-[44px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Enter Solve &amp; Pod Sprints</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      POD STRUCTURE · 01
                    </span>
                    <Users className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    Cross-Age 2-Person Pods
                  </h3>
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Every Pod Sprint pairs a <strong className="text-[#17191C] dark:text-[#F4F2EE]">30–46+ Specialist Lead</strong> (quality review, architecture, safety sign-off) with a <strong className="text-[#17191C] dark:text-[#F4F2EE]">15–29 Delivery Partner</strong> (field diagnostics, drafting, testing) across refugee and host communities.
                  </p>
                </div>
                <p className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  ILO Upgraded Apprenticeship Model
                </p>
              </article>

              <article className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                      CADENCE · 02
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    3 Tracked Delivery Milestones
                  </h3>
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Pods advance through three clear checkpoints—<strong className="text-[#17191C] dark:text-[#F4F2EE]">Analysis Complete</strong>, <strong className="text-[#17191C] dark:text-[#F4F2EE]">Draft Ready</strong>, and <strong className="text-[#17191C] dark:text-[#F4F2EE]">Final Submission</strong>—with offline-first drafting and direct mentor messaging.
                  </p>
                </div>
                <p className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  1–2 Week Scoped Partner Briefs
                </p>
              </article>

              <article className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-7 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      OUTCOME · 03
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    Verified Impact &amp; Escrow Payouts
                  </h3>
                  <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                    Submitting your Pod Sprint automatically appends audited hours and outcomes to your <strong className="text-[#17191C] dark:text-[#F4F2EE]">Proof Ledger</strong>, releases escrow stipends to your compliant rail, and updates live UN SDG impact telemetry.
                  </p>
                </div>
                <p className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  SDG 8 Decent Work · SDG 10 Cohesion
                </p>
              </article>
            </div>

            <FunnelSectionArrow
              position="solve"
              upTargetId="landing-pillars-section"
              upLabel="Back to 3 pillars"
              downTargetId="landing-age-section"
              downLabel="Preview your age-stage pathway"
              stepTag="03"
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
                    onClick={() => handleSelectStage(stage)}
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
              <p className="mt-3 inline-flex items-center justify-center gap-1.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                <span>2FA / Dedicated PIN verification required before entering the Crossing Studio</span>
              </p>
            </div>

            {/* Bottom Arrow Unit: Up to Solve & Pod Sprints / Down to Tagline Footer Anchor */}
            <FunnelSectionArrow
              position="bottom"
              upTargetId="landing-solve-section"
              upLabel="Back to Pod Sprints"
              downTargetId="landing-footer-anchor"
              downLabel="Our guiding promise"
              stepTag="04"
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
